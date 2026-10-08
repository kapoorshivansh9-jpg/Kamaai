-- RideKamao — lock down profile writes (follows the 8 Oct 2026 production audit).
-- Run ONCE in Supabase → SQL Editor, after profile-save-function.sql.
--
-- What it fixes:
--   1. Anyone with the public key could overwrite a rider's profile by knowing
--      their email. Writes are now bound to the signed-in account.
--   2. "Ravi@x.com" and " ravi@x.com" created separate profiles. Email is now
--      normalised to lower(trim()) on every write, with a unique index on it.
--   3. A direct insert into the table skipped all validation. The table now
--      enforces the rules itself, and the browser can no longer write to it
--      directly: save_profile() is the only way in.
--
-- Before running on a database with existing rows, check that they pass the
-- constraints below (the 8 Oct audit's 183 test rows were deleted first).

-- 1. Ownership: link a profile to the signed-in Supabase Auth account.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_key ON public.profiles (user_id) WHERE user_id IS NOT NULL;

-- 2. Normalise on every write, whatever path it comes from.
CREATE OR REPLACE FUNCTION public.profiles_normalize() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  -- The browser roles may not write this table directly: every write must come
  -- through save_profile(), which runs as the table owner. This holds even
  -- while an old INSERT/UPDATE policy still exists.
  IF current_user IN ('anon', 'authenticated') THEN
    RAISE EXCEPTION 'profiles can only be written through save_profile()' USING ERRCODE = '42501';
  END IF;
  NEW.email := lower(btrim(NEW.email));
  NEW.name := nullif(btrim(NEW.name), '');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS profiles_normalize ON public.profiles;
CREATE TRIGGER profiles_normalize BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_normalize();
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_norm_key ON public.profiles (lower(btrim(email)));

-- 3. The same rules save_profile() applied, now enforced by the table.
--    (goals values are new: the four the app offers.)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_email_chk,
  DROP CONSTRAINT IF EXISTS profiles_profession_chk,
  DROP CONSTRAINT IF EXISTS profiles_language_chk,
  DROP CONSTRAINT IF EXISTS profiles_target_chk,
  DROP CONSTRAINT IF EXISTS profiles_goals_chk,
  DROP CONSTRAINT IF EXISTS profiles_name_chk;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_email_chk CHECK (email = lower(btrim(email)) AND length(email) <= 320
      AND email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  ADD CONSTRAINT profiles_profession_chk CHECK (profession IS NULL OR profession IN ('food', 'auto', 'biketx', 'cab', 'qcom')),
  ADD CONSTRAINT profiles_language_chk CHECK (language IS NULL OR language IN ('en', 'hi', 'pa', 'bn', 'ta', 'mr')),
  ADD CONSTRAINT profiles_target_chk CHECK (weekly_target IS NULL OR weekly_target BETWEEN 0 AND 1000000),
  ADD CONSTRAINT profiles_goals_chk CHECK (cardinality(coalesce(goals, '{}')) <= 8
      AND coalesce(goals, '{}') <@ ARRAY['earn', 'target', 'heat', 'traffic']),
  ADD CONSTRAINT profiles_name_chk CHECK (name IS NULL OR length(name) <= 120);

-- 4. No direct writes from the browser. The trigger above already refuses
--    them; this removes the old policies and table grants as well, so the
--    table's permissions say the same thing. (Anonymous SELECT already returns
--    nothing: RLS is on and there is no SELECT policy.)
DROP POLICY IF EXISTS "anon_insert_profiles" ON public.profiles;
DROP POLICY IF EXISTS "anon_update_profiles" ON public.profiles;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.profiles FROM anon, authenticated;

-- 5. save_profile() is the only write path.
--    Signed in: the email comes from the account, never from the request; the
--      rider's own row is created or updated, and an unclaimed row with the
--      same (Google-verified) email is claimed.
--    Not signed in: a brand-new email is created; an existing email is left
--      untouched, and the response is the same either way, so the call does
--      not reveal whether an email is registered.
CREATE OR REPLACE FUNCTION public.save_profile(
  p_email         text,
  p_name          text,
  p_profession    text,
  p_language      text,
  p_goals         text[],
  p_weekly_target integer
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_email text;
BEGIN
  IF v_uid IS NOT NULL THEN
    SELECT lower(btrim(u.email)) INTO v_email FROM auth.users u WHERE u.id = v_uid;
    IF v_email IS NULL OR v_email = '' THEN
      RAISE EXCEPTION 'signed-in account has no email';
    END IF;
    INSERT INTO public.profiles AS p (email, user_id, name, profession, language, goals, weekly_target)
    VALUES (v_email, v_uid, left(p_name, 120), p_profession, p_language, p_goals, p_weekly_target)
    ON CONFLICT (email) DO UPDATE SET
      user_id = v_uid, name = EXCLUDED.name, profession = EXCLUDED.profession,
      language = EXCLUDED.language, goals = EXCLUDED.goals, weekly_target = EXCLUDED.weekly_target
    WHERE p.user_id IS NULL OR p.user_id = v_uid;
  ELSE
    INSERT INTO public.profiles (email, name, profession, language, goals, weekly_target)
    VALUES (lower(btrim(p_email)), left(p_name, 120), p_profession, p_language, p_goals, p_weekly_target)
    ON CONFLICT (email) DO NOTHING;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.save_profile(text, text, text, text, text[], integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_profile(text, text, text, text, text[], integer) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.profiles_normalize() FROM PUBLIC, anon, authenticated;
