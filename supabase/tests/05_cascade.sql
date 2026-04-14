-- Instructor deactivation cascade tests
-- Verifies that deactivating an instructor (or removing the instructor role)
-- clears instructor_id on courses and sessions.
--
-- Run with: supabase test db

BEGIN;
SELECT plan(8);

-- ============================================================
-- Seed reference
--   mike (a1000000-...-002): instructor
--     courses: c001, c004, c006
--     sessions: d001-d002 (c001), d007-d008 (c004), d010-d014 (c006)
--   Sessions have NULL instructor_id in seed (use course default).
--   Tests set explicit session instructor_id within the transaction.
-- ============================================================

-- Give d001 and d002 an explicit instructor so we can test session cascade.
UPDATE public.sessions
SET instructor_id = 'a1000000-0000-0000-0000-000000000002'
WHERE id IN (
  'd1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000002'
);

-- ============================================================
-- Test 1: Deactivating an instructor clears their course assignments
-- ============================================================

UPDATE public.profiles
SET is_active = FALSE
WHERE id = 'a1000000-0000-0000-0000-000000000002';

SELECT is(
  (SELECT count(*)::int FROM public.courses WHERE instructor_id = 'a1000000-0000-0000-0000-000000000002'),
  0,
  'deactivate: all course assignments cleared for deactivated instructor'
);

-- ============================================================
-- Test 2: Deactivating clears explicit session assignments
-- ============================================================

SELECT is(
  (SELECT count(*)::int FROM public.sessions WHERE instructor_id = 'a1000000-0000-0000-0000-000000000002'),
  0,
  'deactivate: explicit session assignments cleared for deactivated instructor'
);

-- ============================================================
-- Test 3: Cascade does not clear OTHER instructors' assignments
-- ============================================================
-- Lisa Chen (a1000000-...-003) owns c005 (Dinghy Sailing). That assignment
-- must survive Mike's deactivation.

SELECT is(
  (SELECT count(*)::int FROM public.courses WHERE instructor_id = 'a1000000-0000-0000-0000-000000000003'),
  1,
  'deactivate: Lisa Chen course assignment is untouched'
);

-- ============================================================
-- Test 4: Re-activating the instructor does NOT restore assignments (one-way)
-- ============================================================

UPDATE public.profiles
SET is_active = TRUE
WHERE id = 'a1000000-0000-0000-0000-000000000002';

SELECT is(
  (SELECT count(*)::int FROM public.courses WHERE instructor_id = 'a1000000-0000-0000-0000-000000000002'),
  0,
  'reactivate: assignments remain cleared after reactivation (cascade is one-way)'
);

-- ============================================================
-- Test 5: Removing instructor role also clears course assignments
-- ============================================================

-- Re-assign Mike to c001 and d001 to have something to clear on both levels
UPDATE public.courses
SET instructor_id = 'a1000000-0000-0000-0000-000000000002'
WHERE id = 'c1000000-0000-0000-0000-000000000001';

UPDATE public.sessions
SET instructor_id = 'a1000000-0000-0000-0000-000000000002'
WHERE id = 'd1000000-0000-0000-0000-000000000001';

-- Pre-condition: confirm Mike has 1 course and 1 session assignment before role removal
SELECT is(
  (SELECT count(*)::int FROM public.courses WHERE instructor_id = 'a1000000-0000-0000-0000-000000000002'),
  1,
  'role removal pre-condition: Mike has 1 course assignment before is_instructor = FALSE'
);

SELECT is(
  (SELECT count(*)::int FROM public.sessions WHERE instructor_id = 'a1000000-0000-0000-0000-000000000002'),
  1,
  'role removal pre-condition: Mike has 1 session assignment before is_instructor = FALSE'
);

-- Remove instructor role (is_instructor = false triggers same cascade)
UPDATE public.profiles
SET is_instructor = FALSE
WHERE id = 'a1000000-0000-0000-0000-000000000002';

SELECT is(
  (SELECT count(*)::int FROM public.courses WHERE instructor_id = 'a1000000-0000-0000-0000-000000000002'),
  0,
  'role removal: removing instructor role clears course assignments'
);

-- ============================================================
-- Test 6: Removing instructor role also clears session assignments
-- ============================================================

SELECT is(
  (SELECT count(*)::int FROM public.sessions WHERE instructor_id = 'a1000000-0000-0000-0000-000000000002'),
  0,
  'role removal: removing instructor role clears session assignments'
);

SELECT * FROM finish();
ROLLBACK;
