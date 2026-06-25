-- RideKamao — crowdsourced "was this zone busy?" rider feedback.
-- Run ONCE in Supabase → SQL Editor → New query → Run. Safe to re-run.
-- Riders vote busy/quiet on the suggested busy-areas; the app aggregates these
-- to validate and rank recommendations. Public read + anonymous insert only
-- (same trust model as water_points) — no personal data is stored.

CREATE TABLE IF NOT EXISTS spot_feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT now(),
  zone        TEXT NOT NULL,
  profession  TEXT NOT NULL,
  window_id   TEXT,
  busy        BOOLEAN NOT NULL
);

CREATE INDEX IF NOT EXISTS spot_feedback_lookup ON spot_feedback (profession, zone, created_at);

ALTER TABLE spot_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fb_select" ON spot_feedback;
DROP POLICY IF EXISTS "fb_insert" ON spot_feedback;
CREATE POLICY "fb_select" ON spot_feedback FOR SELECT USING (true);
CREATE POLICY "fb_insert" ON spot_feedback FOR INSERT WITH CHECK (true);
