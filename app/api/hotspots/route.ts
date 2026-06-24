// Real, live "where to stand" places per gig type, from OpenStreetMap (Overpass)
// — free, no key. Each profession queries DIFFERENT POI types: food riders get
// restaurants & cafés; cabs get malls, hotels & nightlife; autos/bike-taxis get
// metro stations, bus stands & markets; quick-commerce gets grocery & markets.
// Mirrors the resilient pattern in /api/water (race mirrors, hard timeout, cache).

import { z } from "zod";

const Q = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  prof: z.enum(["food", "qcom", "cab", "auto", "biketx"]).default("food"),
});

const RADIUS_M = 4000;
const TIMEOUT_MS = 7000;
const TTL = 15 * 60 * 1000;
const cache = new Map<string, { at: number; data: Spot[] }>();

interface Spot { name: string; kind: string; lat: number; lon: number; distKm: number; score: number; }
interface OsmEl { lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string>; }

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
        const r = await fetch(m + "?data=" + encodeURIComponent(query), { signal: ctrl.signal, headers: { Accept: "application/json" } });
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
        return { name, kind: kindOf(tags), lat: la, lon: lo, distKm, score: qualityScore(tags, distKm) };
      })
      .filter((s): s is Spot => s !== null)
      // Best-quality first, nearest as the tie-breaker.
      .sort((a, b) => b.score - a.score || a.distKm - b.distKm)
      .slice(0, 24);
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
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < TTL) return Response.json({ spots: hit.data });

  const spots = await Promise.race<Spot[]>([
    fetchSpots(lat, lon, prof),
    new Promise<Spot[]>((res) => setTimeout(() => res([]), TIMEOUT_MS + 500)),
  ]);
  if (spots.length) cache.set(ck, { at: Date.now(), data: spots });
  return Response.json({ spots });
}
