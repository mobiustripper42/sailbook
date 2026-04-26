-- RLS tests for enrollments and session_attendance
-- Policies under test:
--   enrollments:        admin all | student reads/inserts/updates own | instructor reads all
--   session_attendance: admin all | student reads/inserts/updates own (expected status only) | instructor reads all
--
-- Run with: supabase test db

BEGIN;
SELECT plan(20);

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
--   Session attendance: 13 total rows
--     e001 (sam/c001):    d001,d002         → 2 rows
--     e002 (alex/c001):   d001,d002         → 2 rows
--     e003 (sam/c002):    d003-d006         → 4 rows
--     e004 (sam/c004):    d007,d008         → 2 rows
--     e005 (jordan/c004): d007,d008         → 2 rows
--     e006 (chris/c006):  d010              → 1 row (Open Sailing is per-course, single session)
--   Mike: all 6 enrollments, all 13 attendance records
--   Chris: all 6 enrollments, all 13 attendance records
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

-- Student (sam): can request cancellation on own confirmed enrollment (e001)
UPDATE public.enrollments SET status = 'cancel_requested'
WHERE id = 'e1000000-0000-0000-0000-000000000001';

SELECT is(
  (SELECT status FROM public.enrollments WHERE id = 'e1000000-0000-0000-0000-000000000001'),
  'cancel_requested',
  'student (sam): can set confirmed → cancel_requested'
);

-- Student (sam): cannot undo cancel_requested → confirmed.
-- USING restricts to status='confirmed' rows; the row is invisible for UPDATE (0 rows, no exception).
UPDATE public.enrollments SET status = 'confirmed'
WHERE id = 'e1000000-0000-0000-0000-000000000001';

SELECT is(
  (SELECT status FROM public.enrollments WHERE id = 'e1000000-0000-0000-0000-000000000001'),
  'cancel_requested',
  'student (sam): cannot undo cancel_requested (USING restricts to confirmed rows)'
);

-- Student (sam): cannot set confirmed → cancelled directly (must go through request flow)
SELECT throws_ok(
  $$ UPDATE public.enrollments SET status = 'cancelled'
     WHERE id = 'e1000000-0000-0000-0000-000000000003' $$,
  '42501',
  NULL,
  'student (sam): cannot set confirmed → cancelled directly'
);

-- Student (sam): cannot extend a payment hold while requesting cancellation.
-- WITH CHECK requires hold_expires_at IS NULL — mutating it alongside status must be rejected.
SELECT throws_ok(
  $$ UPDATE public.enrollments
     SET status = 'cancel_requested', hold_expires_at = now() + interval '1 hour'
     WHERE id = 'e1000000-0000-0000-0000-000000000003' $$,
  '42501',
  NULL,
  'student (sam): cannot extend hold while setting cancel_requested (WITH CHECK: hold_expires_at IS NULL)'
);

RESET ROLE;

-- Instructor (mike): sees all enrollments (6 seed + 1 inserted by student test above = 7)
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000002', p_is_instructor => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.enrollments),
  7,
  'instructor (mike): sees all 7 enrollments (6 seed + 1 inserted by student test)'
);

SELECT is(
  (SELECT count(*)::int FROM public.enrollments WHERE course_id = 'c1000000-0000-0000-0000-000000000002'),
  1,
  'instructor (mike): can see c002 enrollment (all enrollments visible to instructors)'
);

RESET ROLE;

-- Instructor (chris): sees all enrollments (7 total at this point)
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000004', p_is_instructor => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.enrollments),
  7,
  'instructor (chris): sees all 7 enrollments'
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

-- Admin: sees all 13 attendance records
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000001', p_is_admin => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.session_attendance),
  13,
  'admin: sees all 13 attendance records'
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

-- Instructor (mike): sees all 13 attendance records
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000002', p_is_instructor => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.session_attendance),
  13,
  'instructor (mike): sees all 13 attendance records'
);

RESET ROLE;

-- Instructor (chris): sees all 13 attendance records
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000004', p_is_instructor => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.session_attendance),
  13,
  'instructor (chris): sees all 13 attendance records'
);

RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
