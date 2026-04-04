-- Phase 1 RLS Policies
-- Run in Supabase SQL Editor
-- Tables: course_types, courses, sessions

-- ============================================================
-- COURSE TYPES (task 1.3)
-- Admin: full CRUD
-- All authenticated users: read active types (instructors + students need this for forms)
-- ============================================================

ALTER TABLE course_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do anything with course_types"
  ON course_types
  FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Authenticated users can read active course_types"
  ON course_types
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================================
-- COURSES (task 1.8)
-- Admin: full CRUD
-- Instructors: read their own courses
-- Students: read active courses (for browsing in Phase 2)
-- ============================================================

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do anything with courses"
  ON courses
  FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Instructors can read their own courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'instructor'
    AND instructor_id = auth.uid()
  );

CREATE POLICY "Students can read active courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'student'
    AND status = 'active'
  );

CREATE POLICY "Students can read their enrolled courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'student'
    AND id IN (
      SELECT course_id FROM enrollments WHERE student_id = auth.uid()
    )
  );

-- ============================================================
-- SESSIONS (task 1.8)
-- Admin: full CRUD
-- Instructors: read sessions for their courses
-- Students: read sessions for courses they're enrolled in (enforced by join in app)
-- ============================================================

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do anything with sessions"
  ON sessions
  FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Instructors can read sessions for their courses"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'instructor'
    AND course_id IN (
      SELECT id FROM courses WHERE instructor_id = auth.uid()
    )
  );

CREATE POLICY "Students can read sessions for active courses"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'student'
    AND course_id IN (
      SELECT id FROM courses WHERE status = 'active'
    )
  );

CREATE POLICY "Students can read sessions for their enrolled courses"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'student'
    AND course_id IN (
      SELECT course_id FROM enrollments WHERE student_id = auth.uid()
    )
  );
