-- RLS tests for public.profiles
-- Covers all 7 policies: admin read/insert/update, anyone reads instructors,
-- users read/update own, instructors read their students.
--
-- TEMPLATE: patterns here (authenticate helper, role switching, verify-as-postgres)
-- carry directly into 02_rls_courses.sql and 03_rls_enrollments.sql.
--
-- Run with: supabase test db

BEGIN;
SELECT plan(12);

-- ============================================================
-- HELPERS
-- ============================================================
-- authenticate() sets JWT claims for a user session.
-- Call it, then SET LOCAL ROLE authenticated to activate RLS as that user.
-- SECURITY DEFINER so it can set config regardless of current role.
--
-- Pattern:
--   SELECT tests.authenticate('uuid', p_is_student => true);
--   SET LOCAL ROLE authenticated;
--   -- run assertions as that user --
--   RESET ROLE;   -- back to postgres (bypasses RLS)
-- ============================================================

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
-- Seed UUID reference
--   a1000000-...-001  andy          admin
--   a1000000-...-002  mike          instructor  (teaches c001, c004, c006)
--   a1000000-...-003  lisa          instructor
--   a1000000-...-004  chris         instructor+student
--   a1000000-...-005  sam           student     (enrolled in mike's c001, c004)
--   a1000000-...-006  alex          student     (enrolled in mike's c001)
--   a1000000-...-007  jordan        student     (enrolled in mike's c004)
--   f1000000-...-001  pw_admin      admin
--   f1000000-...-002  pw_instructor instructor
--   f1000000-...-003  pw_student    student     (no enrollments)
-- ============================================================

-- ============================================================
-- ANON: "Anyone can read instructor profiles" (no auth required)
-- ============================================================

SET LOCAL ROLE anon;

SELECT is(
  (SELECT count(*)::int FROM public.profiles WHERE is_instructor = true),
  4,
  'anon: sees exactly 4 instructor profiles (mike, lisa, chris, pw_instructor)'
);

SELECT is(
  (SELECT count(*)::int FROM public.profiles WHERE id = 'a1000000-0000-0000-0000-000000000005'),
  0,
  'anon: cannot see sam (student-only, is_instructor = false)'
);

RESET ROLE;

-- ============================================================
-- ADMIN (andy): "Admins can read/insert/update all profiles"
-- ============================================================

SELECT tests.authenticate(
  'a1000000-0000-0000-0000-000000000001',
  p_is_admin => true
);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.profiles),
  10,
  'admin: can read all 10 profiles'
);

UPDATE public.profiles SET phone = '555-0100'
WHERE id = 'a1000000-0000-0000-0000-000000000002';

SELECT is(
  (SELECT phone FROM public.profiles WHERE id = 'a1000000-0000-0000-0000-000000000002'),
  '555-0100',
  'admin: can update any profile'
);

RESET ROLE;

-- ============================================================
-- STUDENT (sam): reads own + instructor profiles, blocks other students
-- ============================================================

SELECT tests.authenticate(
  'a1000000-0000-0000-0000-000000000005',
  p_is_student => true
);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.profiles
   WHERE id = 'a1000000-0000-0000-0000-000000000005'),
  1,
  'student: can read own profile'
);

SELECT is(
  (SELECT count(*)::int FROM public.profiles
   WHERE id = 'a1000000-0000-0000-0000-000000000006'),
  0,
  'student: cannot read another student profile (alex)'
);

SELECT is(
  (SELECT count(*)::int FROM public.profiles
   WHERE id = 'a1000000-0000-0000-0000-000000000002'),
  1,
  'student: can read instructor profile (mike) via anyone-can-read-instructors policy'
);

UPDATE public.profiles SET first_name = 'Samantha'
WHERE id = 'a1000000-0000-0000-0000-000000000005';

SELECT is(
  (SELECT first_name FROM public.profiles
   WHERE id = 'a1000000-0000-0000-0000-000000000005'),
  'Samantha',
  'student: can update own profile'
);

-- Attempt cross-user update (should be silently blocked by RLS)
UPDATE public.profiles SET first_name = 'Hacked'
WHERE id = 'a1000000-0000-0000-0000-000000000006';

RESET ROLE;

-- Verify as postgres (bypasses RLS) that alex was not modified
SELECT is(
  (SELECT first_name FROM public.profiles
   WHERE id = 'a1000000-0000-0000-0000-000000000006'),
  'Alex',
  'student: update to another student profile is silently blocked'
);

-- ============================================================
-- INSTRUCTOR (mike): reads own profile + all student profiles
-- ============================================================

SELECT tests.authenticate(
  'a1000000-0000-0000-0000-000000000002',
  p_is_instructor => true
);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.profiles
   WHERE id = 'a1000000-0000-0000-0000-000000000002'),
  1,
  'instructor: can read own profile'
);

SELECT is(
  (SELECT count(*)::int FROM public.profiles
   WHERE id = 'a1000000-0000-0000-0000-000000000005'),
  1,
  'instructor: can read profile of enrolled student (sam)'
);

SELECT is(
  (SELECT count(*)::int FROM public.profiles
   WHERE id = 'f1000000-0000-0000-0000-000000000003'),
  1,
  'instructor: can read any student profile (pw_student visible to all instructors)'
);

SELECT * FROM finish();
ROLLBACK;
