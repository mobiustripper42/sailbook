-- RLS gap tests — write-block and status-escalation coverage
-- Addresses audit findings from 0.10:
--   - Non-admins cannot INSERT courses, sessions, course_types
--   - Instructors cannot INSERT enrollments
--   - Students cannot escalate enrollment status (completed/confirmed)
--   - Students CAN request cancellation (confirmed → cancel_requested); cannot directly cancel (DEC-022)
--   - Students cannot escalate session_attendance status to present or absent
--   - get_enrolled_course_ids excludes cancelled enrollments (c004 sessions invisible
--     after cancelling a non-completed enrollment that was the only route to c004)
--   - Students cannot cancel a completed enrollment
--
-- Run with: supabase test db

BEGIN;
SELECT plan(12);

CREATE SCHEMA IF NOT EXISTS tests;

CREATE OR REPLACE FUNCTION tests.authenticate(
  p_uid            uuid,
  p_is_admin       boolean DEFAULT false,
  p_is_instructor  boolean DEFAULT false,
  p_is_student     boolean DEFAULT false
) RETURNS void SECURITY DEFINER LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub',           p_uid::text,
    'role',          'authenticated',
    'user_metadata', json_build_object(
      'is_admin',      p_is_admin,
      'is_instructor', p_is_instructor,
      'is_student',    p_is_student
    )
  )::text, true);
END;
$$;

-- ============================================================
-- Seed reference
--   sam (a1000000-...-005): student
--     e001 → c001 (active, confirmed)
--     e003 → c002 (active, confirmed)
--     e004 → c004 (completed, completed)   ← not active, visible only via enrolled policy
--   alex (a1000000-...-006): student
--     e002 → c001 (registered)
--   mike (a1000000-...-002): instructor (c001, c004, c006)
-- ============================================================

-- ============================================================
-- Write-block: students cannot INSERT courses, sessions, course_types
-- ============================================================

SELECT tests.authenticate('a1000000-0000-0000-0000-000000000005', p_is_student => true);
SET LOCAL ROLE authenticated;

SELECT throws_ok(
  $$ INSERT INTO public.courses (id, course_type_id, status, capacity)
     VALUES ('c1000000-0000-0000-0000-000000000099',
             'b1000000-0000-0000-0000-000000000001',
             'active', 6) $$,
  '42501',
  NULL,
  'student: cannot INSERT a course'
);

SELECT throws_ok(
  $$ INSERT INTO public.sessions (id, course_id, date, start_time, end_time)
     VALUES ('d1000000-0000-0000-0000-000000000099',
             'c1000000-0000-0000-0000-000000000001',
             CURRENT_DATE, '09:00', '12:00') $$,
  '42501',
  NULL,
  'student: cannot INSERT a session'
);

SELECT throws_ok(
  $$ INSERT INTO public.course_types (id, name, description, is_active)
     VALUES ('b1000000-0000-0000-0000-000000000099', 'Hack Type', '', true) $$,
  '42501',
  NULL,
  'student: cannot INSERT a course_type'
);

RESET ROLE;

-- ============================================================
-- Write-block: instructors cannot INSERT enrollments
-- ============================================================

SELECT tests.authenticate('a1000000-0000-0000-0000-000000000002', p_is_instructor => true);
SET LOCAL ROLE authenticated;

SELECT throws_ok(
  $$ INSERT INTO public.enrollments (id, course_id, student_id, status)
     VALUES ('e1000000-0000-0000-0000-000000000097',
             'c1000000-0000-0000-0000-000000000001',
             'a1000000-0000-0000-0000-000000000006',
             'registered') $$,
  '42501',
  NULL,
  'instructor: cannot INSERT an enrollment'
);

RESET ROLE;

-- ============================================================
-- Enrollment status escalation: student cannot set status=completed/confirmed
-- ============================================================

SELECT tests.authenticate('a1000000-0000-0000-0000-000000000005', p_is_student => true);
SET LOCAL ROLE authenticated;

