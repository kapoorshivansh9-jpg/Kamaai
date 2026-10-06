// Multi-day weather + air-quality outlook, and what each day means for a rider.
// Data: Open-Meteo (free, no key, CORS-enabled) — the same source as the live
// readings on the Heat tab. Everything here is pure / isomorphic so the server
// route (/api/forecast) and the browser fallback share one implementation.
//
// The "impact" lines are RULES over forecast numbers (thresholds below), not a
// prediction model. Demand remarks are hedged on purpose ("usually", "often").

export type Tone = "safe" | "mod" | "high" | "ext";

export interface DayForecast {
  date: string;            // local date in Asia/Kolkata, YYYY-MM-DD
  code: number | null;     // WMO weather code
  tMax: number | null;
  tMin: number | null;
  feelsMax: number | null; // max apparent temperature
  rainProb: number | null; // max precipitation probability, %
  rainMm: number | null;   // precipitation sum, mm
  uvMax: number | null;
  gustKmh: number | null;
  aqi: number | null;      // India CPCB AQI from the day's mean PM2.5 / PM10
}

export interface Forecast {
  ok: true;
  source: "Open-Meteo";
  fetchedAt: string;       // ISO
  days: DayForecast[];
}

export const FORECAST_DAYS = 5;

// ── India CPCB AQI (24-hour PM2.5 / PM10 sub-indices; AQI = the worse one) ──
const PM25_BANDS = [[0, 30, 0, 50], [30, 60, 51, 100], [60, 90, 101, 200], [90, 120, 201, 300], [120, 250, 301, 400], [250, 500, 401, 500]];
const PM10_BANDS = [[0, 50, 0, 50], [50, 100, 51, 100], [100, 250, 101, 200], [250, 350, 201, 300], [350, 430, 301, 400], [430, 600, 401, 500]];
function subIndex(c: number, bands: number[][]): number {
  for (const [cl, ch, il, ih] of bands) if (c <= ch) return Math.round(((ih - il) / (ch - cl)) * (c - cl) + il);
  return 500;
}
export function cpcbAqi(pm25: number | null, pm10: number | null): number | null {
  const idx: number[] = [];
  if (typeof pm25 === "number") idx.push(subIndex(pm25, PM25_BANDS));
  if (typeof pm10 === "number") idx.push(subIndex(pm10, PM10_BANDS));
  return idx.length ? Math.max(...idx) : null;
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const at = (arr: unknown, i: number): number | null => (Array.isArray(arr) ? num(arr[i]) : null);

/** Mean of the hourly values that fall on `date`; null unless at least half the day is covered. */
function dailyMean(times: unknown, values: unknown, date: string): number | null {
  if (!Array.isArray(times) || !Array.isArray(values)) return null;
  let sum = 0, n = 0;
  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    if (typeof t !== "string" || !t.startsWith(date)) continue;
    const v = num(values[i]);
    if (v == null) continue;
    sum += v; n++;
  }
  return n >= 12 ? sum / n : null;
}

/** Turn the two raw Open-Meteo responses into day rows. Exported for tests. */
export function buildDays(weather: unknown, air: unknown): DayForecast[] {
  const d = (weather as { daily?: Record<string, unknown> } | null)?.daily;
  const h = (air as { hourly?: Record<string, unknown> } | null)?.hourly;
  const times = d?.time;
  if (!Array.isArray(times)) return [];
  const days: DayForecast[] = [];
  for (let i = 0; i < times.length && days.length < FORECAST_DAYS; i++) {
    const date = times[i];
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const tMax = at(d?.temperature_2m_max, i);
    const tMin = at(d?.temperature_2m_min, i);
    if (tMax == null && tMin == null) continue; // no usable weather for this day
    days.push({
      date,
      code: at(d?.weather_code, i),
      tMax, tMin,
      feelsMax: at(d?.apparent_temperature_max, i),
      rainProb: at(d?.precipitation_probability_max, i),
      rainMm: at(d?.precipitation_sum, i),
      uvMax: at(d?.uv_index_max, i),
      gustKmh: at(d?.wind_gusts_10m_max, i),
      aqi: cpcbAqi(dailyMean(h?.time, h?.pm2_5, date), dailyMean(h?.time, h?.pm10, date)),
    });
  }
  return days;
}

