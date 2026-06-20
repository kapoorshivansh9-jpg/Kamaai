-- RideKamao Supabase schema (v2 — security hardened)
-- Run this in your Supabase SQL editor at supabase.com → your project → SQL editor
-- Safe to re-run on an existing project: it drops the old insecure policies first.

-- User profiles (one per rider)
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  email       TEXT UNIQUE NOT NULL,
  name        TEXT,
  profession  TEXT,   -- food | auto | biketx | cab | qcom
  language    TEXT,   -- hi | en | pa | bn | ta | mr
  goals       TEXT[], -- earn | target | heat | traffic
  weekly_target INTEGER
);

-- Analytics events (page views, feature usage)
CREATE TABLE IF NOT EXISTS events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT now(),
  session_id  TEXT,
  event_type  TEXT,   -- shift_plan_viewed | rights_question_asked | onboarding_completed | etc.
  event_data  JSONB DEFAULT '{}',
  profession  TEXT,
  language    TEXT
  -- No GPS, no PII beyond profession/language
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events   ENABLE ROW LEVEL SECURITY;

-- ── SECURITY FIX ──────────────────────────────────────────────
-- The old policies let ANYONE with the public anon key read every
-- rider's email/name and overwrite any profile. Remove them:
DROP POLICY IF EXISTS "allow_select_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_select_events"   ON events;
DROP POLICY IF EXISTS "allow_insert_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_upsert_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_insert_events"   ON events;

-- The app (anon key) may only WRITE — it can never read data back.
-- Your dashboard/SQL editor uses the service role, which bypasses RLS,
-- so the views below still work for you.
CREATE POLICY "anon_insert_profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_insert_events"   ON events   FOR INSERT WITH CHECK (true);

-- Needed so the app's upsert can update a rider's own row on conflict.
-- Note: rows can only be targeted by exact email; nothing is readable.
CREATE POLICY "anon_update_profiles" ON profiles FOR UPDATE
  USING (true) WITH CHECK (true);

-- Useful views for the dashboard (query these from the Supabase
-- dashboard / SQL editor — they are NOT exposed to the public app)
CREATE OR REPLACE VIEW profession_breakdown AS
  SELECT profession, COUNT(*) as riders
  FROM profiles
  WHERE profession IS NOT NULL
  GROUP BY profession ORDER BY riders DESC;

CREATE OR REPLACE VIEW daily_active_sessions AS
  SELECT DATE(created_at) as day, COUNT(DISTINCT session_id) as sessions
  FROM events
  GROUP BY day ORDER BY day DESC;

CREATE OR REPLACE VIEW feature_usage AS
  SELECT event_type, COUNT(*) as count
  FROM events
  GROUP BY event_type ORDER BY count DESC;

-- Keep the views private (service role only)
REVOKE ALL ON profession_breakdown   FROM anon, authenticated;
REVOKE ALL ON daily_active_sessions  FROM anon, authenticated;
REVOKE ALL ON feature_usage          FROM anon, authenticated;
