"use client";

// Single shared Supabase browser client (auth + data).
// Returns null when Supabase isn't configured, so every caller can no-op
// gracefully — the app works fully offline from localStorage without keys.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cache on globalThis so Next.js dev hot-reloads reuse the same auth client
// instead of spawning a new one each time ("Multiple GoTrueClient" warning).
const g = globalThis as unknown as { __rkSb?: SupabaseClient | null; __rkSbChecked?: boolean };

export function getSupabase(): SupabaseClient | null {
  if (g.__rkSbChecked) return g.__rkSb ?? null;
  g.__rkSbChecked = true;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Skip when unset or still the placeholder from .env.local
  if (!url || !key || !url.startsWith("http")) {
    g.__rkSb = null;
    return null;
  }
  g.__rkSb = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return g.__rkSb;
}

export function supabaseConfigured(): boolean {
  return getSupabase() != null;
}
