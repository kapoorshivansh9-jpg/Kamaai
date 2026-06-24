// Live road congestion near the rider, from TomTom Traffic Flow (free tier,
// ~2,500 calls/day). Needs TOMTOM_API_KEY — without it this returns
// { available: false } and the UI simply hides the traffic chip (graceful).
// Get a free key at developer.tomtom.com.

import { z } from "zod";

const Q = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

const TTL = 4 * 60 * 1000; // traffic changes fast — short cache
const cache = new Map<string, { at: number; data: unknown }>();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = Q.safeParse({ lat: url.searchParams.get("lat"), lon: url.searchParams.get("lon") });
  if (!parsed.success) return Response.json({ available: false }, { status: 400 });

  const key = process.env.TOMTOM_API_KEY;
  if (!key) return Response.json({ available: false });

  const { lat, lon } = parsed.data;
  const ck = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < TTL) return Response.json(hit.data);

  try {
    const api = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${lat},${lon}&key=${key}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch(api, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) return Response.json({ available: false });
    const j = await r.json();
    const f = j?.flowSegmentData;
    if (!f?.freeFlowSpeed || !f?.currentSpeed) return Response.json({ available: false });
    const ratio = f.currentSpeed / f.freeFlowSpeed; // 1 = free-flowing, →0 = jammed
    const level = ratio < 0.5 ? "heavy" : ratio < 0.78 ? "moderate" : "light";
    const data = { available: true, level, ratio: Math.round(ratio * 100) / 100, currentSpeed: f.currentSpeed, freeFlowSpeed: f.freeFlowSpeed };
    cache.set(ck, { at: Date.now(), data });
    return Response.json(data);
  } catch {
    return Response.json({ available: false });
  }
}
