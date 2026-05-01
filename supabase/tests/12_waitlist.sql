-- Tests for Phase 5.7: waitlist_entries table + get_waitlist_position RPC
--
-- Verifies:
--   - UNIQUE (course_id, student_id) blocks duplicate joins
--   - RLS: student INSERT/SELECT/DELETE own; can't read or touch siblings
--   - RLS: instructor blocked; admin allowed
--   - get_waitlist_position: returns FIFO position; NULL if not on list

BEGIN;
SELECT plan(14);

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
--   Andy   = a1...0001 (admin)
--   Mike   = a1...0002 (instructor)
--   Sam    = a1...0005 (student)
--   Alex   = a1...0006 (student)
--   Jordan = a1...0007 (student)
--   Course = c1...0001 (active, capacity 4)
-- ============================================================

-- ============================================================
-- Student INSERT own row succeeds
-- ============================================================

SELECT tests.authenticate('a1000000-0000-0000-0000-000000000005', p_is_student => true);
SET LOCAL ROLE authenticated;

SELECT lives_ok(
  $$ INSERT INTO public.waitlist_entries (course_id, student_id)
     VALUES ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000005') $$,
  'waitlist: student can insert own row'
);

-- Duplicate insert blocked by UNIQUE
SELECT throws_ok(
  $$ INSERT INTO public.waitlist_entries (course_id, student_id)
     VALUES ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000005') $$,
  '23505',
  NULL,
  'waitlist: duplicate (course, student) blocked by UNIQUE'
);

-- Student cannot insert a row for another student
SELECT throws_ok(
  $$ INSERT INTO public.waitlist_entries (course_id, student_id)
     VALUES ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000006') $$,
  '42501',
  NULL,
  'waitlist: student cannot insert a row for another student'
);

RESET ROLE;

-- ============================================================
-- Student SELECT: only sees own rows
-- ============================================================

-- Seed Alex (0006) onto the same course as postgres (bypasses RLS)
INSERT INTO public.waitlist_entries (course_id, student_id, created_at)
  VALUES ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000006', now() + interval '1 second');

SELECT tests.authenticate('a1000000-0000-0000-0000-000000000005', p_is_student => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.waitlist_entries),
  1,
  'waitlist: student sees only own row under RLS (1 of 2)'
);

SELECT is(
  (SELECT student_id FROM public.waitlist_entries),
  'a1000000-0000-0000-0000-000000000005'::uuid,
  'waitlist: student sees their own row, not Alex''s'
);

RESET ROLE;

-- ============================================================
-- Student DELETE: own row only
-- ============================================================

SELECT tests.authenticate('a1000000-0000-0000-0000-000000000005', p_is_student => true);
SET LOCAL ROLE authenticated;

-- DELETE silently affects zero rows when RLS hides them — assert via row count
DELETE FROM public.waitlist_entries
  WHERE student_id = 'a1000000-0000-0000-0000-000000000006';

RESET ROLE;

SELECT is(
  (SELECT count(*)::int FROM public.waitlist_entries
    WHERE student_id = 'a1000000-0000-0000-0000-000000000006'),
  1,
  'waitlist: student DELETE of another student''s row is a no-op under RLS'
);

SELECT tests.authenticate('a1000000-0000-0000-0000-000000000005', p_is_student => true);
SET LOCAL ROLE authenticated;

SELECT lives_ok(
  $$ DELETE FROM public.waitlist_entries
       WHERE student_id = 'a1000000-0000-0000-0000-000000000005' $$,
  'waitlist: student can DELETE own row'
);

RESET ROLE;

-- ============================================================
-- Instructor: cannot read or write
-- ============================================================

SELECT tests.authenticate('a1000000-0000-0000-0000-000000000002', p_is_instructor => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.waitlist_entries),
  0,
  'waitlist: instructor sees zero rows (RLS blocked)'
);

SELECT throws_ok(
  $$ INSERT INTO public.waitlist_entries (course_id, student_id)
     VALUES ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002') $$,
  '42501',
  NULL,
  'waitlist: instructor INSERT blocked by RLS'
);

RESET ROLE;

-- ============================================================
-- Admin: can read all and insert/delete
-- ============================================================

SELECT tests.authenticate('a1000000-0000-0000-0000-000000000001', p_is_admin => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.waitlist_entries
    WHERE course_id = 'c1000000-0000-0000-0000-000000000001'),
  1,
  'waitlist: admin can read all rows'
);

SELECT lives_ok(
  $$ DELETE FROM public.waitlist_entries
       WHERE course_id = 'c1000000-0000-0000-0000-000000000001' $$,
  'waitlist: admin can DELETE any row'
);

RESET ROLE;

-- ============================================================
-- get_waitlist_position: FIFO order; NULL when not on list
-- ============================================================

-- Seed three students FIFO: Sam, Alex, Jordan (different created_at)
INSERT INTO public.waitlist_entries (course_id, student_id, created_at) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000005', now() + interval '1 second'),
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000006', now() + interval '2 seconds'),
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000007', now() + interval '3 seconds');

-- Sam = position 1
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000005', p_is_student => true);
SET LOCAL ROLE authenticated;

SELECT is(
  public.get_waitlist_position('c1000000-0000-0000-0000-000000000001'),
  1,
  'get_waitlist_position: first to join is #1'
);

RESET ROLE;

-- Jordan = position 3
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000007', p_is_student => true);
SET LOCAL ROLE authenticated;

SELECT is(
  public.get_waitlist_position('c1000000-0000-0000-0000-000000000001'),
  3,
  'get_waitlist_position: third to join is #3'
);

-- Caller not on the list returns NULL
SELECT is(
  public.get_waitlist_position('c1000000-0000-0000-0000-000000000002'),
  NULL,
  'get_waitlist_position: returns NULL when caller not on list'
);

RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
