-- BUG: Admin-created students who later sign in with Google hit an infinite
-- redirect loop. Root cause: Supabase overwrites raw_user_meta_data with the
-- OAuth provider payload when linking a new identity to an existing auth.users
-- row, wiping the is_admin/is_instructor/is_student flags that
-- handle_new_user stamped. proxy.ts reads those flags from the JWT (no DB
-- lookup per request — intentional per DEC). Missing flags → role guard
-- redirects /student/* to getPrimaryHome() → /student/dashboard → loop.
--
-- Fix: BEFORE UPDATE trigger that re-stamps role flags from public.profiles
-- whenever raw_user_meta_data changes and any flag is missing. BEFORE UPDATE
-- means the merge rides the same row write — no second UPDATE, no re-trigger.

CREATE OR REPLACE FUNCTION public.handle_user_meta_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin       boolean;
  v_is_instructor  boolean;
  v_is_student     boolean;
BEGIN
  -- Only act when the metadata column actually changed AND at least one role
  -- flag is missing from the incoming value (the OAuth-clobber pattern).
  IF (NEW.raw_user_meta_data IS DISTINCT FROM OLD.raw_user_meta_data) AND (
       NEW.raw_user_meta_data->>'is_admin'      IS NULL OR
       NEW.raw_user_meta_data->>'is_instructor' IS NULL OR
       NEW.raw_user_meta_data->>'is_student'    IS NULL
     ) THEN

    SELECT p.is_admin, p.is_instructor, p.is_student
      INTO v_is_admin, v_is_instructor, v_is_student
      FROM public.profiles p
     WHERE p.id = NEW.id;

    IF FOUND THEN
      -- Overlay flags on top of the incoming payload so OAuth keys (name,
      -- picture, iss, sub, …) are preserved but role flags always win.
      NEW.raw_user_meta_data = NEW.raw_user_meta_data || jsonb_build_object(
        'is_admin',      v_is_admin,
        'is_instructor', v_is_instructor,
        'is_student',    v_is_student
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_meta_update ON auth.users;

CREATE TRIGGER on_auth_user_meta_update
  BEFORE UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_meta_update();

-- Backfill: re-stamp any existing rows that lost their flags (e.g. the user
-- who triggered this bug report). Joins profiles as the source of truth.
-- The new BEFORE UPDATE trigger will fire for each row here; since we're
-- setting flags explicitly, the trigger condition (any flag missing in NEW)
-- evaluates against the value we're about to write — flags are present, so
-- the trigger is a no-op and doesn't double-stamp.
UPDATE auth.users u
   SET raw_user_meta_data =
         COALESCE(u.raw_user_meta_data, '{}'::jsonb)
         || jsonb_build_object(
              'is_admin',      p.is_admin,
              'is_instructor', p.is_instructor,
              'is_student',    p.is_student
            )
  FROM public.profiles p
 WHERE u.id = p.id
   AND (
     u.raw_user_meta_data->>'is_admin'      IS NULL OR
     u.raw_user_meta_data->>'is_instructor' IS NULL OR
     u.raw_user_meta_data->>'is_student'    IS NULL
   );
