// Live weather + AQI for the rider's area — via Open-Meteo, which is FREE and
// needs NO API key or signup. Falls back to { live: false } only if the
// upstream calls fail. Coordinates are coarsened by the caller (~1 km) and
// never stored — only used to call the weather/AQI service.

import { z } from "zod";

const Q = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

type Level = "safe" | "mod" | "high" | "ext";

const cache = new Map<string, { at: number; data: unknown }>();
const TTL = 10 * 60 * 1000; // 10 min — weather doesn't change faster

function levelFromFeels(f: number): Level {
  if (f >= 45) return "ext";
  if (f >= 40) return "high";
  if (f >= 36) return "mod";
  return "safe";
}

// India CPCB National AQI — the scale Indian sites (aqi.in, SAFAR, etc.) use.
// Sub-index per pollutant, AQI = max. [cLow, cHigh, iLow, iHigh] per band.
function subIndex(c: number, bands: number[][]): number {
  for (const [cl, ch, il, ih] of bands) {
    if (c <= ch) return Math.round(((ih - il) / (ch - cl)) * (c - cl) + il);
  }
  return 500;
}
const PM25_BANDS = [[0, 30, 0, 50], [30, 60, 51, 100], [60, 90, 101, 200], [90, 120, 201, 300], [120, 250, 301, 400], [250, 500, 401, 500]];
const PM10_BANDS = [[0, 50, 0, 50], [50, 100, 51, 100], [100, 250, 101, 200], [250, 350, 201, 300], [350, 430, 301, 400], [430, 600, 401, 500]];
function indianAqi(pm25: number | null, pm10: number | null): number | null {
  const idx: number[] = [];
  if (typeof pm25 === "number") idx.push(subIndex(pm25, PM25_BANDS));
  if (typeof pm10 === "number") idx.push(subIndex(pm10, PM10_BANDS));
  return idx.length ? Math.max(...idx) : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = Q.safeParse({ lat: url.searchParams.get("lat"), lon: url.searchParams.get("lon") });
  if (!parsed.success) return Response.json({ live: false }, { status: 400 });

  const { lat, lon } = parsed.data;
  const ck = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < TTL) return Response.json(hit.data);

  let tempC: number | null = null;
  let feelsLikeC: number | null = null;
  let humidity: number | null = null;
  let uv: number | null = null;
  let aqi: number | null = null;

  try {
    const [wRes, aRes] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,uv_index`),
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5,pm10,us_aqi`),
    ]);
    if (wRes.ok) {
      const w = await wRes.json();
      const c = w?.current ?? {};
      tempC = typeof c.temperature_2m === "number" ? c.temperature_2m : null;
      feelsLikeC = typeof c.apparent_temperature === "number" ? c.apparent_temperature : null;
      humidity = typeof c.relative_humidity_2m === "number" ? c.relative_humidity_2m : null;
      uv = typeof c.uv_index === "number" ? Math.round(c.uv_index) : null;
    }
    if (aRes.ok) {
      const a = await aRes.json();
      const cur = a?.current ?? {};
      // Prefer India CPCB AQI (matches Indian sites); fall back to US AQI.
      aqi = indianAqi(
        typeof cur.pm2_5 === "number" ? cur.pm2_5 : null,
        typeof cur.pm10 === "number" ? cur.pm10 : null
      ) ?? (typeof cur.us_aqi === "number" ? cur.us_aqi : null);
    }
  } catch {
    // upstream/network error — fall through to graceful response below
  }

  if (tempC == null && aqi == null) return Response.json({ live: false });

  const feels = feelsLikeC ?? tempC ?? 0;
  const data = { live: true, tempC, feelsLikeC: feels, humidity, aqi, uv, level: levelFromFeels(feels) };
  cache.set(ck, { at: Date.now(), data });
  return Response.json(data);
}
