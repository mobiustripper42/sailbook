-- Phase 2.0 — Migrate role model to boolean flags
--
-- NOTE: After running this migration, existing admin/instructor accounts need their
-- user_metadata updated in Supabase Auth (Authentication → Users → edit user).
-- Change: { "role": "admin" } → { "is_admin": true, "is_instructor": false, "is_student": false }
-- Change: { "role": "instructor" } → { "is_admin": false, "is_instructor": true, "is_student": true }
-- (instructors are typically also students — adjust per person)
--
-- Replaces single `role` varchar column with is_admin, is_instructor, is_student booleans
-- Enables multi-role users (e.g. an instructor who is also a student)
-- Run in Supabase SQL Editor

-- ============================================================
-- STEP 1: Add boolean columns
-- ============================================================

ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN is_instructor BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN is_student BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================
-- STEP 2: Backfill from existing role column
-- ============================================================

UPDATE profiles SET is_admin = TRUE WHERE role = 'admin';
UPDATE profiles SET is_instructor = TRUE WHERE role = 'instructor';
UPDATE profiles SET is_student = TRUE WHERE role = 'student';

-- ============================================================
-- STEP 3: Drop old role column and its index
-- ============================================================

DROP INDEX IF EXISTS idx_profiles_role;
ALTER TABLE profiles DROP COLUMN role;

-- ============================================================
-- STEP 4: Add new indexes
-- ============================================================

CREATE INDEX idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = TRUE;
CREATE INDEX idx_profiles_is_instructor ON profiles(is_instructor) WHERE is_instructor = TRUE;
CREATE INDEX idx_profiles_is_student ON profiles(is_student) WHERE is_student = TRUE;

-- ============================================================
-- STEP 5: Update RLS policies that reference role string
-- ============================================================

-- Profiles table
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

-- Recreate with boolean flags
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin') = 'true');

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin') = 'true');

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin') = 'true');

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Course types
DROP POLICY IF EXISTS "Admins can do anything with course_types" ON course_types;

CREATE POLICY "Admins can do anything with course_types"
  ON course_types FOR ALL TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin') = 'true')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin') = 'true');

-- Courses
DROP POLICY IF EXISTS "Admins can do anything with courses" ON courses;
DROP POLICY IF EXISTS "Instructors can read their own courses" ON courses;
DROP POLICY IF EXISTS "Students can read active courses" ON courses;

CREATE POLICY "Admins can do anything with courses"
  ON courses FOR ALL TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin') = 'true')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin') = 'true');

CREATE POLICY "Instructors can read their own courses"
  ON courses FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_instructor') = 'true'
    AND instructor_id = auth.uid()
  );

CREATE POLICY "Students can read active courses"
  ON courses FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_student') = 'true'
    AND status = 'active'
  );

-- Sessions
DROP POLICY IF EXISTS "Admins can do anything with sessions" ON sessions;
DROP POLICY IF EXISTS "Instructors can read sessions for their courses" ON sessions;
DROP POLICY IF EXISTS "Students can read sessions for active courses" ON sessions;

CREATE POLICY "Admins can do anything with sessions"
  ON sessions FOR ALL TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin') = 'true')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin') = 'true');

CREATE POLICY "Instructors can read sessions for their courses"
  ON sessions FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_instructor') = 'true'
    AND course_id IN (SELECT id FROM courses WHERE instructor_id = auth.uid())
  );

CREATE POLICY "Students can read sessions for active courses"
  ON sessions FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_student') = 'true'
    AND course_id IN (SELECT id FROM courses WHERE status = 'active')
  );
