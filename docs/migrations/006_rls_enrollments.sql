-- Phase 2.8 — RLS policies for enrollments table
--
-- Access patterns:
--   Admin: full CRUD (confirm, cancel, view all enrollments)
--   Students: read own, insert new, update own (re-enroll after cancellation)
--   Instructors: read enrollments for courses they're assigned to (roster)
--
-- NOTE: Instructor policy uses SECURITY DEFINER helper to avoid RLS recursion
-- with courses table. The helper function is created in 007_fix_rls_recursion.sql —
-- run that first if applying these migrations fresh.

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

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

-- Admin: full access
CREATE POLICY "Admins can do anything with enrollments"
  ON enrollments
  FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin') = 'true')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin') = 'true');

-- Students: read own enrollments
CREATE POLICY "Students can read own enrollments"
  ON enrollments
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_student') = 'true'
    AND student_id = auth.uid()
  );

-- Students: insert own enrollments
CREATE POLICY "Students can enroll themselves"
  ON enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'is_student') = 'true'
    AND student_id = auth.uid()
  );

-- Students: update own enrollments (re-enroll after cancellation)
CREATE POLICY "Students can update own enrollments"
  ON enrollments
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_student') = 'true'
    AND student_id = auth.uid()
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'is_student') = 'true'
    AND student_id = auth.uid()
  );

-- Instructors: read enrollments for their courses (roster view)
CREATE POLICY "Instructors can read enrollments for their courses"
  ON enrollments
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_instructor') = 'true'
    AND course_id IN (SELECT get_instructor_course_ids(auth.uid()))
  );
