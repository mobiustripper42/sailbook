-- Phase 5.7: Waitlist
--
-- Students can join a waitlist when a course is full. When a confirmed
-- enrollment is cancelled (status -> 'cancelled'), every current waitlister
-- gets notified (race-to-enroll). The student's waitlist row is auto-deleted
-- when they enroll in that course.
--
-- Position is FIFO by created_at. notified_at is stamped each time a spot
-- opens (overwritten on subsequent openings).

CREATE TABLE public.waitlist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz,
  UNIQUE (course_id, student_id)
);

CREATE INDEX waitlist_entries_course_created_idx
  ON public.waitlist_entries (course_id, created_at);

ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do anything with waitlist_entries"
  ON public.waitlist_entries
  FOR ALL TO authenticated
  USING ((((auth.jwt() -> 'user_metadata') ->> 'is_admin') = 'true'))
  WITH CHECK ((((auth.jwt() -> 'user_metadata') ->> 'is_admin') = 'true'));

CREATE POLICY "Students can read own waitlist entries"
  ON public.waitlist_entries
  FOR SELECT TO authenticated
  USING (
    (((auth.jwt() -> 'user_metadata') ->> 'is_student') = 'true')
    AND student_id = auth.uid()
  );

CREATE POLICY "Students can insert own waitlist entries"
  ON public.waitlist_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    (((auth.jwt() -> 'user_metadata') ->> 'is_student') = 'true')
    AND student_id = auth.uid()
  );

CREATE POLICY "Students can delete own waitlist entries"
  ON public.waitlist_entries
  FOR DELETE TO authenticated
  USING (
    (((auth.jwt() -> 'user_metadata') ->> 'is_student') = 'true')
    AND student_id = auth.uid()
  );

-- Students can also see siblings on the same waitlist (just count for
-- position display) — but reading other students' rows would leak who's
-- on the list. Position is computed via a SECURITY DEFINER RPC instead.

CREATE OR REPLACE FUNCTION public.get_waitlist_position(p_course_id uuid)
RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_position integer;
BEGIN
  IF v_uid IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT position INTO v_position FROM (
    SELECT student_id,
           ROW_NUMBER() OVER (ORDER BY created_at, id) AS position
    FROM public.waitlist_entries
    WHERE course_id = p_course_id
  ) ranked
  WHERE student_id = v_uid;

  RETURN v_position;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_waitlist_position(uuid) TO authenticated;
