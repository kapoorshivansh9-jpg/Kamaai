-- SUPERSEDED by profile-security.sql (8 Oct 2026), which replaces save_profile()
-- with a version bound to the signed-in account. Kept for history only.

-- RideKamao — make profile edits actually reach the database.
-- Run ONCE in Supabase → SQL Editor → New query → Run. Safe to re-run.
--
-- Why: profiles has no public SELECT policy (on purpose — nobody may read
-- riders' emails). But Postgres applies SELECT policies to the WHERE clause of
-- an UPDATE, so the app's "update where email = …" matched zero rows and a
-- returning rider's changes were silently dropped. This function does the
-- insert-or-update on the server instead, without opening any read access.
-- It can only write the six profile fields for the exact email it is given.

CREATE OR REPLACE FUNCTION public.save_profile(
  p_email         text,
  p_name          text,
  p_profession    text,
  p_language      text,
  p_goals         text[],
  p_weekly_target integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_email IS NULL OR length(p_email) > 320 OR position('@' IN p_email) < 2 THEN
    RAISE EXCEPTION 'invalid email';
  END IF;
  IF p_profession IS NOT NULL AND p_profession NOT IN ('food', 'auto', 'biketx', 'cab', 'qcom') THEN
    RAISE EXCEPTION 'invalid profession';
  END IF;
  IF p_language IS NOT NULL AND p_language NOT IN ('en', 'hi', 'pa', 'bn', 'ta', 'mr') THEN
    RAISE EXCEPTION 'invalid language';
  END IF;
  IF coalesce(array_length(p_goals, 1), 0) > 8 THEN
    RAISE EXCEPTION 'too many goals';
  END IF;
  IF p_weekly_target IS NOT NULL AND (p_weekly_target < 0 OR p_weekly_target > 1000000) THEN
    RAISE EXCEPTION 'invalid weekly target';
  END IF;

  INSERT INTO public.profiles (email, name, profession, language, goals, weekly_target, updated_at)
  VALUES (p_email, left(p_name, 120), p_profession, p_language, p_goals, p_weekly_target, now())
  ON CONFLICT (email) DO UPDATE SET
    name          = EXCLUDED.name,
    profession    = EXCLUDED.profession,
    language      = EXCLUDED.language,
    goals         = EXCLUDED.goals,
    weekly_target = EXCLUDED.weekly_target,
    updated_at    = now();
END;
$$;

REVOKE ALL ON FUNCTION public.save_profile(text, text, text, text, text[], integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_profile(text, text, text, text, text[], integer) TO anon, authenticated;
