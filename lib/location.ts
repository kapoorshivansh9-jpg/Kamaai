"use client";

// One shared location fix for the whole app.
//
// Before this, every tab asked for GPS on its own and forgot the answer when
// the rider switched tabs, so the "turn on location" prompt kept coming back.
// It also asked only for a high-accuracy GPS fix, which often times out indoors
// and then looked like nothing had happened.
//
// Now: a fix is kept for 30 minutes and reused by every tab; once a rider has
// turned location on, later visits fetch a fresh fix without another tap; and
// if precise GPS does not answer, the phone's quicker network location is used.
//
// Privacy: only coordinates rounded to 2 decimals (about 1 km) are kept, in
// sessionStorage, which stays on this device and is cleared when the tab or
// app is closed. Nothing here is sent anywhere by this file.

export interface Fix {
  lat: number;      // rounded to ~1 km
  lon: number;
  accuracy: number; // metres, as reported by the device
  at: number;       // when the fix was taken (ms since epoch)
}

const FIX_KEY = "rk-fix";
const WANT_KEY = "rk-loc-on";
export const FIX_MAX_AGE_MS = 30 * 60 * 1000;

/** The stored fix, if there is one and it is under 30 minutes old. */
export function readFix(): Fix | null {
  try {
    const f = JSON.parse(sessionStorage.getItem(FIX_KEY) || "null") as Fix | null;
    if (!f || !Number.isFinite(f.lat) || !Number.isFinite(f.lon) || !Number.isFinite(f.at)) return null;
    const age = Date.now() - f.at;
    return age >= 0 && age < FIX_MAX_AGE_MS ? f : null;
  } catch {
    return null;
  }
}

/** True once the rider has turned location on in this app (on this device). */
export function wantsLocation(): boolean {
  try { return localStorage.getItem(WANT_KEY) === "1"; } catch { return false; }
}

function once(options: PositionOptions): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition((p) => resolve(p), () => resolve(null), options);
  });
}

/**
 * Ask the device where it is. Tries precise GPS first, then falls back to the
 * quicker network location. Resolves to null if location is blocked or
 * unavailable. A successful fix is stored for the other tabs.
 */
export async function requestFix(): Promise<Fix | null> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) return null;
  let pos = await once({ enableHighAccuracy: true, timeout: 8000, maximumAge: 0 });
  if (!pos) pos = await once({ enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 });
  if (!pos) return null;
  const lat = Math.round(pos.coords.latitude * 100) / 100;
  const lon = Math.round(pos.coords.longitude * 100) / 100;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  // Some devices report odd timestamps; trust it only when it is plausible.
  const now = Date.now();
  const at = pos.timestamp <= now + 60000 && now - pos.timestamp < FIX_MAX_AGE_MS ? Math.min(pos.timestamp, now) : now;
  const fix: Fix = { lat, lon, accuracy: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : 99999, at };
  try {
    sessionStorage.setItem(FIX_KEY, JSON.stringify(fix));
    localStorage.setItem(WANT_KEY, "1");
  } catch { /* storage blocked — the fix still works for this page */ }
  return fix;
}
