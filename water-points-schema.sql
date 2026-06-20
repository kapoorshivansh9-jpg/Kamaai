-- RideKamao — crowdsourced free water points
-- Run this in Supabase → SQL Editor → New query → Run.
-- Water points are PUBLIC info, so reads are allowed (unlike profiles).
-- Anyone can add a point (crowdsourced); the app filters to within 5 km.

CREATE TABLE IF NOT EXISTS water_points (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT now(),
  lat         DOUBLE PRECISION NOT NULL,
  lon         DOUBLE PRECISION NOT NULL,
  name        TEXT,
  note        TEXT
);

CREATE INDEX IF NOT EXISTS water_points_latlon ON water_points (lat, lon);

ALTER TABLE water_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "water_select" ON water_points;
DROP POLICY IF EXISTS "water_insert" ON water_points;
CREATE POLICY "water_select" ON water_points FOR SELECT USING (true);
CREATE POLICY "water_insert" ON water_points FOR INSERT WITH CHECK (true);

-- Seed with real Delhi NCR water points (so the map isn't empty on day one).
INSERT INTO water_points (lat, lon, name) VALUES
  (28.6556965, 77.2393801, 'Drinking Water Point'),
  (28.6685920, 77.1996152, 'Sheetal Jal (Cold Water)'),
  (28.6434000, 77.2192801, 'Drinking Water Station'),
  (28.6282709, 77.2064206, 'Drinking Water Station — CP'),
  (28.6516600, 77.2347281, 'Drinking Water Station'),
  (28.6390079, 77.2456619, 'Drinking Water Point'),
  (28.5677000, 77.2433000, 'Lajpat Nagar Auto Stand'),
  (28.6315000, 77.2167000, 'CP Block A Rider Point'),
  (28.5483000, 77.2510000, 'Nehru Place Metro Gate 3'),
  (28.5355000, 77.3910000, 'Sector 18 Metro, Noida'),
  (28.4595000, 77.0266000, 'Cyber Hub, Gurgaon'),
  (28.6139000, 77.2090000, 'India Gate lawns tap')
ON CONFLICT DO NOTHING;
