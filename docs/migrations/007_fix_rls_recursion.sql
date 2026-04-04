-- Fix infinite recursion between courses and enrollments RLS policies.
--
-- The cycle: courses policy → subquery on enrollments → enrollments policy → subquery on courses → loop
-- Solution: SECURITY DEFINER helper functions that bypass RLS for the cross-table lookups.

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

-- Helper: get course IDs an instructor is assigned to (bypasses courses RLS)
CREATE OR REPLACE FUNCTION get_instructor_course_ids(user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM courses WHERE instructor_id = user_id;
$$;

-- Drop the policies that cause recursion
DROP POLICY IF EXISTS "Students can read their enrolled courses" ON courses;
DROP POLICY IF EXISTS "Students can read sessions for their enrolled courses" ON sessions;
DROP POLICY IF EXISTS "Instructors can read enrollments for their courses" ON enrollments;

-- Recreate using helper functions (no cross-table RLS evaluation)
CREATE POLICY "Students can read their enrolled courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_student') = 'true'
    AND id IN (SELECT get_enrolled_course_ids(auth.uid()))
  );

CREATE POLICY "Students can read sessions for their enrolled courses"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_student') = 'true'
    AND course_id IN (SELECT get_enrolled_course_ids(auth.uid()))
  );

CREATE POLICY "Instructors can read enrollments for their courses"
  ON enrollments
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_instructor') = 'true'
    AND course_id IN (SELECT get_instructor_course_ids(auth.uid()))
  );
