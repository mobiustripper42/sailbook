-- RLS audit fix: restrict student enrollment updates + fix cancelled enrollment visibility
--
-- Finding 1: "Students can update own enrollments" WITH CHECK had no status restriction —
-- a student could set status='completed' or 'confirmed' directly via the Supabase client,
-- bypassing server actions. Restrict to status='cancelled' only (the only legitimate
-- student-initiated transition in V1 and V2).
--
-- Finding 2: get_enrolled_course_ids returned cancelled enrollments, giving students
-- session visibility for courses they've cancelled from.

-- ============================================================
-- Fix 1: Tighten student enrollment UPDATE policy
-- ============================================================

DROP POLICY IF EXISTS "Students can update own enrollments" ON public.enrollments;

CREATE POLICY "Students can update own enrollments"
  ON public.enrollments
  FOR UPDATE
  TO authenticated
  USING (
    ((auth.jwt() -> 'user_metadata'::text) ->> 'is_student'::text) = 'true'::text
    AND student_id = auth.uid()
  )
  WITH CHECK (
    ((auth.jwt() -> 'user_metadata'::text) ->> 'is_student'::text) = 'true'::text
    AND student_id = auth.uid()
    AND (status)::text = 'cancelled'::text
  );

-- ============================================================
-- Fix 2: Exclude cancelled enrollments from course/session visibility
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_enrolled_course_ids(user_id uuid)
  RETURNS SETOF uuid
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT course_id
  FROM enrollments
  WHERE student_id = user_id
    AND status != 'cancelled';
$$;
