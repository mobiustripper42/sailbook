-- RLS tests for enrollments and session_attendance
-- Policies under test:
--   enrollments:        admin all | student reads/inserts/updates own | instructor reads assigned courses
--   session_attendance: admin all | student reads/inserts/updates own (expected status only) | instructor reads assigned sessions
--
-- Run with: supabase test db

BEGIN;
SELECT plan(16);

-- Reuse authenticate() helper (same pattern as 01/02)
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
--   Enrollments: e001 (sam  → c001, confirmed)
--                e002 (alex → c001, registered)
--                e003 (sam  → c002, confirmed)
--                e004 (sam  → c004, completed)
--                e005 (jordan → c004, completed)
--                e006 (chris → c006, registered)
--   Session attendance: 17 total rows
--     e001 (sam/c001):    d001,d002         → 2 rows
--     e002 (alex/c001):   d001,d002         → 2 rows
--     e003 (sam/c002):    d003-d006         → 4 rows
--     e004 (sam/c004):    d007,d008         → 2 rows
--     e005 (jordan/c004): d007,d008         → 2 rows
--     e006 (chris/c006):  d010-d014         → 5 rows
--   Mike assigned: c001+c004+c006 → sees e001,e002,e004,e005,e006 (5 enroll, 13 attendance)
--   Chris assigned: c002 → sees e003 (1 enroll, 4 attendance)
-- ============================================================

-- ============================================================
-- ENROLLMENTS
-- ============================================================

-- Anon: no policy grants SELECT to anon → 0 rows
SET LOCAL ROLE anon;

SELECT is(
  (SELECT count(*)::int FROM public.enrollments),
  0,
  'anon: cannot read enrollments'
);

RESET ROLE;

-- Admin: sees all 6 enrollments and can update
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000001', p_is_admin => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.enrollments),
  6,
  'admin: sees all 6 enrollments'
);

UPDATE public.enrollments SET status = 'confirmed'
WHERE id = 'e1000000-0000-0000-0000-000000000002';

SELECT is(
  (SELECT status FROM public.enrollments WHERE id = 'e1000000-0000-0000-0000-000000000002'),
  'confirmed',
  'admin: can update any enrollment'
);

RESET ROLE;

-- Student (sam): sees own 3 enrollments, cannot see alex's
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000005', p_is_student => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.enrollments),
  3,
  'student (sam): sees own 3 enrollments (e001, e003, e004)'
);

SELECT is(
  (SELECT count(*)::int FROM public.enrollments WHERE id = 'e1000000-0000-0000-0000-000000000002'),
  0,
  'student (sam): cannot see alex''s enrollment (e002)'
);

-- Student (sam): can insert own enrollment (c003 — not yet enrolled)
INSERT INTO public.enrollments (id, course_id, student_id, status) VALUES
  ('e1000000-0000-0000-0000-000000000099',
   'c1000000-0000-0000-0000-000000000003',
   'a1000000-0000-0000-0000-000000000005',
   'registered');

SELECT is(
  (SELECT count(*)::int FROM public.enrollments WHERE id = 'e1000000-0000-0000-0000-000000000099'),
  1,
  'student (sam): can insert own enrollment'
);

-- Student (sam): cannot insert enrollment with a different student_id (jordan)
SELECT throws_ok(
  $$ INSERT INTO public.enrollments (id, course_id, student_id, status) VALUES
       ('e1000000-0000-0000-0000-000000000098',
        'c1000000-0000-0000-0000-000000000003',
        'a1000000-0000-0000-0000-000000000007',
        'registered') $$,
  '42501',
  NULL,
  'student: cannot insert enrollment for another student'
);

RESET ROLE;

-- Instructor (mike): sees enrollments for assigned courses c001+c004+c006 = e001+e002+e004+e005+e006 = 5
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000002', p_is_instructor => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.enrollments),
  5,
  'instructor (mike): sees 5 enrollments across assigned courses (c001, c004, c006)'
);

SELECT is(
  (SELECT count(*)::int FROM public.enrollments WHERE course_id = 'c1000000-0000-0000-0000-000000000002'),
  0,
  'instructor (mike): cannot see c002 enrollments (assigned to chris)'
);

RESET ROLE;

-- Instructor (chris): sees enrollments for assigned course c002 = e003 = 1
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000004', p_is_instructor => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.enrollments),
  1,
  'instructor (chris): sees 1 enrollment for assigned course (c002)'
);

RESET ROLE;

-- ============================================================
-- SESSION ATTENDANCE
-- ============================================================

-- Anon: no policy grants SELECT to anon → 0 rows
SET LOCAL ROLE anon;

SELECT is(
  (SELECT count(*)::int FROM public.session_attendance),
  0,
  'anon: cannot read session_attendance'
);

RESET ROLE;

-- Admin: sees all 17 attendance records
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000001', p_is_admin => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.session_attendance),
  17,
  'admin: sees all 17 attendance records'
);

RESET ROLE;

-- Student (sam): sees own 8 attendance records (e001:2 + e003:4 + e004:2)
-- Cannot see alex's attendance
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000005', p_is_student => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.session_attendance),
  8,
  'student (sam): sees own 8 attendance records (e001:2 + e003:4 + e004:2)'
);

SELECT is(
  (SELECT count(*)::int FROM public.session_attendance
   WHERE enrollment_id = 'e1000000-0000-0000-0000-000000000002'),
  0,
  'student (sam): cannot see alex''s attendance records (e002)'
);

RESET ROLE;

-- Instructor (mike): sees attendance for assigned sessions (c001+c004+c006 = 4+4+5 = 13)
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000002', p_is_instructor => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.session_attendance),
  13,
  'instructor (mike): sees 13 attendance records for assigned sessions (c001:4, c004:4, c006:5)'
);

RESET ROLE;

-- Instructor (chris): sees attendance for assigned sessions (c002 = 4)
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000004', p_is_instructor => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.session_attendance),
  4,
  'instructor (chris): sees 4 attendance records for assigned sessions (c002:4)'
);

RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