SELECT throws_ok(
  $$ UPDATE public.enrollments
     SET status = 'completed'
     WHERE id = 'e1000000-0000-0000-0000-000000000001' $$,
  '42501',
  NULL,
  'student: cannot escalate own enrollment status to completed'
);

SELECT throws_ok(
  $$ UPDATE public.enrollments
     SET status = 'confirmed'
     WHERE id = 'e1000000-0000-0000-0000-000000000001' $$,
  '42501',
  NULL,
  'student: cannot escalate own enrollment status to confirmed'
);

-- Student CAN request cancellation (cancel_requested) — direct cancel is no longer allowed
UPDATE public.enrollments SET status = 'cancel_requested'
WHERE id = 'e1000000-0000-0000-0000-000000000001';

SELECT is(
  (SELECT status FROM public.enrollments WHERE id = 'e1000000-0000-0000-0000-000000000001'),
  'cancel_requested',
  'student: can request cancellation (confirmed → cancel_requested)'
);

-- Student cannot directly cancel — must go through admin-approved flow
SELECT throws_ok(
  $$ UPDATE public.enrollments SET status = 'cancelled'
     WHERE id = 'e1000000-0000-0000-0000-000000000003' $$,
  '42501',
  NULL,
  'student: cannot set confirmed → cancelled directly (DEC-022)'
);

RESET ROLE;

-- ============================================================
-- Session attendance: student cannot escalate status to present/absent
-- ============================================================

SELECT tests.authenticate('a1000000-0000-0000-0000-000000000005', p_is_student => true);
SET LOCAL ROLE authenticated;

SELECT throws_ok(
  $$ UPDATE public.session_attendance
     SET status = 'present'
     WHERE enrollment_id = 'e1000000-0000-0000-0000-000000000003'
       AND session_id   = 'd1000000-0000-0000-0000-000000000003' $$,
  '42501',
  NULL,
  'student: cannot set own attendance status to present'
);

SELECT throws_ok(
  $$ UPDATE public.session_attendance
     SET status = 'absent'
     WHERE enrollment_id = 'e1000000-0000-0000-0000-000000000003'
       AND session_id   = 'd1000000-0000-0000-0000-000000000003' $$,
  '42501',
  NULL,
  'student: cannot set own attendance status to absent'
);

RESET ROLE;

-- ============================================================
-- get_enrolled_course_ids excludes cancelled enrollments
--
-- c004 is a completed course (not active). Sam's e004 is the only reason
-- she can see c004 sessions (d007, d008). We reset e004 to 'confirmed'
-- (via postgres, bypassing RLS) so sam can cancel it, then verify those
-- sessions disappear — the active-courses policy does not cover completed courses.
-- ============================================================

-- Set up: cancel e004 as postgres (admin-equivalent) — students can no longer directly cancel (DEC-022)
UPDATE public.enrollments SET status = 'cancelled'
WHERE id = 'e1000000-0000-0000-0000-000000000004';

SELECT tests.authenticate('a1000000-0000-0000-0000-000000000005', p_is_student => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.sessions
   WHERE course_id = 'c1000000-0000-0000-0000-000000000004'),
  0,
  'student: cancelled enrollment removes session visibility for non-active course (c004 sessions gone)'
);

RESET ROLE;

-- ============================================================
-- Students cannot cancel a completed enrollment (USING guard)
-- ============================================================

-- Set up: ensure e005 (jordan/c004) is completed so USING blocks the update
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000007', p_is_student => true);
SET LOCAL ROLE authenticated;

-- e005 has status='completed' — USING clause blocks this (silently, 0 rows updated)
UPDATE public.enrollments SET status = 'cancelled'
WHERE id = 'e1000000-0000-0000-0000-000000000005';

RESET ROLE;

SELECT is(
  (SELECT status FROM public.enrollments WHERE id = 'e1000000-0000-0000-0000-000000000005'),
  'completed',
  'student: cannot cancel a completed enrollment (USING blocks update, row unchanged)'
);

SELECT * FROM finish();
ROLLBACK;
