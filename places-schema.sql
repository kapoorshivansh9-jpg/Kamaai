-- RideKamao — own places table + named hotspot clusters for the Shift Planner.
-- Run ONCE in Supabase → SQL Editor → New query → Run. Safe to re-run.
--
-- Why: the Shifts tab used to ask a public OpenStreetMap server (Overpass) for
-- places on every page load. That server is often too busy, so riders only saw
-- hand-written fallbacks like "Sector 50–78 societies". Now the database keeps
-- its own copy of Delhi-NCR places, groups them into small named clusters with
-- a pin and a count, and the app reads those. The copy is refreshed monthly.
--
-- Sources: OpenStreetMap (© OpenStreetMap contributors, ODbL) fetched by
-- rk_import_osm_tile() below, and Overture Maps Places (CDLA-Permissive-2.0 /
-- Apache-2.0) loaded by the GitHub Action in .github/workflows/import-overture.yml.
-- Both are public data, so reads are open; nothing here is personal.

CREATE EXTENSION IF NOT EXISTS http    WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- ── Places ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.places (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source      TEXT NOT NULL CHECK (source IN ('osm', 'overture')),
  source_id   TEXT NOT NULL,
  name        TEXT NOT NULL,
  -- restaurant | fast_food | cafe | bakery | sweets | ice_cream | food_court |
  -- nightlife | grocery | market | mall | metro | rail | bus_stand | airport |
  -- hotel | hospital | college | office | society | locality
  kind        TEXT NOT NULL,
  lat         DOUBLE PRECISION NOT NULL,
  lon         DOUBLE PRECISION NOT NULL,
  geom        extensions.geography(Point, 4326)
              GENERATED ALWAYS AS (extensions.st_setsrid(extensions.st_makepoint(lon, lat), 4326)::extensions.geography) STORED,
  brand       TEXT,
  notable     BOOLEAN NOT NULL DEFAULT false,  -- has a Wikipedia/Wikidata entry or a known brand
  confidence  REAL,                            -- Overture's 0–1 "does this place exist" score; null for OSM
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source, source_id)
);
CREATE INDEX IF NOT EXISTS places_geom ON public.places USING gist (geom);
CREATE INDEX IF NOT EXISTS places_kind ON public.places (kind);

-- ── Hotspot clusters (rebuilt from places) ─────────────────────
CREATE TABLE IF NOT EXISTS public.hotspot_clusters (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key              TEXT NOT NULL UNIQUE, -- id for rider votes: "<grp>@<lat>,<lon>" rounded to ~10 m
  grp              TEXT NOT NULL,     -- food | nightlife
  name             TEXT NOT NULL,
  lat              DOUBLE PRECISION NOT NULL,
  lon              DOUBLE PRECISION NOT NULL,
  geom             extensions.geography(Point, 4326)
                   GENERATED ALWAYS AS (extensions.st_setsrid(extensions.st_makepoint(lon, lat), 4326)::extensions.geography) STORED,
  place_count      INTEGER NOT NULL,
  radius_m         INTEGER NOT NULL,  -- distance from the pin to the farthest member
  kinds            JSONB NOT NULL,    -- {"restaurant": 21, "cafe": 6, ...}
  top_places       TEXT[] NOT NULL,   -- up to 3 recognisable members
  societies_nearby INTEGER NOT NULL DEFAULT 0, -- named housing societies within 1.5 km
  computed_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hotspot_clusters_geom ON public.hotspot_clusters USING gist (geom);

-- ── Import log (so a failed monthly refresh is visible) ────────
CREATE TABLE IF NOT EXISTS public.place_import_log (
  id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ran_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  job     TEXT NOT NULL,
  ok      BOOLEAN NOT NULL,
  rows    INTEGER,
  note    TEXT
);

-- ── Rider-pinned dark stores (quick-commerce) ──────────────────
-- No public dataset lists Blinkit / Zepto / Instamart dark stores, so riders
-- pin their own. Same trust model as water_points: public read, anyone can add.
CREATE TABLE IF NOT EXISTS public.dark_stores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  lat         DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN 27.5 AND 29.5),
  lon         DOUBLE PRECISION NOT NULL CHECK (lon BETWEEN 76.0 AND 78.5),
  brand       TEXT NOT NULL CHECK (brand IN ('blinkit', 'zepto', 'instamart', 'bigbasket', 'other')),
  name        TEXT CHECK (name IS NULL OR length(name) <= 80)
);
CREATE INDEX IF NOT EXISTS dark_stores_latlon ON public.dark_stores (lat, lon);

