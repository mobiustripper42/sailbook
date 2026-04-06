-- Phase 3.9 — RLS policies for session_attendance table
--
-- Access patterns:
--   Admin: full CRUD (manage all attendance records)
--   Students: read own attendance (via enrollment ownership)
--   Instructors: read attendance for sessions in their courses (or directly assigned sessions)
--
-- Uses SECURITY DEFINER helpers to avoid RLS recursion with enrollments and sessions/courses.

ALTER TABLE session_attendance ENABLE ROW LEVEL SECURITY;

-- Clean up any existing policies/functions from partial runs
DROP POLICY IF EXISTS "Admins can do anything with session_attendance" ON session_attendance;
DROP POLICY IF EXISTS "Students can read own attendance" ON session_attendance;
DROP POLICY IF EXISTS "Instructors can read attendance for their sessions" ON session_attendance;

-- Helper: get enrollment IDs for a student (bypasses enrollments RLS)
CREATE OR REPLACE FUNCTION get_student_enrollment_ids(user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM enrollments WHERE student_id = user_id;
$$;

-- Helper: get session IDs for an instructor (bypasses sessions + courses RLS)
-- Covers both course-level and session-level instructor assignment (DEC-007)
CREATE OR REPLACE FUNCTION get_instructor_session_ids(user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT s.id FROM sessions s
  LEFT JOIN courses c ON s.course_id = c.id
  WHERE c.instructor_id = user_id OR s.instructor_id = user_id;
$$;

-- Admin: full access
CREATE POLICY "Admins can do anything with session_attendance"
  ON session_attendance
  FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin') = 'true')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin') = 'true');

-- Students: read own attendance records
CREATE POLICY "Students can read own attendance"
  ON session_attendance
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_student') = 'true'
    AND enrollment_id IN (SELECT get_student_enrollment_ids(auth.uid()))
  );

-- Instructors: read attendance for sessions they're responsible for
CREATE POLICY "Instructors can read attendance for their sessions"
  ON session_attendance
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_instructor') = 'true'
    AND session_id IN (SELECT get_instructor_session_ids(auth.uid()))
  );
