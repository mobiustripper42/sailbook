-- RLS tests for course_types, courses, sessions
-- Policies under test:
--   course_types: admin all | authenticated reads active only | anon reads active only
--   courses:      admin all | student reads active+enrolled | instructor reads all | anon reads active
--   sessions:     admin all | student reads active-course+enrolled | instructor reads all | anon reads active-course
--
-- Run with: supabase test db

BEGIN;
SELECT plan(18);

-- Reuse authenticate() helper from 01_rls_profiles.sql.
-- If running this file standalone, recreate it here.
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
--   Courses: c001 (ASA101 Weekend May, active, Mike)
--            c002 (ASA101 Evening May, active, Chris)
--            c003 (ASA103 June, active, no instructor)
--            c004 (ASA101 April, completed, Mike)
--            c005 (Dinghy, draft, Lisa)
--            c006-c010 (Open Sailing Jul 1/8/15/22/29, all active, all Mike)
--   Sessions: d001-d002 (c001), d003-d006 (c002), d007-d008 (c004),
--             d009 (c005 draft), d010 (c006), d011 (c007),
--             d012 (c008), d013 (c009), d014 (c010) = 14 total
--   Sam enrolled: c001 (confirmed), c002 (confirmed), c004 (completed)
--   Mike assigned: c001, c004, c006-c010 (7 courses)
--   Lisa assigned: c005
-- ============================================================

-- ============================================================
-- COURSE TYPES
-- ============================================================

-- Anon: can read active course_types (4 of 5; Advanced Racing is inactive)
SET LOCAL ROLE anon;

SELECT is(
  (SELECT count(*)::int FROM public.course_types),
  4,
  'anon: sees 4 active course_types'
);

SELECT is(
  (SELECT count(*)::int FROM public.course_types WHERE id = 'b1000000-0000-0000-0000-000000000005'),
  0,
  'anon: cannot see inactive course_type (Advanced Racing)'
);

-- Anon: can read active courses (c001,c002,c003,c006-c010 = 8)
SELECT is(
  (SELECT count(*)::int FROM public.courses),
  8,
  'anon: sees 8 active courses'
);

-- Anon: can read sessions for active courses (d001-d006 + d010-d014 = 11; not d007/d008 completed, not d009 draft)
SELECT is(
  (SELECT count(*)::int FROM public.sessions),
  11,
  'anon: sees 11 sessions belonging to active courses'
);

RESET ROLE;

-- Authenticated student: sees only active course_types (4 of 5)
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000005', p_is_student => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.course_types),
  4,
  'authenticated: sees 4 active course_types (Advanced Racing is inactive)'
);

RESET ROLE;

-- Admin: sees all 5 course_types including inactive
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000001', p_is_admin => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.course_types),
  5,
  'admin: sees all 5 course_types including inactive'
);

RESET ROLE;

-- ============================================================
-- COURSES
-- ============================================================

-- Admin: sees all 10 courses (any status)
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000001', p_is_admin => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.courses),
  10,
  'admin: sees all 10 courses regardless of status'
);

UPDATE public.courses SET notes = 'admin edit test'
WHERE id = 'c1000000-0000-0000-0000-000000000001';

SELECT is(
  (SELECT notes FROM public.courses WHERE id = 'c1000000-0000-0000-0000-000000000001'),
  'admin edit test',
  'admin: can update any course'
);

RESET ROLE;

-- Student (sam): sees active courses (c001,c002,c003,c006-c010 = 8) + enrolled completed (c004) = 9
-- Does NOT see draft c005 (not active, not enrolled)
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000005', p_is_student => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.courses),
  9,
  'student: sees 9 courses (8 active + enrolled completed c004, not draft c005)'
);

SELECT is(
  (SELECT count(*)::int FROM public.courses WHERE id = 'c1000000-0000-0000-0000-000000000005'),
  0,
  'student: cannot see draft course (c005 Dinghy)'
);

RESET ROLE;

-- Instructor (mike): sees all 10 courses
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000002', p_is_instructor => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.courses),
  10,
  'instructor (mike): sees all 10 courses'
);

SELECT is(
  (SELECT count(*)::int FROM public.courses WHERE id = 'c1000000-0000-0000-0000-000000000003'),
  1,
  'instructor (mike): can see c003 (all courses visible to instructors)'
);

RESET ROLE;

-- ============================================================
-- SESSIONS
-- ============================================================

-- Admin: sees all 14 sessions
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000001', p_is_admin => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.sessions),
  14,
  'admin: sees all 14 sessions'
);

RESET ROLE;

-- Student (sam): sees sessions for active courses (c001,c002,c003,c006 = 11 sessions)
-- + enrolled courses (c001,c002,c004 adds d007,d008) = 13 total
-- Does NOT see d009 (draft c005)
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000005', p_is_student => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.sessions),
  13,
  'student: sees 13 sessions (active-course + enrolled, not draft c005 session d009)'
);

SELECT is(
  (SELECT count(*)::int FROM public.sessions WHERE id = 'd1000000-0000-0000-0000-000000000009'),
  0,
  'student: cannot see draft course session (d009)'
);

RESET ROLE;

-- Instructor (mike): sees all 14 sessions
Select tests.authenticate('a1000000-0000-0000-0000-000000000002', p_is_instructor => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.sessions),
  14,
  'instructor (mike): sees all 14 sessions'
);

RESET ROLE;

-- ============================================================
-- IS_DROP_IN FLAG
-- ============================================================

-- Open Sailing course type has is_drop_in = true; ASA101 has is_drop_in = false
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000001', p_is_admin => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT is_drop_in FROM public.course_types WHERE id = 'b1000000-0000-0000-0000-000000000004'),
  true,
  'admin: Open Sailing course_type has is_drop_in = true'
);

SELECT is(
  (SELECT is_drop_in FROM public.course_types WHERE id = 'b1000000-0000-0000-0000-000000000001'),
  false,
  'admin: ASA101 course_type has is_drop_in = false'
);

RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