ALTER TABLE public.places           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotspot_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_import_log ENABLE ROW LEVEL SECURITY;  -- no policies: dashboard only
ALTER TABLE public.dark_stores      ENABLE ROW LEVEL SECURITY;

-- (Re-running this file: the four policies below already exist, so skip them.)
CREATE POLICY "places_select"   ON public.places           FOR SELECT USING (true);
CREATE POLICY "clusters_select" ON public.hotspot_clusters FOR SELECT USING (true);
CREATE POLICY "dark_select"     ON public.dark_stores      FOR SELECT USING (true);
CREATE POLICY "dark_insert"     ON public.dark_stores      FOR INSERT WITH CHECK (true);

-- ── OSM tags → our "kind" ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.rk_osm_kind(t JSONB) RETURNS TEXT
LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT CASE
    WHEN t->>'railway' = 'station' THEN CASE WHEN t->>'station' = 'subway' OR t->>'subway' = 'yes' OR t->>'network' ILIKE '%metro%' OR t->>'name' ILIKE '%metro%' THEN 'metro' ELSE 'rail' END
    WHEN t->>'amenity' = 'bus_station' THEN 'bus_stand'
    WHEN t->>'aeroway' = 'terminal' THEN 'airport'
    WHEN t->>'amenity' IN ('restaurant', 'fast_food', 'cafe', 'food_court', 'ice_cream') THEN t->>'amenity'
    WHEN t->>'shop' IN ('bakery', 'pastry') THEN 'bakery'
    WHEN t->>'shop' = 'confectionery' THEN 'sweets'
    WHEN t->>'amenity' IN ('bar', 'pub', 'nightclub') THEN 'nightlife'
    WHEN t->>'shop' = 'mall' THEN 'mall'
    WHEN t->>'amenity' = 'marketplace' OR t->>'landuse' = 'retail' THEN 'market'
    WHEN t->>'shop' IN ('supermarket', 'convenience', 'greengrocer', 'dairy') THEN 'grocery'
    WHEN t->>'tourism' = 'hotel' THEN 'hotel'
    WHEN t->>'amenity' = 'hospital' THEN 'hospital'
    WHEN t->>'amenity' IN ('college', 'university') THEN 'college'
    WHEN t->>'place' IN ('suburb', 'neighbourhood', 'quarter') THEN 'locality'
    WHEN t ? 'office' OR t->>'building' IN ('office', 'commercial') OR t->>'landuse' = 'commercial' THEN 'office'
    -- Noida maps whole sectors as residential land: those are localities, not one society.
    WHEN t->>'landuse' = 'residential' AND coalesce(t->>'name:en', t->>'name') ~* '^sector[ -]?[0-9]' THEN 'locality'
    WHEN t->>'landuse' = 'residential' OR t->>'building' IN ('apartments', 'residential') THEN 'society'
    ELSE NULL
  END
$$;

