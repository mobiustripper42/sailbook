-- Tests for admin-created student profiles (DEC-024) and manual payments (DEC-025)
--
-- Verifies:
--   - auth_source column exists and check constraint enforces valid values
--   - Admin can insert a profile with auth_source = 'admin_created'
--   - Self-update RLS cannot change auth_source (admin_created student has no session anyway)
--   - payment_method column exists and check constraint enforces valid values
--   - Manual payment (NULL stripe IDs) allowed by schema
--   - Partial UNIQUE index: two NULLs coexist; duplicate non-NULL stripe session ID blocked
--
-- Run with: supabase test db

BEGIN;
SELECT plan(10);

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
--   a1000000-...-0001 = Andy (admin)
--   a1000000-...-0005 = Sam  (student, confirmed enrollment e1000000-...-0001)
-- ============================================================

-- Ghost user: insert directly into auth.users as postgres (bypasses auth API in tests)
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role
) VALUES (
  'd0000000-0000-0000-0000-000000000099',
  'ghost@test.invalid',
  '',  -- no password
  NOW(),
  NOW(),
  NOW(),
  '{}',
  '{"first_name": "Ghost", "last_name": "Student"}',
  'authenticated',
  'authenticated'
);

-- ============================================================
-- auth_source column: check constraint accepts valid values
-- ============================================================

SELECT lives_ok(
  $$ INSERT INTO public.profiles (id, first_name, last_name, email, is_student, auth_source)
     VALUES ('d0000000-0000-0000-0000-000000000099', 'Ghost', 'Student', 'ghost@test.invalid',
             true, 'admin_created') $$,
  'profiles: admin_created is a valid auth_source value'
);

SELECT throws_ok(
  $$ INSERT INTO public.profiles (id, first_name, last_name, email, is_student, auth_source)
     VALUES ('d0000000-0000-0000-0000-000000000088', 'Bad', 'Value', 'bad@test.invalid',
             true, 'imported') $$,
  '23514',
  NULL,
  'profiles: invalid auth_source value is rejected by check constraint'
);

SELECT is(
  (SELECT auth_source FROM public.profiles WHERE id = 'd0000000-0000-0000-0000-000000000099'),
  'admin_created',
  'profiles: ghost profile reads back with auth_source = admin_created'
);

SELECT is(
  (SELECT auth_source FROM public.profiles WHERE id = 'a1000000-0000-0000-0000-000000000005'),
  'self_registered',
  'profiles: existing seed profile has default auth_source = self_registered'
);

-- ============================================================
-- payment_method column: check constraint accepts valid values
-- ============================================================

-- Insert a manual enrollment for ghost student (as postgres, bypassing RLS)
INSERT INTO public.enrollments (id, course_id, student_id, status)
  SELECT 'e9000000-0000-0000-0000-000000000001',
         c.id,
         'd0000000-0000-0000-0000-000000000099',
         'confirmed'
  FROM public.courses c LIMIT 1;

SELECT lives_ok(
  $$ INSERT INTO public.payments (enrollment_id, student_id, amount_cents, status, payment_method)
     VALUES ('e9000000-0000-0000-0000-000000000001',
             'd0000000-0000-0000-0000-000000000099',
             85000, 'succeeded', 'cash') $$,
  'payments: cash is a valid payment_method'
);

SELECT throws_ok(
  $$ INSERT INTO public.payments (enrollment_id, student_id, amount_cents, status, payment_method)
     VALUES ('e9000000-0000-0000-0000-000000000001',
             'd0000000-0000-0000-0000-000000000099',
             85000, 'succeeded', 'other') $$,
  '23514',
  NULL,
  'payments: other is no longer a valid payment_method (rejected by check constraint)'
);

-- ============================================================
-- Partial UNIQUE index: two NULLs coexist; duplicate non-NULL blocked
-- ============================================================

-- A second manual payment (NULL stripe_checkout_session_id) must be allowed
SELECT lives_ok(
  $$ INSERT INTO public.payments (enrollment_id, student_id, amount_cents, status, payment_method)
     VALUES ('e9000000-0000-0000-0000-000000000001',
             'd0000000-0000-0000-0000-000000000099',
             10000, 'succeeded', 'venmo') $$,
  'payments: two NULL stripe_checkout_session_ids coexist (partial UNIQUE index)'
);

-- Duplicate non-NULL stripe_checkout_session_id must be blocked
INSERT INTO public.payments (enrollment_id, student_id, stripe_checkout_session_id, amount_cents, status, payment_method)
  VALUES ('e1000000-0000-0000-0000-000000000001',
          'a1000000-0000-0000-0000-000000000005',
          'cs_unique_test', 85000, 'succeeded', 'stripe');

SELECT throws_ok(
  $$ INSERT INTO public.payments (enrollment_id, student_id, stripe_checkout_session_id, amount_cents, status, payment_method)
     VALUES ('e1000000-0000-0000-0000-000000000001',
             'a1000000-0000-0000-0000-000000000005',
             'cs_unique_test', 85000, 'succeeded', 'stripe') $$,
  '23505',
  NULL,
  'payments: duplicate non-NULL stripe_checkout_session_id is blocked by partial UNIQUE index'
);

-- ============================================================
-- RLS: ghost student cannot overwrite their own auth_source
-- ============================================================

SELECT tests.authenticate('d0000000-0000-0000-0000-000000000099', p_is_student => true);
SET LOCAL ROLE authenticated;

SELECT throws_ok(
  $$ UPDATE public.profiles SET auth_source = 'self_registered'
     WHERE id = 'd0000000-0000-0000-0000-000000000099' $$,
  '42501',
  NULL,
  'profiles: authenticated student cannot update auth_source (blocked by self-update WITH CHECK)'
);

RESET ROLE;

-- ============================================================
-- RLS: student cannot read another student's payment
-- ============================================================

SELECT tests.authenticate('a1000000-0000-0000-0000-000000000005', p_is_student => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.payments
   WHERE student_id = 'd0000000-0000-0000-0000-000000000099'),
  0,
  'payments: student cannot read a different student''s payment rows'
);

RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
