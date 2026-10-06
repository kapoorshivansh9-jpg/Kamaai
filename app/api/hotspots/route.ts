// Real "where to stand" places per gig type.
//
// FIRST CHOICE — our own Supabase copy of Delhi-NCR places (places-schema.sql):
// named clusters of food / nightlife places with a pin and a count, plus single
// places (metro stations, malls, societies…). Fast, and it does not depend on a
// public server being free.
//
// FALLBACK — the old live lookup below, used only when the database is not set
// up or has nothing near the rider:
// Real, live "where to stand" places per gig type, from OpenStreetMap (Overpass)
// — free, no key. Each profession queries DIFFERENT POI types: food riders get
// restaurants & cafés; cabs get malls, hotels & nightlife; autos/bike-taxis get
// metro stations, bus stands & markets; quick-commerce gets grocery & markets.
// Mirrors the resilient pattern in /api/water (race mirrors, hard timeout, cache).

import { z } from "zod";
import { supabaseEnv } from "@/lib/supabase-env";
import { KIND_LABEL, PROF_PLACE_KINDS, PROF_CLUSTER_GROUPS, type Cluster, type PlaceSpot } from "@/lib/places";

const Q = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  prof: z.enum(["food", "qcom", "cab", "auto", "biketx"]).default("food"),
});

const RADIUS_M = 5000;
const TIMEOUT_MS = 7000;
const TTL = 15 * 60 * 1000;
const cache = new Map<string, { at: number; data: Spot[] }>();

interface Spot { name: string; kind: string; lat: number; lon: number; distKm: number; score: number; area: string | null; }
interface Area { name: string; distKm: number; spots: Spot[]; }
interface OsmEl { lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string>; }

// Group the real places by their OSM neighbourhood (addr:suburb etc.), so the
// app can say "head to <area>" and list the live spots inside it. Areas are all
// within the 5 km search, sorted nearest-first.
function buildAreas(spots: Spot[]): Area[] {
  const m = new Map<string, Spot[]>();
  for (const s of spots) {
    if (!s.area) continue;
    const list = m.get(s.area) ?? [];
    list.push(s);
    m.set(s.area, list);
  }
  return [...m.entries()]
    .map(([name, ss]) => ({ name, distKm: Math.min(...ss.map((s) => s.distKm)), spots: ss.sort((a, b) => b.score - a.score || a.distKm - b.distKm) }))
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, 6);
}

// Quality score so we surface notable, real, recognisable places — not just the
// nearest random POI. OSM "wikidata/wikipedia" = notable; "brand" = known chain;
// "opening_hours" = an actively-maintained entry; closeness adds a little.
function qualityScore(tags: Record<string, string>, distKm: number): number {
  let s = 0;
  if (tags.wikidata || tags.wikipedia) s += 4;
  if (tags.brand) s += 2;
  if (tags.opening_hours) s += 1;
  if (tags.cuisine || tags.stars || tags["brand:wikidata"]) s += 1;
  s += Math.max(0, 3 - distKm); // up to +3 for being within ~3 km
  return Math.round(s * 10) / 10;
}

// ── Database path ─────────────────────────────────────────────
const DB_TIMEOUT_MS = 5000;
const dbCache = new Map<string, { at: number; data: { clusters: Cluster[]; spots: PlaceSpot[] } }>();
const DB_TTL = 5 * 60 * 1000; // short: rider votes should show up soon

