-- RideKamao Supabase schema
-- Run this in your Supabase SQL editor at supabase.com → your project → SQL editor

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

-- Allow anonymous inserts (app uses anon key)
CREATE POLICY "allow_insert_profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_upsert_profiles" ON profiles FOR UPDATE USING (true);
CREATE POLICY "allow_insert_events"   ON events   FOR INSERT WITH CHECK (true);

-- View all data (for your dashboard)
CREATE POLICY "allow_select_profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "allow_select_events"   ON events   FOR SELECT USING (true);

-- Useful views for the dashboard
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
