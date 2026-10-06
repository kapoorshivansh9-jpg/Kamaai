// 5-day weather + air-quality outlook for the rider's area — via Open-Meteo
// (free, no key). Same privacy rule as /api/conditions: the caller coarsens the
// coordinates (~1 km) and they are never stored, only used for the lookup.
// On any upstream failure this returns { ok: false } and the Heat tab retries
// from the browser (Open-Meteo is CORS-enabled).

import { z } from "zod";
import { fetchForecast, type Forecast } from "@/lib/forecast";

const Q = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

const TTL = 30 * 60 * 1000; // forecasts update hourly at most
const TIMEOUT_MS = 8000;
const cache = new Map<string, { at: number; data: Forecast }>();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = Q.safeParse({ lat: url.searchParams.get("lat"), lon: url.searchParams.get("lon") });
  if (!parsed.success) return Response.json({ ok: false }, { status: 400 });

  const { lat, lon } = parsed.data;
  const ck = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < TTL) return Response.json(hit.data);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const data = await fetchForecast(lat, lon, ctrl.signal);
    if (!data) return Response.json({ ok: false }, { status: 502 });
    if (cache.size > 500) cache.clear(); // bounded memory on a warm instance
    cache.set(ck, { at: Date.now(), data });
    return Response.json(data);
  } finally {
    clearTimeout(timer);
  }
}