async function rpc<T>(fn: string, body: Record<string, unknown>): Promise<T[] | null> {
  const env = supabaseEnv();
  if (!env) return null;
  const { url, key } = env;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), DB_TIMEOUT_MS);
  try {
    const r = await fetch(`${url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!r.ok) return null;
    const j = await r.json();
    return Array.isArray(j) ? (j as T[]) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

interface ClusterRow { key: string; name: string; lat: number; lon: number; dist_km: number; place_count: number; radius_m: number; kinds: Record<string, number> | null; top_places: string[] | null; societies_nearby: number; busy: number; quiet: number }
interface PlaceRow { name: string; kind: string; lat: number; lon: number; dist_km: number; notable: boolean }

/** Clusters + single places from our own database, or null when it has nothing to offer here. */
async function fromDatabase(lat: number, lon: number, prof: string): Promise<{ clusters: Cluster[]; spots: PlaceSpot[] } | null> {
  const groups = PROF_CLUSTER_GROUPS[prof] ?? [];
  const [places, ...clusterSets] = await Promise.all([
    rpc<PlaceRow>("nearby_places", { p_lat: lat, p_lon: lon, p_kinds: PROF_PLACE_KINDS[prof] ?? [], p_radius_km: 6, p_limit: 8 }),
    ...groups.map((g) => rpc<ClusterRow>("nearby_clusters", { p_lat: lat, p_lon: lon, p_grp: g, p_radius_km: 6, p_limit: 30 })),
  ]);
  const clusters: Cluster[] = clusterSets.flatMap((rows, i) =>
    (rows ?? []).map((c) => ({
      key: c.key, name: c.name, lat: c.lat, lon: c.lon, distKm: Number(c.dist_km), placeCount: c.place_count, radiusM: c.radius_m,
      kinds: c.kinds ?? {}, topPlaces: c.top_places ?? [], societiesNearby: c.societies_nearby, busy: c.busy, quiet: c.quiet, grp: groups[i],
    })));
  const spots: PlaceSpot[] = (places ?? []).map((p) => ({ name: p.name, kind: KIND_LABEL[p.kind] ?? "Spot", lat: p.lat, lon: p.lon, distKm: Number(p.dist_km), notable: p.notable }));
  return clusters.length || spots.length ? { clusters, spots } : null;
}

const MIRRORS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

// OSM tag filters to fetch per profession (each emitted as node + way).
function clausesFor(prof: string): string[] {
  switch (prof) {
    case "cab":
      return ['["shop"="mall"]', '["tourism"="hotel"]', '["amenity"~"bar|pub|nightclub"]'];
    case "auto":
    case "biketx":
      return ['["railway"="station"]', '["railway"="subway_entrance"]', '["amenity"="bus_station"]', '["amenity"="marketplace"]', '["shop"="mall"]'];
    case "qcom":
      return ['["shop"~"supermarket|convenience"]', '["amenity"="marketplace"]'];
    default: // food
      return ['["amenity"~"restaurant|fast_food"]', '["amenity"="cafe"]', '["shop"="bakery"]', '["amenity"="ice_cream"]'];
  }
}

function kindOf(tags: Record<string, string>): string {
  if (tags.railway) return "Metro";
  if (tags.amenity === "bus_station") return "Bus stand";
  if (tags.amenity === "restaurant") return "Restaurant";
  if (tags.amenity === "fast_food") return "Fast food";
  if (tags.amenity === "cafe") return "Café";
  if (tags.amenity === "ice_cream") return "Ice cream";
  if (tags.shop === "bakery") return "Bakery";
  if (tags.amenity === "marketplace") return "Market";
  if (["bar", "pub", "nightclub"].includes(tags.amenity || "")) return "Nightlife";
  if (tags.shop === "mall") return "Mall";
  if (tags.shop === "supermarket" || tags.shop === "convenience") return "Grocery";
  if (tags.tourism === "hotel") return "Hotel";
  return "Spot";
}

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

async function fetchSpots(lat: number, lon: number, prof: string): Promise<Spot[]> {
  const around = `(around:${RADIUS_M},${lat},${lon})`;
  const body = clausesFor(prof)
    .map((c) => `node${c}${around};way${c}${around};`)
    .join("");
  const query = `[out:json][timeout:15];(${body});out center 80;`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const json = await Promise.any(
      MIRRORS.map(async (m) => {
        // Public Overpass servers ask every client to identify itself.
        const r = await fetch(m + "?data=" + encodeURIComponent(query), { signal: ctrl.signal, headers: { Accept: "application/json", "User-Agent": "RideKamao/1.0 (https://ridekamao.in)" } });
        if (!r.ok) throw new Error("overpass " + r.status);
        const j = await r.json();
        if (!Array.isArray(j?.elements)) throw new Error("no elements");
        return j;
      })
    );
    const els: OsmEl[] = json.elements;
    return els
      .map((e) => {
        const la = e.lat ?? e.center?.lat;
        const lo = e.lon ?? e.center?.lon;
        const tags = e.tags || {};
        const name = tags["name:en"] || tags.name;
        if (la == null || lo == null || !name) return null;
        const distKm = Math.round(haversineKm(lat, lon, la, lo) * 10) / 10;
        const area = tags["addr:suburb"] || tags["addr:neighbourhood"] || tags["addr:city_district"] || tags["addr:quarter"] || null;
        return { name, kind: kindOf(tags), lat: la, lon: lo, distKm, score: qualityScore(tags, distKm), area };
      })
      .filter((s): s is Spot => s !== null)
      // Drop duplicate chains (e.g. two "Starbucks") — keep the best-scored one.
      .reduce<Spot[]>((acc, s) => {
        const i = acc.findIndex((x) => x.name.toLowerCase() === s.name.toLowerCase());
        if (i === -1) acc.push(s);
        else if (s.score > acc[i].score) acc[i] = s;
        return acc;
      }, [])
      // Best-quality first, nearest as the tie-breaker.
      .sort((a, b) => b.score - a.score || a.distKm - b.distKm)
      .slice(0, 60);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = Q.safeParse({ lat: url.searchParams.get("lat"), lon: url.searchParams.get("lon"), prof: url.searchParams.get("prof") ?? undefined });
  if (!parsed.success) return Response.json({ spots: [] }, { status: 400 });

  const { lat, lon, prof } = parsed.data;
  const ck = `${prof}:${lat.toFixed(2)},${lon.toFixed(2)}`;

  const dbHit = dbCache.get(ck);
  if (dbHit && Date.now() - dbHit.at < DB_TTL) return Response.json({ source: "db", areas: [], ...dbHit.data });
  const db = await fromDatabase(lat, lon, prof);
  if (db) {
    if (dbCache.size > 500) dbCache.clear();
    dbCache.set(ck, { at: Date.now(), data: db });
    return Response.json({ source: "db", areas: [], ...db });
  }

  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < TTL) return Response.json({ source: "osm-live", clusters: [], areas: buildAreas(hit.data), spots: hit.data });

  const spots = await Promise.race<Spot[]>([
    fetchSpots(lat, lon, prof),
    new Promise<Spot[]>((res) => setTimeout(() => res([]), TIMEOUT_MS + 500)),
  ]);
  if (spots.length) cache.set(ck, { at: Date.now(), data: spots });
  return Response.json({ source: "osm-live", clusters: [], areas: buildAreas(spots), spots });
}
