// Supabase analytics — fire-and-forget event tracking + profile storage
// Works silently when NEXT_PUBLIC_SUPABASE_URL is not set.

import type { RideKamaoProfile } from "./ridekamao-data";

let _client: ReturnType<typeof import("@supabase/supabase-js").createClient> | null = null;

function getClient() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url === "your_supabase_url") return null;
  try {
    const { createClient } = require("@supabase/supabase-js");
    _client = createClient(url, key);
    return _client;
  } catch {
    return null;
  }
}

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
  db.from("events").insert({
    event_type: event.type,
    event_data: event.data ?? {},
    profession: event.profession,
    language: event.language,
    session_id: getSessionId(),
    created_at: new Date().toISOString(),
  }).then(() => {}).catch(() => {});
}

export async function saveProfile(profile: RideKamaoProfile) {
  const db = getClient();
  if (!db || !profile.email) return;
  db.from("profiles").upsert({
    email: profile.email,
    name: profile.name,
    profession: profile.profession,
    language: profile.language,
    goals: profile.goals,
    weekly_target: profile.weeklyTarget,
    updated_at: new Date().toISOString(),
  }, { onConflict: "email" }).then(() => {}).catch(() => {});
}
