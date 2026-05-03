-- Tests for Task 5.4: course_type_prerequisites table + RLS
--
-- Verifies:
--   - Admin can INSERT / DELETE
--   - Student / instructor can SELECT (read-only — needed for warning banner)
--   - Student / instructor cannot INSERT or DELETE
--   - UNIQUE (course_type_id, required_course_type_id) blocks duplicates
--   - CHECK (course_type_id <> required_course_type_id) blocks self-prereq

BEGIN;
SELECT plan(8);

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
--   Andy = a1...0001 (admin)
--   Mike = a1...0002 (instructor)
--   Sam  = a1...0005 (student)
--   ASA 101 = b1...0001
--   ASA 103 = b1...0002 (already has ASA 101 prereq from seed.sql)
--   DINGHY  = b1...0003
-- ============================================================

-- ============================================================
-- Admin can INSERT
-- ============================================================

SELECT tests.authenticate('a1000000-0000-0000-0000-000000000001', p_is_admin => true);
SET LOCAL ROLE authenticated;

SELECT lives_ok(
  $$ INSERT INTO public.course_type_prerequisites (course_type_id, required_course_type_id)
     VALUES ('b1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001') $$,
  'prereqs: admin can insert (DINGHY requires ASA 101)'
);

-- Duplicate blocked by UNIQUE
SELECT throws_ok(
  $$ INSERT INTO public.course_type_prerequisites (course_type_id, required_course_type_id)
     VALUES ('b1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001') $$,
  '23505',
  NULL,
  'prereqs: duplicate (course_type_id, required_course_type_id) blocked by UNIQUE'
);

-- Self-prereq blocked by CHECK
SELECT throws_ok(
  $$ INSERT INTO public.course_type_prerequisites (course_type_id, required_course_type_id)
     VALUES ('b1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001') $$,
  '23514',
  NULL,
  'prereqs: self-prereq blocked by CHECK constraint'
);

RESET ROLE;

-- ============================================================
-- Student SELECT: can read all rows (read-only authenticated policy)
-- ============================================================

SELECT tests.authenticate('a1000000-0000-0000-0000-000000000005', p_is_student => true);
SET LOCAL ROLE authenticated;

SELECT cmp_ok(
  (SELECT count(*)::int FROM public.course_type_prerequisites),
  '>=', 2,
  'prereqs: student sees all prereq rows under RLS'
);

-- ============================================================
-- Student cannot INSERT or DELETE
-- ============================================================

SELECT throws_ok(
  $$ INSERT INTO public.course_type_prerequisites (course_type_id, required_course_type_id)
     VALUES ('b1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001') $$,
  '42501',
  NULL,
  'prereqs: student cannot INSERT'
);

-- DELETE under RLS silently filters (no error, 0 rows affected). Verify the
-- row survives the attempt.
DELETE FROM public.course_type_prerequisites
  WHERE course_type_id = 'b1000000-0000-0000-0000-000000000002';

SELECT cmp_ok(
  (SELECT count(*)::int FROM public.course_type_prerequisites
   WHERE course_type_id = 'b1000000-0000-0000-0000-000000000002'),
  '>=', 1,
  'prereqs: student DELETE attempt does not affect rows (RLS-filtered)'
);

RESET ROLE;

-- ============================================================
-- Instructor cannot INSERT
-- ============================================================

SELECT tests.authenticate('a1000000-0000-0000-0000-000000000002', p_is_instructor => true);
SET LOCAL ROLE authenticated;

SELECT throws_ok(
  $$ INSERT INTO public.course_type_prerequisites (course_type_id, required_course_type_id)
     VALUES ('b1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001') $$,
  '42501',
  NULL,
  'prereqs: instructor cannot INSERT'
);

-- Instructor SELECT works (same authenticated policy)
SELECT cmp_ok(
  (SELECT count(*)::int FROM public.course_type_prerequisites),
  '>=', 2,
  'prereqs: instructor can SELECT under RLS'
);

RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
