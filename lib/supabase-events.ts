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

export async function saveProfile(profile: RideKamaoProfile) {
  const db = getClient();
  if (!db || !profile.email) return;
  const row = {
    email: profile.email,
    name: profile.name,
    profession: profile.profession,
    language: profile.language,
    goals: profile.goals,
    weekly_target: profile.weeklyTarget,
    updated_at: new Date().toISOString(),
  };
  try {
    // Insert first. If the email already exists, the unique constraint fires
    // (Postgres code 23505) and we update by email instead. We avoid upsert
    // because ON CONFLICT needs row-read access, which our security rules
    // (no public SELECT on profiles) intentionally forbid.
    const { error } = await db.from("profiles").insert(row);
    if (error && error.code === "23505") {
      await db.from("profiles").update(row).eq("email", profile.email);
    }
  } catch {
    // profile sync is best-effort; the app works from localStorage
  }
}
