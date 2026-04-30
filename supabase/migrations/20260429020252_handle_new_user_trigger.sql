-- Phase 3.11: handle_new_user trigger
-- Auto-creates a public.profiles row whenever a row is inserted into auth.users.
-- This unifies profile creation across all auth paths:
--   - email/password signup (raw_user_meta_data: first_name, last_name, phone, ...)
--   - Google OAuth (raw_user_meta_data: given_name, family_name, name)
--   - admin-created students (admin code follows up with an UPSERT to add fields
--     the trigger doesn't see, e.g. asa_number, auth_source)
--
-- Before this migration, register() did its own service-role profile insert.
-- That path is removed in the same commit — single source of truth.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_first_name text;
  v_last_name  text;
  v_full       text;
BEGIN
  -- Email/password path supplies first_name + last_name directly.
  -- Google OAuth supplies `name` / `full_name` only (no given/family split, as
  -- of Supabase GoTrue 2.x). Split the full name on the first space as a
  -- best-effort — "Eric Stoffer" → ("Eric", "Stoffer"); "Mary Jane Smith" →
  -- ("Mary", "Jane Smith"). User can edit on /student/account.
  v_full := COALESCE(
    NULLIF(meta->>'full_name', ''),
    NULLIF(meta->>'name', ''),
    ''
  );

  v_first_name := COALESCE(
    NULLIF(meta->>'first_name', ''),
    NULLIF(meta->>'given_name', ''),
    NULLIF(split_part(v_full, ' ', 1), ''),
    ''
  );
  v_last_name := COALESCE(
    NULLIF(meta->>'last_name', ''),
    NULLIF(meta->>'family_name', ''),
    NULLIF(NULLIF(SUBSTRING(v_full FROM POSITION(' ' IN v_full) + 1), v_full), ''),
    ''
  );

  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    phone,
    experience_level,
    instructor_notes,
    is_admin,
    is_instructor,
    is_student
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name,
    NULLIF(meta->>'phone', ''),
    NULLIF(meta->>'experience_level', ''),
    NULLIF(meta->>'instructor_notes', ''),
    COALESCE((meta->>'is_admin')::boolean, false),
    COALESCE((meta->>'is_instructor')::boolean, false),
    -- Default new accounts to student. Admin/instructor are granted via invite
    -- (4.1) or admin-created flow.
    COALESCE((meta->>'is_student')::boolean, true)
  )
  ON CONFLICT (id) DO NOTHING;

  -- Stamp role flag defaults into raw_user_meta_data so proxy.ts can read them
  -- from the JWT without a DB lookup per request. Email/password signUp
  -- already supplies these via options.data; Google OAuth does not. Existing
  -- keys win, so this only adds defaults — admin/instructor promotion still
  -- happens via accept_invite (4.1) which writes to public.profiles.
  UPDATE auth.users
  SET raw_user_meta_data =
    jsonb_build_object('is_admin', false, 'is_instructor', false, 'is_student', true)
    || COALESCE(raw_user_meta_data, '{}'::jsonb)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
