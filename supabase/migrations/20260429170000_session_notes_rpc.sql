-- Phase 4.6 — instructor notes on sessions (IN-5).
-- Instructors don't have UPDATE on sessions (they have SELECT only — see baseline).
-- Rather than open a column-scoped UPDATE policy, route writes through a SECURITY DEFINER
-- RPC. This mirrors the pattern used for `update_my_profile` (DEC-021 era) and keeps the
-- attack surface tight: the function is the only path through which instructors can
-- modify a session row, and it touches only the `notes` column.
--
-- Authorization: caller must be admin OR the assigned instructor for this session
-- (course-level instructor_id, OR session-level instructor_id override per DEC-007).
-- `get_instructor_session_ids` already encodes both shapes.

CREATE OR REPLACE FUNCTION public.update_session_notes(
  p_session_id uuid,
  p_notes      text
) RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_uid    uuid := auth.uid();
  v_admin  boolean := (((auth.jwt() -> 'user_metadata') ->> 'is_admin') = 'true');
  v_owns   boolean;
BEGIN
  IF v_uid IS NULL THEN
    RETURN 'Not authenticated.';
  END IF;

  IF length(coalesce(p_notes, '')) > 2000 THEN
    RETURN 'Notes must be 2000 characters or fewer.';
  END IF;

  IF NOT v_admin THEN
    SELECT EXISTS (
      SELECT 1 FROM public.get_instructor_session_ids(v_uid) AS sid
      WHERE sid = p_session_id
    ) INTO v_owns;

    IF NOT v_owns THEN
      RETURN 'Not authorized for this session.';
    END IF;
  END IF;

  UPDATE public.sessions
     SET notes      = nullif(trim(p_notes), ''),
         updated_at = now()
   WHERE id = p_session_id;

  IF NOT FOUND THEN
    RETURN 'Session not found.';
  END IF;

  RETURN NULL;
END;
$$;

-- Supabase's `authenticated` role does not inherit from PUBLIC, so the default
-- EXECUTE-to-PUBLIC grant does not reach it. Explicit grant required.
GRANT EXECUTE ON FUNCTION public.update_session_notes(uuid, text) TO authenticated;
