// Supabase analytics — fire-and-forget event tracking + profile storage
// Works silently when NEXT_PUBLIC_SUPABASE_URL is not set.

import type { RideKamaoProfile } from "./ridekamao-data";
import { getSupabase } from "./supabase-browser";

// Reuse the single shared browser client so we don't spin up a second
// auth instance (which logs a "Multiple GoTrueClient" warning).
const getClient = getSupabase;

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = sessionStorage.getItem("rk_sid");
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("rk_sid", id);
  }
  return id;
}

export async function trackEvent(event: {
  type: string;
  data?: Record<string, unknown>;
  profession?: string;
  language?: string;
}) {
  const db = getClient();
  if (!db) return;
  try {
    await db.from("events").insert({
      event_type: event.type,
      event_data: event.data ?? {},
      profession: event.profession,
      language: event.language,
      session_id: getSessionId(),
      created_at: new Date().toISOString(),
    });
  } catch {
    // analytics must never break the app
  }
}

// ── Crowdsourced water points ─────────────────────────────────
export interface WaterPoint { name: string | null; lat: number; lon: number; distKm: number; category: string }

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/** Returns nearby water points from the DB, or null if Supabase isn't set up. */
export async function fetchNearbyWaterPoints(lat: number, lon: number, radiusKm = 5): Promise<WaterPoint[] | null> {
  const db = getClient();
  if (!db) return null;
  const dLat = radiusKm / 111;
  const dLon = radiusKm / (111 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  try {
    const box = <T extends { gte: (c: string, v: number) => T; lte: (c: string, v: number) => T; limit: (n: number) => T }>(q: T): T =>
      q.gte("lat", lat - dLat).lte("lat", lat + dLat).gte("lon", lon - dLon).lte("lon", lon + dLon).limit(200);
    // Try selecting category; if the column doesn't exist yet (migration not run),
    // fall back to the original columns so the feature still works.
    const withCat = await box(db.from("water_points").select("name,lat,lon,category"));
    let rows: { name: string | null; lat: number; lon: number; category?: string }[] | null =
      withCat.error ? null : (withCat.data as unknown as typeof rows);
    if (rows === null) {
      const plain = await box(db.from("water_points").select("name,lat,lon"));
      if (plain.error || !plain.data) return null;
      rows = plain.data as unknown as typeof rows;
    }
    if (!rows) return null;
    return rows
      .map((p) => ({ name: p.name, lat: p.lat, lon: p.lon, category: p.category || "water", distKm: Math.round(haversineKm(lat, lon, p.lat, p.lon) * 10) / 10 }))
      .filter((p) => p.distKm <= radiusKm)
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, 30);
  } catch {
    return null;
  }
}

/** Adds a crowdsourced amenity (water/toilet/food/rest/ev/parking). Returns true on success. */
export async function addWaterPoint(lat: number, lon: number, name: string, category = "water"): Promise<boolean> {
  const db = getClient();
  if (!db) return false;
  try {
    let { error } = await db.from("water_points").insert({ lat, lon, name: name || null, category });
    // If the category column doesn't exist yet, retry without it.
    if (error) ({ error } = await db.from("water_points").insert({ lat, lon, name: name || null }));
    return !error;
  } catch {
    return false;
  }
}

// ── Crowdsourced "was this zone busy?" feedback ───────────────
export interface ZoneStat { busy: number; quiet: number; score: number } // score 0–1

/** Records a rider's busy/quiet vote for a strategic zone. Best-effort. */
export async function submitSpotFeedback(f: { zone: string; profession: string; windowId: string; busy: boolean }): Promise<boolean> {
  const db = getClient();
  if (!db) return false;
  try {
    const { error } = await db.from("spot_feedback").insert({
      zone: f.zone, profession: f.profession, window_id: f.windowId, busy: f.busy,
    });
    return !error;
  } catch {
    return false;
  }
}

/** Aggregated busy/quiet votes per zone for a profession (last 21 days), or null. */
export async function fetchZoneStats(profession: string): Promise<Record<string, ZoneStat> | null> {
  const db = getClient();
  if (!db) return null;
  const since = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString();
  try {
    const { data, error } = await db
      .from("spot_feedback")
      .select("zone,busy")
      .eq("profession", profession)
      .gte("created_at", since)
      .limit(2000);
    if (error || !data) return null;
    const out: Record<string, ZoneStat> = {};
    for (const r of data as { zone: string; busy: boolean }[]) {
      const s = (out[r.zone] ??= { busy: 0, quiet: 0, score: 0 });
      if (r.busy) s.busy++; else s.quiet++;
    }
    for (const s of Object.values(out)) s.score = s.busy / Math.max(1, s.busy + s.quiet);
    return out;
  } catch {
    return null;
  }
}

// ── Rider-pinned dark stores (quick-commerce) ─────────────────
// No public dataset lists dark stores, so riders pin their own. The pin is the
// STORE's position and carries no rider id.
export const DARK_BRANDS = ["blinkit", "zepto", "instamart", "bigbasket", "other"] as const;
export type DarkBrand = (typeof DARK_BRANDS)[number];
export interface DarkStore { brand: DarkBrand; name: string | null; lat: number; lon: number; distKm: number }

/** Pinned dark stores near a point, nearest first; null if Supabase isn't set up or the table is missing. */
export async function fetchNearbyDarkStores(lat: number, lon: number, radiusKm = 4): Promise<DarkStore[] | null> {
  const db = getClient();
  if (!db) return null;
  const dLat = radiusKm / 111;
  const dLon = radiusKm / (111 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  try {
    const { data, error } = await db.from("dark_stores").select("brand,name,lat,lon")
      .gte("lat", lat - dLat).lte("lat", lat + dLat).gte("lon", lon - dLon).lte("lon", lon + dLon).limit(200);
    if (error || !data) return null;
    return (data as { brand: DarkBrand; name: string | null; lat: number; lon: number }[])
      .map((p) => ({ ...p, distKm: Math.round(haversineKm(lat, lon, p.lat, p.lon) * 10) / 10 }))
      .filter((p) => p.distKm <= radiusKm)
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, 12);
  } catch {
    return null;
  }
}

/**
 * Pin a dark store. Returns "added", "exists" (the same brand is already
 * pinned within 80 m) or "failed".
 */
export async function addDarkStore(lat: number, lon: number, brand: DarkBrand, name: string): Promise<"added" | "exists" | "failed"> {
  const db = getClient();
  if (!db) return "failed";
  try {
    const near = await fetchNearbyDarkStores(lat, lon, 0.3);
    if (near?.some((s) => s.brand === brand && haversineKm(lat, lon, s.lat, s.lon) <= 0.08)) return "exists";
    const { error } = await db.from("dark_stores").insert({ lat, lon, brand, name: name.trim().slice(0, 80) || null });
    return error ? "failed" : "added";
  } catch {
    return "failed";
  }
}

export async function saveProfile(profile: RideKamaoProfile) {
  const db = getClient();
  const email = profile.email?.trim().toLowerCase();
  if (!db || !email) return;
  // save_profile() (profile-security.sql) is the only way to write a profile;
  // the table refuses direct inserts and updates from the browser. Signed in,
  // it saves the account's own row (the email comes from the account). Not
  // signed in, it can create a new profile but never change an existing one —
  // the copy on this phone still updates either way.
  try {
    await db.rpc("save_profile", {
      p_email: email, p_name: profile.name, p_profession: profile.profession,
      p_language: profile.language, p_goals: profile.goals, p_weekly_target: profile.weeklyTarget,
    });
  } catch {
    // profile sync is best-effort; the app works from localStorage
  }
}
