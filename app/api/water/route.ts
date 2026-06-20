// Nearby free / public drinking-water points within 5 km of the rider, from
// OpenStreetMap (Overpass) — free, no key. Sorted by real distance. Public
// Overpass instances rate-limit / 504 under load, so we race a few mirrors and
// hard-cap the whole thing with Promise.race so the Heat page never waits long.
// On any failure it returns { points: [] } and the page shows sample points.

import { z } from "zod";

const Q = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

const RADIUS_M = 5000;
const TIMEOUT_MS = 7000;
const cache = new Map<string, { at: number; data: WaterPoint[] }>();
const TTL = 15 * 60 * 1000;

interface WaterPoint { name: string | null; lat: number; lon: number; distKm: number }
interface OsmNode { lat: number; lon: number; tags?: Record<string, string> }

const MIRRORS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

async function fetchWater(lat: number, lon: number): Promise<WaterPoint[]> {
  const query =
    `[out:json][timeout:15];(` +
    `node["amenity"="drinking_water"](around:${RADIUS_M},${lat},${lon});` +
    `node["amenity"="water_point"](around:${RADIUS_M},${lat},${lon});` +
    `node["man_made"="water_tap"](around:${RADIUS_M},${lat},${lon});` +
    `);out body 60;`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const body = await Promise.any(
      MIRRORS.map(async (m) => {
        const r = await fetch(m + "?data=" + encodeURIComponent(query), {
          signal: ctrl.signal,
          headers: { Accept: "application/json" },
        });
        if (!r.ok) throw new Error("overpass " + r.status);
        const j = await r.json();
        if (!Array.isArray(j?.elements)) throw new Error("no elements");
        return j;
      })
    );
    const nodes: OsmNode[] = body.elements;
    return nodes
      .filter((n) => typeof n.lat === "number" && typeof n.lon === "number")
      .map((n) => ({
        name: n.tags?.["name:en"] || n.tags?.name || null,
        lat: n.lat,
        lon: n.lon,
        distKm: Math.round(haversineKm(lat, lon, n.lat, n.lon) * 10) / 10,
      }))
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, 8);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = Q.safeParse({ lat: url.searchParams.get("lat"), lon: url.searchParams.get("lon") });
  if (!parsed.success) return Response.json({ points: [] }, { status: 400 });

  const { lat, lon } = parsed.data;
  const ck = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < TTL) return Response.json({ points: hit.data });

  // Hard cap: the handler always resolves within TIMEOUT_MS even if every
  // mirror hangs at the socket level.
  const points = await Promise.race<WaterPoint[]>([
    fetchWater(lat, lon),
    new Promise<WaterPoint[]>((res) => setTimeout(() => res([]), TIMEOUT_MS + 500)),
  ]);
  if (points.length) cache.set(ck, { at: Date.now(), data: points });
  return Response.json({ points });
}
