-- DEC-037 / #146 — batch attendance recording via SECURITY DEFINER RPC.
-- Instructors have SELECT-only on session_attendance (see baseline RLS); rather
-- than open an UPDATE policy, route writes through a SECURITY DEFINER RPC.
-- This mirrors `update_session_notes` (20260429170000) exactly: auth check via
-- `get_instructor_session_ids`, admin via jwt user_metadata, RETURNS text with
-- NULL = success, explicit GRANT EXECUTE TO authenticated.
--
-- Authorization: caller must be admin OR the assigned instructor for this session
-- (course-level instructor_id, OR session-level instructor_id override per DEC-007).
-- `get_instructor_session_ids` already encodes both shapes.
--
-- Invariants:
--   * Every UPDATE pins `session_id = p_session_id`, so a caller can never
--     write attendance rows belonging to a session they don't own, no matter
--     what enrollment_ids appear in p_records.
--   * `makeup_session_id` is never referenced — cross-course makeup links
--     (DEC-005/006) are preserved across attendance saves.

CREATE OR REPLACE FUNCTION public.save_attendance(
  p_session_id uuid,
  p_records    jsonb
) RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_uid    uuid := auth.uid();
  v_admin  boolean := (((auth.jwt() -> 'user_metadata') ->> 'is_admin') = 'true');
  v_owns   boolean;
  v_rec    jsonb;
  v_status text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN 'Not authenticated.';
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

  -- Validate every record BEFORE writing any, so a bad status in the middle of
  -- a batch can't leave a partial save behind (RETURN does not roll back prior
  -- UPDATEs within the caller's transaction).
  FOR v_rec IN SELECT * FROM jsonb_array_elements(coalesce(p_records, '[]'::jsonb))
  LOOP
    v_status := v_rec ->> 'status';
    IF v_status IS NULL
       OR v_status NOT IN ('expected', 'attended', 'missed', 'excused') THEN
      RETURN 'Invalid attendance status: ' || coalesce(v_status, '(missing)') || '.';
    END IF;
  END LOOP;

  FOR v_rec IN SELECT * FROM jsonb_array_elements(coalesce(p_records, '[]'::jsonb))
  LOOP
    -- session_id is pinned to p_session_id (never taken from the record), and
    -- makeup_session_id is deliberately untouched (DEC-005/006).
    UPDATE public.session_attendance
       SET status     = v_rec ->> 'status',
           notes      = nullif(trim(v_rec ->> 'notes'), ''),
           updated_at = now()
     WHERE session_id    = p_session_id
       AND enrollment_id = (v_rec ->> 'enrollment_id')::uuid;
  END LOOP;

  RETURN NULL;
END;
$$;

-- Supabase's `authenticated` role does not inherit from PUBLIC, so the default
-- EXECUTE-to-PUBLIC grant does not reach it. Explicit grant required.
GRANT EXECUTE ON FUNCTION public.save_attendance(uuid, jsonb) TO authenticated;
