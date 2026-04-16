-- RLS tests for the codes table (DEC-021)
-- Verifies: anon can read active codes, admin can write, non-admin cannot write.
--
-- Run with: supabase test db

BEGIN;
SELECT plan(8);

CREATE SCHEMA IF NOT EXISTS tests;
GRANT USAGE ON SCHEMA tests TO anon, authenticated;

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

-- 1. Anon can SELECT active codes
SET LOCAL ROLE anon;
SELECT ok(
  (SELECT count(*) FROM public.codes WHERE category = 'experience_level' AND is_active = true) >= 3,
  'anon: can read active experience_level codes'
);

-- 2. Anon cannot see inactive codes (RLS filters is_active = false)
SET LOCAL ROLE anon;
SELECT is(
  (SELECT count(*) FROM public.codes WHERE is_active = false),
  0::bigint,
  'anon: inactive codes hidden by RLS'
);

-- 3. Student can SELECT active codes
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000005'::uuid, false, false, true);
SET LOCAL ROLE authenticated;
SELECT ok(
  (SELECT count(*) FROM public.codes WHERE category = 'experience_level') >= 3,
  'student: can read active codes'
);

-- 4. Student cannot INSERT codes
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000005'::uuid, false, false, true);
SET LOCAL ROLE authenticated;
SELECT throws_ok(
  $$INSERT INTO public.codes (category, value, label) VALUES ('experience_level', 'expert', 'Expert')$$,
  '42501',
  NULL,
  'student: cannot INSERT codes'
);

-- 5. Student UPDATE is silently blocked (RLS filters to 0 rows, no error)
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000005'::uuid, false, false, true);
SET LOCAL ROLE authenticated;
UPDATE public.codes SET label = 'Hacked' WHERE value = 'beginner';
SELECT is(
  (SELECT label FROM public.codes WHERE value = 'beginner'),
  'Beginner',
  'student: UPDATE codes silently blocked by RLS — label unchanged'
);

-- 6. Student DELETE is silently blocked (RLS filters to 0 rows, no error)
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000005'::uuid, false, false, true);
SET LOCAL ROLE authenticated;
DELETE FROM public.codes WHERE value = 'beginner';
SELECT is(
  (SELECT count(*) FROM public.codes WHERE value = 'beginner' AND is_active = true),
  1::bigint,
  'student: DELETE codes silently blocked by RLS — row still exists'
);

-- 7. Admin can INSERT codes
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000001'::uuid, true, false, false);
SET LOCAL ROLE authenticated;
SELECT lives_ok(
  $$INSERT INTO public.codes (category, value, label) VALUES ('test_category', 'test_val', 'Test Val')$$,
  'admin: can INSERT codes'
);

-- 8. Admin can DELETE codes
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000001'::uuid, true, false, false);
SET LOCAL ROLE authenticated;
SELECT lives_ok(
  $$DELETE FROM public.codes WHERE category = 'test_category' AND value = 'test_val'$$,
  'admin: can DELETE codes'
);

SELECT * FROM finish();
ROLLBACK;