/** Fetch the outlook straight from Open-Meteo. Works on the server and in the browser. */
export async function fetchForecast(lat: number, lon: number, signal?: AbortSignal): Promise<Forecast | null> {
  const tz = encodeURIComponent("Asia/Kolkata");
  const w = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_sum,precipitation_probability_max,uv_index_max,wind_gusts_10m_max` +
    `&timezone=${tz}&forecast_days=${FORECAST_DAYS}`;
  const a = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}` +
    `&hourly=pm2_5,pm10&timezone=${tz}&forecast_days=${FORECAST_DAYS}`;
  try {
    const [wr, ar] = await Promise.all([
      fetch(w, { signal }),
      // AQ is optional: a failure there must not lose the weather outlook.
      fetch(a, { signal }).catch(() => null),
    ]);
    if (!wr.ok) return null;
    const weather = await wr.json();
    let air: unknown = null;
    if (ar && ar.ok) { try { air = await ar.json(); } catch { air = null; } }
    const days = buildDays(weather, air);
    if (!days.length) return null;
    return { ok: true, source: "Open-Meteo", fetchedAt: new Date().toISOString(), days };
  } catch {
    return null;
  }
}

// ── Impact rules ──────────────────────────────────────────────
export type ImpactKind = "storm" | "heat" | "rain" | "aqi" | "wind" | "fog" | "uv" | "cold" | "clear";
/** Riders exposed on two wheels vs. an open auto vs. a closed cab. */
export type WorkGroup = "bike" | "auto" | "cab";

export interface Impact {
  kind: ImpactKind;
  tone: Tone;
  /** Numbers to interpolate into the title string. */
  vars: Record<string, number>;
}

export function workGroup(profession: string | null | undefined): WorkGroup {
  if (profession === "cab") return "cab";
  if (profession === "auto") return "auto";
  return "bike"; // food, qcom, biketx — and the safest default for a guest
}

const RANK: Record<Tone, number> = { safe: 0, mod: 1, high: 2, ext: 3 };
const isStorm = (code: number | null) => code != null && code >= 95 && code <= 99;
const isFog = (code: number | null) => code === 45 || code === 48;

/**
 * What a day's forecast means on the road, most serious first (max 3).
 * Thresholds: feels-like 36/40/45 °C (same as the live heat level), CPCB AQI
 * 101/201/301, rain ≥50% with ≥2 mm (moderate) or ≥60% with ≥10 mm (heavy),
 * gusts ≥40/55 km/h, UV ≥8, minimum ≤8 °C.
 */
export function impactsFor(day: DayForecast, group: WorkGroup): Impact[] {
  const out: Impact[] = [];
  const r0 = (n: number) => Math.round(n);

  if (isStorm(day.code)) out.push({ kind: "storm", tone: "high", vars: {} });

  if (day.feelsMax != null && day.feelsMax >= 36) {
    out.push({ kind: "heat", tone: day.feelsMax >= 45 ? "ext" : day.feelsMax >= 40 ? "high" : "mod", vars: { n: r0(day.feelsMax) } });
  }

  const p = day.rainProb ?? 0, mm = day.rainMm ?? 0;
  if (p >= 50 && mm >= 2) {
    out.push({ kind: "rain", tone: p >= 60 && mm >= 10 ? "high" : "mod", vars: { p: r0(p), mm: r0(mm) } });
  }

  if (day.aqi != null && day.aqi >= 101) {
    out.push({ kind: "aqi", tone: day.aqi >= 301 ? "ext" : day.aqi >= 201 ? "high" : "mod", vars: { n: day.aqi } });
  }

  if (day.gustKmh != null && day.gustKmh >= 40) {
    // Gusts matter far more on two wheels than inside a cab.
    const tone: Tone = day.gustKmh >= 55 ? (group === "cab" ? "mod" : "high") : "mod";
    out.push({ kind: "wind", tone, vars: { n: r0(day.gustKmh) } });
  }

  if (isFog(day.code)) out.push({ kind: "fog", tone: "high", vars: {} });

  if (day.uvMax != null && day.uvMax >= 8 && group !== "cab") {
    out.push({ kind: "uv", tone: day.uvMax >= 11 ? "high" : "mod", vars: { n: r0(day.uvMax) } });
  }

  if (day.tMin != null && day.tMin <= 8) out.push({ kind: "cold", tone: day.tMin <= 4 ? "high" : "mod", vars: { n: r0(day.tMin) } });

  if (!out.length) return [{ kind: "clear", tone: "safe", vars: {} }];
  // Stable sort: most serious first, original (priority) order as tie-breaker.
  return out.map((x, i) => ({ x, i })).sort((a, b) => RANK[b.x.tone] - RANK[a.x.tone] || a.i - b.i).slice(0, 3).map((e) => e.x);
}

/** The single worst tone of the day — colours the day row. */
export function dayTone(impacts: Impact[]): Tone {
  return impacts.reduce<Tone>((t, i) => (RANK[i.tone] > RANK[t] ? i.tone : t), "safe");
}

export type SkyKind = "clear" | "partly" | "cloud" | "fog" | "drizzle" | "rain" | "storm";
export function skyKind(code: number | null): SkyKind {
  if (code == null) return "cloud";
  if (code === 0) return "clear";
  if (code <= 2) return "partly";
  if (code === 3) return "cloud";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if (code >= 95) return "storm";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  return "cloud";
}
