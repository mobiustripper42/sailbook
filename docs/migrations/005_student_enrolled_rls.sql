-- Fix: Students need to read courses/sessions they're enrolled in,
-- not just active ones. Without this, completed/cancelled courses
-- show as blank cards in My Courses, and past filter is always empty.
--
-- NOTE: Uses SECURITY DEFINER helper to avoid RLS recursion with enrollments table.
-- The helper function is created in 007_fix_rls_recursion.sql — run that first if
-- applying these migrations fresh.

-- Helper: get course IDs a student is enrolled in (bypasses enrollments RLS)
CREATE OR REPLACE FUNCTION get_enrolled_course_ids(user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT course_id FROM enrollments WHERE student_id = user_id;
$$;

-- Courses: students can see any course they're enrolled in
CREATE POLICY "Students can read their enrolled courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_student') = 'true'
    AND id IN (SELECT get_enrolled_course_ids(auth.uid()))
  );

-- Sessions: students can see sessions for any course they're enrolled in
CREATE POLICY "Students can read sessions for their enrolled courses"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_student') = 'true'
    AND course_id IN (SELECT get_enrolled_course_ids(auth.uid()))
  );
