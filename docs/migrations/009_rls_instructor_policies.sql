-- Phase 4.4 — Fix instructor RLS to handle session-level assignment (DEC-007)
--
-- Current gaps:
--   1. courses policy only checks course-level instructor_id — misses session-level overrides
--   2. sessions policy uses direct subquery on courses (recursion risk) and misses session-level
--   3. enrollments helper (get_instructor_course_ids) is course-level only
--   4. profiles has no instructor policy — roster page can't read student names
--
-- Fixes:
--   - Update get_instructor_course_ids() to include courses with session-level assignments
--   - Add get_instructor_student_ids() helper for profiles access
--   - Replace courses policy to use updated helper
--   - Replace sessions policy to use get_instructor_session_ids()
--   - Add profiles SELECT policy for instructors
--   - Enrollments policy automatically benefits from updated helper (no change needed)
--   - Drop rogue profiles policies left over from initial setup

-- ============================================================
-- STEP 0: Drop rogue policies on profiles
-- ============================================================
-- "Authenticated users can read profiles" (qual: true) — allows ANY authenticated user
-- to read ALL profiles, completely bypassing role-based isolation.
-- "Admins can update any profile" — uses old role='admin' string, superseded by
-- boolean-flag version from migration 003.

DROP POLICY IF EXISTS "Authenticated users can read profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- ============================================================
-- STEP 1: Update get_instructor_course_ids to cover session-level assignment
-- ============================================================
-- Before: only returned courses where instructor_id = user_id
-- After: also returns courses where user is assigned to any session

CREATE OR REPLACE FUNCTION get_instructor_course_ids(user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM courses WHERE instructor_id = user_id
  UNION
  SELECT DISTINCT course_id FROM sessions WHERE instructor_id = user_id;
$$;

-- ============================================================
-- STEP 2: Add helper for instructor → student profile access
-- ============================================================
-- Returns student IDs enrolled in any course the instructor is responsible for
-- (either course-level or session-level assignment)

CREATE OR REPLACE FUNCTION get_instructor_student_ids(user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT DISTINCT e.student_id
  FROM enrollments e
  JOIN courses c ON e.course_id = c.id
  WHERE c.instructor_id = user_id
  UNION
  SELECT DISTINCT e.student_id
  FROM enrollments e
  JOIN sessions s ON e.course_id = s.course_id
  WHERE s.instructor_id = user_id;
$$;

-- ============================================================
-- STEP 3: Fix courses policy — use helper for both assignment levels
-- ============================================================

DROP POLICY IF EXISTS "Instructors can read their own courses" ON courses;

CREATE POLICY "Instructors can read their own courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_instructor') = 'true'
    AND id IN (SELECT get_instructor_course_ids(auth.uid()))
  );

-- ============================================================
-- STEP 4: Fix sessions policy — use helper for both assignment levels
-- ============================================================

DROP POLICY IF EXISTS "Instructors can read sessions for their courses" ON sessions;

CREATE POLICY "Instructors can read sessions for their courses"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_instructor') = 'true'
    AND id IN (SELECT get_instructor_session_ids(auth.uid()))
  );

-- ============================================================
-- STEP 5: Add profiles policy — instructors can read their students
-- ============================================================

CREATE POLICY "Instructors can read student profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_instructor') = 'true'
    AND id IN (SELECT get_instructor_student_ids(auth.uid()))
  );

-- ============================================================
-- NOTES
-- ============================================================
-- Enrollments policy ("Instructors can read enrollments for their courses")
-- already calls get_instructor_course_ids(auth.uid()), so it automatically
-- picks up session-level assignments from the updated function.
--
-- Session attendance policy ("Instructors can read attendance for their sessions")
-- already uses get_instructor_session_ids() — no change needed.
