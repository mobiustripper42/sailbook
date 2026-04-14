-- Fix NULL coercion in instructor deactivation cascade trigger.
-- Original used `= TRUE`/`= FALSE` which evaluates to NULL (not false) when the
-- column itself is NULL. IS TRUE / IS FALSE is the NULL-safe form.
-- Also makes the trigger creation idempotent by dropping before re-creating.

CREATE OR REPLACE FUNCTION public.cascade_instructor_deactivation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (OLD.is_active IS TRUE AND NEW.is_active IS FALSE AND NEW.is_instructor IS TRUE)
     OR (OLD.is_instructor IS TRUE AND NEW.is_instructor IS FALSE)
  THEN
    UPDATE public.courses  SET instructor_id = NULL WHERE instructor_id = NEW.id;
    UPDATE public.sessions SET instructor_id = NULL WHERE instructor_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cascade_instructor_deactivation ON public.profiles;

CREATE TRIGGER trg_cascade_instructor_deactivation
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.cascade_instructor_deactivation();
