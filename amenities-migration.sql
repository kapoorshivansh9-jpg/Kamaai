-- RideKamao — upgrade crowdsourced water points into a full rider amenities map.
-- Run this ONCE in Supabase → SQL Editor → New query → Run.
-- Safe to re-run (uses IF NOT EXISTS / ON CONFLICT). RLS policies are unchanged
-- (public SELECT + anon INSERT, same as water_points).

-- 1) Add a category column. Existing rows become 'water' automatically.
ALTER TABLE water_points
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'water';

-- 2) Restrict to the categories the app knows about (drop first so re-runs work).
ALTER TABLE water_points DROP CONSTRAINT IF EXISTS water_points_category_chk;
ALTER TABLE water_points
  ADD CONSTRAINT water_points_category_chk
  CHECK (category IN ('water','toilet','food','rest','ev','parking'));

-- 3) Seed a few non-water amenities around Delhi NCR so the map isn't water-only.
INSERT INTO water_points (lat, lon, name, category) VALUES
  (28.6304000, 77.2177000, 'Sulabh Public Toilet — CP',        'toilet'),
  (28.5535000, 77.2588000, 'Public Toilet — Nehru Place',       'toilet'),
  (28.6280000, 77.2090000, 'Cheap Thali — Connaught Place',     'food'),
  (28.5677000, 77.2433000, 'Shaded Rest Stop — Lajpat Nagar',   'rest'),
  (28.5355000, 77.3910000, 'Rider Rest Point — Sector 18 Noida','rest'),
  (28.6139000, 77.2295000, 'EV Charging — India Gate',          'ev'),
  (28.4595000, 77.0266000, 'EV Charging — Cyber Hub',           'ev'),
  (28.6315000, 77.2167000, 'Free 2-Wheeler Parking — CP Block A','parking')
ON CONFLICT DO NOTHING;
