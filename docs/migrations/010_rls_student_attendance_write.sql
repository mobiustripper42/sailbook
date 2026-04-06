-- Phase 5.17 — RLS: student INSERT/UPDATE on session_attendance
--
-- Bug: enrollInCourse runs as the student's session client (RLS applies).
-- Migration 008 gave students SELECT only. The upsert that creates attendance
-- records on enrollment was denied by RLS, returning an error to the student
-- while leaving the enrollment row intact — orphaned enrollment, no attendance.
--
-- Fix: add INSERT and UPDATE policies scoped to:
--   - student's own enrollments (via get_student_enrollment_ids helper from 008)
--   - status = 'expected' only (students cannot self-mark attended/missed/excused)

-- Clean up if re-running
DROP POLICY IF EXISTS "Students can insert own attendance" ON session_attendance;
DROP POLICY IF EXISTS "Students can update own attendance" ON session_attendance;

-- Students: insert attendance records for their own enrollments (enrollment flow)
-- WITH CHECK only (INSERT has no pre-existing row, USING is not applicable)
CREATE POLICY "Students can insert own attendance"
  ON session_attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'is_student') = 'true'
    AND enrollment_id IN (SELECT get_student_enrollment_ids(auth.uid()))
    AND status = 'expected'
  );

-- Students: update attendance records for their own enrollments (re-enrollment upsert)
-- USING: student owns the row they're updating
-- WITH CHECK: new value must still be 'expected' (cannot self-promote to attended/missed/excused)
CREATE POLICY "Students can update own attendance"
  ON session_attendance
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_student') = 'true'
    AND enrollment_id IN (SELECT get_student_enrollment_ids(auth.uid()))
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'is_student') = 'true'
    AND enrollment_id IN (SELECT get_student_enrollment_ids(auth.uid()))
    AND status = 'expected'
  );
