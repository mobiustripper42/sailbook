-- Cascade instructor deactivation to course and session assignments.
-- Fires on two events:
--   1. is_active changes FALSE while the profile is still an instructor
--   2. is_instructor changes FALSE (instructor role removed entirely)
-- In both cases, NULL out instructor_id on courses and sessions.
-- SECURITY DEFINER so the trigger can write those tables regardless of the
-- calling session's RLS context (the check happens at the profiles UPDATE,
-- which is already guarded by the admin-only policy).

CREATE OR REPLACE FUNCTION public.cascade_instructor_deactivation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (OLD.is_active = TRUE AND NEW.is_active = FALSE AND NEW.is_instructor = TRUE)
     OR (OLD.is_instructor = TRUE AND NEW.is_instructor = FALSE)
  THEN
    UPDATE public.courses  SET instructor_id = NULL WHERE instructor_id = NEW.id;
    UPDATE public.sessions SET instructor_id = NULL WHERE instructor_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cascade_instructor_deactivation
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.cascade_instructor_deactivation();
