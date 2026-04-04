-- SailBook SQL Helpers
-- Run these in the Supabase SQL Editor as needed.
-- Replace placeholder emails/IDs with real values.

-- ============================================================
-- MAKE A USER AN ADMIN
-- Both statements required: profiles drives DB queries,
-- auth.users drives JWT (middleware + RLS policies).
-- ============================================================

UPDATE profiles
SET is_admin = TRUE, is_instructor = FALSE, is_student = FALSE
WHERE email = 'you@example.com';

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data
  || '{"is_admin": true, "is_instructor": false, "is_student": false}'
WHERE email = 'you@example.com';

-- ============================================================
-- MAKE A USER AN INSTRUCTOR
-- Instructors are typically also students (can enroll in courses).
-- ============================================================

UPDATE profiles
SET is_instructor = TRUE, is_student = TRUE
WHERE email = 'instructor@example.com';

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data
  || '{"is_instructor": true, "is_student": true}'
WHERE email = 'instructor@example.com';

-- ============================================================
-- ADD A ROLE TO A USER
-- Adds a role without touching other flags.
-- User must log out and back in for JWT to pick up the change.
-- ============================================================

-- Add instructor role
UPDATE profiles SET is_instructor = TRUE WHERE email = 'user@example.com';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"is_instructor": true}' WHERE email = 'user@example.com';

-- Add admin role
UPDATE profiles SET is_admin = TRUE WHERE email = 'user@example.com';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}' WHERE email = 'user@example.com';

-- Add student role
UPDATE profiles SET is_student = TRUE WHERE email = 'user@example.com';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"is_student": true}' WHERE email = 'user@example.com';

-- ============================================================
-- REMOVE A ROLE FROM A USER
-- Removes a role without touching other flags.
-- User must log out and back in for JWT to pick up the change.
-- ============================================================

-- Remove instructor role
UPDATE profiles SET is_instructor = FALSE WHERE email = 'user@example.com';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"is_instructor": false}' WHERE email = 'user@example.com';

-- Remove admin role
UPDATE profiles SET is_admin = FALSE WHERE email = 'user@example.com';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": false}' WHERE email = 'user@example.com';

-- Remove student role
UPDATE profiles SET is_student = FALSE WHERE email = 'user@example.com';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"is_student": false}' WHERE email = 'user@example.com';

-- ============================================================
-- DEACTIVATE A USER
-- Soft delete — keeps history intact.
-- ============================================================

UPDATE profiles SET is_active = FALSE WHERE email = 'user@example.com';

-- ============================================================
-- WIPE DEV DATA — PARTIAL (keep users/profiles)
-- course_types has no cascade, so courses must go first.
-- ============================================================

DELETE FROM session_attendance;
DELETE FROM enrollments;
DELETE FROM sessions;
DELETE FROM courses;
DELETE FROM course_types;

-- ============================================================
-- WIPE DEV DATA — FULL RESET (everything including users)
-- courses.course_type_id and courses.instructor_id have no
-- ON DELETE CASCADE by design — delete courses first manually.
-- auth.users cascades to profiles.
-- ============================================================

DELETE FROM courses;      -- cascades → sessions, enrollments → session_attendance
DELETE FROM course_types;
DELETE FROM auth.users;   -- cascades → profiles