-- ── Import one rectangle of OpenStreetMap ──────────────────────
-- Tries each public Overpass server once (they are often busy and answer 504)
-- and only writes after a good answer, so a failed run never empties the table.
-- Nothing is deleted: a place that has left OSM simply stops being refreshed,
-- and readers ignore OSM rows not refreshed in the last 75 days.
-- Returns the number of places written, or -1 if every server failed (the
-- tile queue below then tries it again on a later tick).
CREATE OR REPLACE FUNCTION public.rk_import_osm_tile(s DOUBLE PRECISION, w DOUBLE PRECISION, n DOUBLE PRECISION, e DOUBLE PRECISION)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  ql      TEXT;
  mirrors TEXT[] := ARRAY['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
  m       TEXT;
  res     RECORD;
  body    JSONB;
  written INT := 0;
  job     TEXT := format('osm %s,%s,%s,%s', s, w, n, e);
  last_err TEXT := 'no attempt';
BEGIN
  ql := format('[out:json][timeout:20][bbox:%s,%s,%s,%s];(', s, w, n, e)
     || 'nwr["amenity"~"^(restaurant|fast_food|cafe|food_court|ice_cream|bar|pub|nightclub|marketplace|bus_station|hospital|college|university)$"]["name"];'
     || 'nwr["shop"~"^(bakery|pastry|confectionery|supermarket|convenience|greengrocer|dairy|mall)$"]["name"];'
     || 'nwr["railway"="station"]["name"];nwr["aeroway"="terminal"]["name"];nwr["tourism"="hotel"]["name"];'
     || 'nwr["office"]["name"];nwr["landuse"~"^(residential|commercial|retail)$"]["name"];'
     || 'nwr["building"~"^(apartments|residential|office|commercial)$"]["name"];'
     || 'node["place"~"^(suburb|neighbourhood|quarter)$"]["name"];'
     || ');out center tags qt;';
  PERFORM extensions.http_set_curlopt('CURLOPT_TIMEOUT', '22');

  FOREACH m IN ARRAY mirrors LOOP
    BEGIN
      SELECT * INTO res FROM extensions.http((
        'POST', m,
        ARRAY[extensions.http_header('User-Agent', 'RideKamao/1.0 (https://ridekamao.in)')],
        'application/x-www-form-urlencoded', 'data=' || extensions.urlencode(ql)
      )::extensions.http_request);
      IF res.status = 200 AND left(ltrim(res.content), 1) = '{' THEN
        body := res.content::jsonb;
        IF body ? 'elements' AND NOT (body ? 'remark') THEN EXIT; END IF;  -- "remark" = the server cut the answer short
        last_err := m || ': incomplete answer';
      ELSE
        last_err := m || ': HTTP ' || res.status;
      END IF;
      body := NULL;
    EXCEPTION WHEN OTHERS THEN
      last_err := m || ': ' || SQLERRM;
      body := NULL;
    END;
  END LOOP;

  IF body IS NULL THEN
    INSERT INTO public.place_import_log (job, ok, note) VALUES (job, false, left(last_err, 300));
    RETURN -1;
  END IF;

  WITH el AS (
    SELECT x->>'type' AS typ, x->>'id' AS oid, x->'tags' AS t,
           coalesce((x->>'lat')::float8, (x->'center'->>'lat')::float8) AS lat,
           coalesce((x->>'lon')::float8, (x->'center'->>'lon')::float8) AS lon
    FROM jsonb_array_elements(body->'elements') x
  ), rows AS (
    SELECT typ || '/' || oid AS source_id,
           left(btrim(coalesce(nullif(t->>'name:en', ''), t->>'name')), 120) AS name,
           public.rk_osm_kind(t) AS kind, lat, lon,
           nullif(t->>'brand', '') AS brand,
           (t ? 'wikidata' OR t ? 'wikipedia' OR t ? 'brand') AS notable
    FROM el WHERE lat IS NOT NULL AND lon IS NOT NULL AND t IS NOT NULL
  ), up AS (
    INSERT INTO public.places (source, source_id, name, kind, lat, lon, brand, notable, updated_at)
    SELECT 'osm', source_id, name, kind, lat, lon, brand, notable, now()
    FROM rows WHERE kind IS NOT NULL AND name IS NOT NULL AND name <> ''
    ON CONFLICT (source, source_id) DO UPDATE SET
      name = EXCLUDED.name, kind = EXCLUDED.kind, lat = EXCLUDED.lat, lon = EXCLUDED.lon,
      brand = EXCLUDED.brand, notable = EXCLUDED.notable, updated_at = now()
    RETURNING 1
  )
  SELECT count(*) INTO written FROM up;

  INSERT INTO public.place_import_log (job, ok, rows) VALUES (job, true, written);
  RETURN written;
END;
$$;

-- ── Rebuild clusters from the places table ─────────────────────
-- 1. Group places that sit within `eps` metres of each other (DBSCAN).
-- 2. Split any group wider than ~300 m, so every cluster is one walkable spot.
-- 3. Name it after the mall/market it sits in, else the locality plus its
--    best-known member.
-- Each run stamps its rows with one timestamp; readers use only the newest run,
-- so older rows never need deleting.
CREATE OR REPLACE FUNCTION public.rk_rebuild_clusters() RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  g RECORD;
  total INT := 0;
  added INT;
BEGIN
  FOR g IN SELECT * FROM (VALUES
      ('food',      ARRAY['restaurant', 'fast_food', 'cafe', 'bakery', 'sweets', 'ice_cream', 'food_court'], 180, 5),
      ('nightlife', ARRAY['nightlife'], 250, 3)
    ) AS v(grp, kinds, eps, minpts)
  LOOP
    WITH pts AS (
      -- Overture rows are only used when confident, and never when the same
      -- name already exists from OSM within 60 m (avoids double counting).
      SELECT p.id, p.name, p.kind, p.lat, p.lon, p.notable, p.geom,
             extensions.st_transform(p.geom::extensions.geometry, 32643) AS g32
      FROM public.places p
      WHERE p.kind = ANY (g.kinds)
        AND (p.source <> 'osm' OR p.updated_at > now() - interval '75 days')
        AND (p.source = 'osm' OR (coalesce(p.confidence, 0) >= 0.75 AND NOT EXISTS (
              SELECT 1 FROM public.places o
              WHERE o.source = 'osm' AND o.kind = ANY (g.kinds) AND lower(o.name) = lower(p.name)
                AND extensions.st_dwithin(o.geom, p.geom, 60))))
    ), db AS (
      SELECT *, extensions.st_clusterdbscan(g32, eps := g.eps, minpoints := g.minpts) OVER () AS cid FROM pts
    ), sub AS (
      SELECT *, extensions.st_clusterkmeans(g32, 1, 300) OVER (PARTITION BY cid) AS sid FROM db WHERE cid IS NOT NULL
    ), agg AS (
      SELECT cid, sid, count(*)::int AS n, avg(lat) AS lat, avg(lon) AS lon
      FROM sub GROUP BY cid, sid HAVING count(*) >= g.minpts
    ), tp AS (
      -- Up to 3 recognisable members, each name once (a cluster can hold two Domino's).
      SELECT cid, sid, (array_agg(name ORDER BY nb DESC, length(name), name))[1:3] AS top_places
      FROM (SELECT cid, sid, name, bool_or(notable) AS nb FROM sub GROUP BY cid, sid, name) q GROUP BY cid, sid
    ), kc AS (
      SELECT cid, sid, jsonb_object_agg(kind, c) AS kinds
      FROM (SELECT cid, sid, kind, count(*) AS c FROM sub GROUP BY cid, sid, kind) k GROUP BY cid, sid
    ), rad AS (
      SELECT a.cid, a.sid, ceil(max(extensions.st_distance(s.geom, extensions.st_setsrid(extensions.st_makepoint(a.lon, a.lat), 4326)::extensions.geography)))::int AS radius_m
      FROM agg a JOIN sub s ON s.cid = a.cid AND s.sid = a.sid GROUP BY a.cid, a.sid
    ), c AS (
      SELECT a.*, kc.kinds, rad.radius_m, tp.top_places,
             extensions.st_setsrid(extensions.st_makepoint(a.lon, a.lat), 4326)::extensions.geography AS cg
      FROM agg a JOIN kc USING (cid, sid) JOIN rad USING (cid, sid) JOIN tp USING (cid, sid)
    ), ins AS (
      INSERT INTO public.hotspot_clusters (key, grp, name, lat, lon, place_count, radius_m, kinds, top_places, societies_nearby, computed_at)
      SELECT DISTINCT ON (1) g.grp || '@' || round(c.lat::numeric, 4) || ',' || round(c.lon::numeric, 4),
             g.grp,
             left(coalesce(
               anchor.name,
               loc.name || ' · near ' || c.top_places[1],
               'Near ' || c.top_places[1] || ', ' || metro.name || ' Metro',
               'Near ' || c.top_places[1]), 120),
             c.lat, c.lon, c.n, greatest(c.radius_m, 30), c.kinds, c.top_places,
             -- "Block B, …" / "Tower 3" are parts of one society, so they are not counted.
             (SELECT count(*) FROM public.places so WHERE so.kind = 'society' AND so.name !~* '^(block|tower|pocket|wing|gate)\M'
                AND extensions.st_dwithin(so.geom, c.cg, 1500))::int,
             now()
      FROM c
      LEFT JOIN LATERAL (
        SELECT p.name FROM public.places p
        WHERE p.kind IN ('mall', 'market', 'food_court') AND extensions.st_dwithin(p.geom, c.cg, 180)
        ORDER BY (p.kind = 'mall') DESC, extensions.st_distance(p.geom, c.cg) LIMIT 1
      ) anchor ON true
      LEFT JOIN LATERAL (
        SELECT p.name FROM public.places p
        WHERE p.kind = 'locality' AND extensions.st_dwithin(p.geom, c.cg, 1200)
        ORDER BY extensions.st_distance(p.geom, c.cg) LIMIT 1
      ) loc ON true
      LEFT JOIN LATERAL (
        SELECT regexp_replace(p.name, '\s*metro( station)?$', '', 'i') AS name FROM public.places p
        WHERE p.kind = 'metro' AND extensions.st_dwithin(p.geom, c.cg, 2000)
        ORDER BY extensions.st_distance(p.geom, c.cg) LIMIT 1
      ) metro ON true
      ORDER BY 1, c.n DESC
      ON CONFLICT (key) DO UPDATE SET
        name = EXCLUDED.name, lat = EXCLUDED.lat, lon = EXCLUDED.lon, place_count = EXCLUDED.place_count,
        radius_m = EXCLUDED.radius_m, kinds = EXCLUDED.kinds, top_places = EXCLUDED.top_places,
        societies_nearby = EXCLUDED.societies_nearby, computed_at = EXCLUDED.computed_at
      RETURNING 1
    )
    SELECT count(*) INTO added FROM ins;
    total := total + added;
  END LOOP;

  INSERT INTO public.place_import_log (job, ok, rows) VALUES ('rebuild clusters', true, total);
  RETURN total;
END;
$$;

-- ── What the app calls ─────────────────────────────────────────
-- Clusters near the rider, with rider votes from the last 21 days.
CREATE OR REPLACE FUNCTION public.nearby_clusters(p_lat DOUBLE PRECISION, p_lon DOUBLE PRECISION, p_grp TEXT, p_radius_km DOUBLE PRECISION DEFAULT 6, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (key TEXT, name TEXT, lat DOUBLE PRECISION, lon DOUBLE PRECISION, dist_km NUMERIC, place_count INTEGER, radius_m INTEGER, kinds JSONB, top_places TEXT[], societies_nearby INTEGER, busy INTEGER, quiet INTEGER)
LANGUAGE sql STABLE SET search_path = '' AS $$
  WITH me AS (SELECT extensions.st_setsrid(extensions.st_makepoint(p_lon, p_lat), 4326)::extensions.geography AS g)
  SELECT c.key, c.name, c.lat, c.lon,
         round((extensions.st_distance(c.geom, me.g) / 1000)::numeric, 1),
         c.place_count, c.radius_m, c.kinds, c.top_places, c.societies_nearby,
         coalesce(v.busy, 0)::int, coalesce(v.quiet, 0)::int
  FROM public.hotspot_clusters c CROSS JOIN me
  LEFT JOIN LATERAL (
    SELECT count(*) FILTER (WHERE f.busy) AS busy, count(*) FILTER (WHERE NOT f.busy) AS quiet
    FROM public.spot_feedback f WHERE f.zone = c.key AND f.created_at > now() - interval '21 days'
  ) v ON true
  WHERE c.grp = p_grp
    AND c.computed_at = (SELECT max(h.computed_at) FROM public.hotspot_clusters h)
    AND extensions.st_dwithin(c.geom, me.g, least(greatest(p_radius_km, 0.5), 15) * 1000)
  -- Bigger and closer first; the app re-ranks per time window.
  ORDER BY c.place_count / (1 + extensions.st_distance(c.geom, me.g) / 1500) DESC
  LIMIT least(greatest(p_limit, 1), 40)
$$;

-- Single named places near the rider (metro stations, malls, societies, …).
-- p_limit is PER KIND, so a dense kind (societies, offices) can't crowd out metros.
CREATE OR REPLACE FUNCTION public.nearby_places(p_lat DOUBLE PRECISION, p_lon DOUBLE PRECISION, p_kinds TEXT[], p_radius_km DOUBLE PRECISION DEFAULT 6, p_limit INTEGER DEFAULT 8)
RETURNS TABLE (name TEXT, kind TEXT, lat DOUBLE PRECISION, lon DOUBLE PRECISION, dist_km NUMERIC, notable BOOLEAN)
LANGUAGE sql STABLE SET search_path = '' AS $$
  WITH me AS (SELECT extensions.st_setsrid(extensions.st_makepoint(p_lon, p_lat), 4326)::extensions.geography AS g),
  near AS (
    SELECT p.name, p.kind, p.lat, p.lon, p.notable, extensions.st_distance(p.geom, me.g) AS d,
           row_number() OVER (PARTITION BY p.kind, lower(p.name) ORDER BY extensions.st_distance(p.geom, me.g)) AS dup
    FROM public.places p CROSS JOIN me
    WHERE p.kind = ANY (p_kinds)
      AND (p.source <> 'osm' OR p.updated_at > now() - interval '75 days')
      AND (p.source = 'osm' OR coalesce(p.confidence, 0) >= 0.75)
      AND NOT (p.kind = 'society' AND p.name ~* '^(block|tower|pocket|wing|gate)\M')
      AND extensions.st_dwithin(p.geom, me.g, least(greatest(p_radius_km, 0.5), 15) * 1000)
  ), ranked AS (
    -- A well-known place counts as half as far, so major hubs across the
    -- search radius are kept even when many small places are closer.
    SELECT *, row_number() OVER (PARTITION BY kind ORDER BY CASE WHEN notable THEN d / 2 ELSE d END) AS rn FROM near WHERE dup = 1
  )
  SELECT name, kind, lat, lon, round((d / 1000)::numeric, 1), notable
  FROM ranked WHERE rn <= least(greatest(p_limit, 1), 20)
  ORDER BY d
$$;

-- ── Tile queue: keeps the copy fresh on its own ────────────────
-- Delhi NCR is split into 64 rectangles. A scheduled "tick" loads the stalest
-- ones (central areas first), a few per run, and retries failures on later
-- ticks. Each rectangle is refreshed every 28 days; when all are fresh the
-- clusters are rebuilt. Every run finishes well inside Supabase's 2-minute
-- statement limit.
CREATE TABLE IF NOT EXISTS public.place_tiles (
  id        INTEGER PRIMARY KEY,
  s         DOUBLE PRECISION NOT NULL,
  w         DOUBLE PRECISION NOT NULL,
  n         DOUBLE PRECISION NOT NULL,
  e         DOUBLE PRECISION NOT NULL,
  prio      DOUBLE PRECISION NOT NULL,  -- distance from central NCR; lower loads first
  last_ok   TIMESTAMPTZ,
  last_try  TIMESTAMPTZ,
  last_note TEXT
);
ALTER TABLE public.place_tiles ENABLE ROW LEVEL SECURITY;  -- no policies: dashboard only

INSERT INTO public.place_tiles (id, s, w, n, e, prio)
SELECT r * 8 + c,
       round((28.38 + r * 0.065)::numeric, 3), round((76.92 + c * 0.08)::numeric, 3),
       round((28.38 + (r + 1) * 0.065)::numeric, 3), round((76.92 + (c + 1) * 0.08)::numeric, 3),
       abs(28.38 + (r + 0.5) * 0.065 - 28.60) + abs(76.92 + (c + 0.5) * 0.08 - 77.28)
FROM generate_series(0, 7) r, generate_series(0, 7) c
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.rk_import_tick() RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  t       public.place_tiles%ROWTYPE;
  r       INTEGER;
  started TIMESTAMPTZ := clock_timestamp();
  done    INTEGER := 0;
  failed  INTEGER := 0;
  stale   INTEGER;
BEGIN
  LOOP
    EXIT WHEN clock_timestamp() - started > interval '25 seconds';
    SELECT * INTO t FROM public.place_tiles
      WHERE (last_ok IS NULL OR last_ok < now() - interval '28 days')
        AND (last_try IS NULL OR last_try < started)
      ORDER BY last_try NULLS FIRST, prio LIMIT 1;
    EXIT WHEN NOT FOUND;
    r := public.rk_import_osm_tile(t.s, t.w, t.n, t.e);
    INSERT INTO public.place_tiles (id, s, w, n, e, prio, last_ok, last_try, last_note)
    VALUES (t.id, t.s, t.w, t.n, t.e, t.prio, CASE WHEN r >= 0 THEN clock_timestamp() END, clock_timestamp(), CASE WHEN r >= 0 THEN r || ' places' ELSE 'failed' END)
    ON CONFLICT (id) DO UPDATE SET
      last_ok = coalesce(EXCLUDED.last_ok, public.place_tiles.last_ok),
      last_try = EXCLUDED.last_try, last_note = EXCLUDED.last_note;
    -- Servers busy: stop for now and let the next tick try again.
    IF r >= 0 THEN done := done + 1; ELSE failed := failed + 1; EXIT; END IF;
  END LOOP;

  SELECT count(*) INTO stale FROM public.place_tiles WHERE last_ok IS NULL OR last_ok < now() - interval '28 days';
  IF stale = 0 AND coalesce((SELECT max(computed_at) FROM public.hotspot_clusters), '-infinity') < (SELECT max(last_ok) FROM public.place_tiles) THEN
    PERFORM public.rk_rebuild_clusters();
    RETURN format('%s tiles ok, %s failed, clusters rebuilt', done, failed);
  END IF;
  RETURN format('%s tiles ok, %s failed, %s still to load', done, failed, stale);
END;
$$;
REVOKE ALL ON FUNCTION public.rk_import_tick() FROM PUBLIC, anon, authenticated;

-- Schedule the tick (needs the pg_cron extension: Supabase → Database →
-- Extensions → pg_cron). Every minute is right for the first load, which then
-- takes about an hour; once `select count(*) from place_tiles where last_ok is
-- null` reaches 0, hourly is plenty:
--   SELECT cron.schedule('rk-places-tick', '* * * * *', 'select public.rk_import_tick()');
--   SELECT cron.schedule('rk-places-tick', '7 * * * *', 'select public.rk_import_tick()');
-- Progress: SELECT * FROM place_import_log ORDER BY id DESC LIMIT 20;

REVOKE ALL ON FUNCTION public.rk_import_osm_tile(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rk_rebuild_clusters() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nearby_clusters(DOUBLE PRECISION, DOUBLE PRECISION, TEXT, DOUBLE PRECISION, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nearby_places(DOUBLE PRECISION, DOUBLE PRECISION, TEXT[], DOUBLE PRECISION, INTEGER) TO anon, authenticated;
