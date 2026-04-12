-- RLS audit follow-up (code review findings):
--
-- Finding A: get_student_enrollment_ids included cancelled enrollments —
-- students could still read/update session_attendance rows for cancelled
-- enrollments. Apply the same fix used for get_enrolled_course_ids.
--
-- Finding B: "Students can update own enrollments" USING clause had no guard
-- on the starting status — a student could flip a completed enrollment to
-- cancelled. Completed enrollments are historical record and should not be
-- student-modifiable.

-- ============================================================
-- Fix A: Exclude cancelled enrollments from attendance visibility
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_student_enrollment_ids(user_id uuid)
  RETURNS SETOF uuid
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT id
  FROM enrollments
  WHERE student_id = user_id
    AND status != 'cancelled';
$$;

ALTER FUNCTION public.get_student_enrollment_ids(uuid) OWNER TO "postgres";

-- ============================================================
-- Fix B: Prevent students from modifying completed enrollments
-- ============================================================

DROP POLICY IF EXISTS "Students can update own enrollments" ON public.enrollments;

CREATE POLICY "Students can update own enrollments"
  ON public.enrollments
  FOR UPDATE
  TO authenticated
  USING (
    ((auth.jwt() -> 'user_metadata'::text) ->> 'is_student'::text) = 'true'::text
    AND student_id = auth.uid()
    AND (status)::text != 'completed'::text
  )
  WITH CHECK (
    ((auth.jwt() -> 'user_metadata'::text) ->> 'is_student'::text) = 'true'::text
    AND student_id = auth.uid()
    AND (status)::text = 'cancelled'::text
  );
