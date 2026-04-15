-- RLS tests for payments table
-- Policies under test:
--   payments: admin all | student reads own | instructors none | anon none
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
-- Seed reference (from seed.sql)
--   a1000000-...-0001 = Andy (admin)
--   a1000000-...-0002 = Mike (instructor)
--   a1000000-...-0005 = Sam  (student)
--   a1000000-...-0006 = Alex (student)
--   e1000000-...-0001 = Sam → ASA 101 Weekend May (confirmed)
--   e1000000-...-0002 = Alex → ASA 101 Weekend May (registered)
-- ============================================================

-- Insert test payments within this transaction (not in seed — financial data)
INSERT INTO public.payments (id, enrollment_id, student_id, stripe_payment_intent_id,
  stripe_checkout_session_id, amount_cents, currency, status) VALUES
  ('f1000000-0000-0000-0000-000000000001',
   'e1000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000005',
   'pi_test_sam', 'cs_test_sam', 85000, 'usd', 'succeeded'),
  ('f1000000-0000-0000-0000-000000000002',
   'e1000000-0000-0000-0000-000000000002',
   'a1000000-0000-0000-0000-000000000006',
   'pi_test_alex', 'cs_test_alex', 85000, 'usd', 'pending');

-- ============================================================
-- ANON
-- ============================================================

SET LOCAL ROLE anon;

SELECT is(
  (SELECT count(*)::int FROM public.payments),
  0,
  'anon: cannot read payments'
);

RESET ROLE;

-- ============================================================
-- ADMIN
-- ============================================================

SELECT tests.authenticate('a1000000-0000-0000-0000-000000000001', p_is_admin => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.payments),
  2,
  'admin: sees all payments'
);

-- Admin can update
UPDATE public.payments SET status = 'refunded'
  WHERE id = 'f1000000-0000-0000-0000-000000000001';

SELECT is(
  (SELECT status FROM public.payments WHERE id = 'f1000000-0000-0000-0000-000000000001'),
  'refunded',
  'admin: can update any payment'
);

-- Admin can insert
INSERT INTO public.payments (id, enrollment_id, student_id, amount_cents, status)
  VALUES ('f1000000-0000-0000-0000-000000000003',
          'e1000000-0000-0000-0000-000000000001',
          'a1000000-0000-0000-0000-000000000005',
          85000, 'pending');

SELECT is(
  (SELECT count(*)::int FROM public.payments WHERE id = 'f1000000-0000-0000-0000-000000000003'),
  1,
  'admin: can insert payment'
);

RESET ROLE;

-- ============================================================
-- STUDENT — Sam reads own, cannot read Alex's
-- ============================================================

SELECT tests.authenticate('a1000000-0000-0000-0000-000000000005', p_is_student => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.payments WHERE student_id = 'a1000000-0000-0000-0000-000000000005'),
  2,
  'student: sees own payments (2 rows after admin insert)'
);

SELECT is(
  (SELECT count(*)::int FROM public.payments WHERE student_id = 'a1000000-0000-0000-0000-000000000006'),
  0,
  'student: cannot read another student''s payment'
);

SELECT is(
  (SELECT count(*)::int FROM public.payments),
  2,
  'student: total visible is own payments only'
);

-- Student cannot insert
SELECT throws_ok(
  $$ INSERT INTO public.payments (enrollment_id, student_id, amount_cents, status)
     VALUES ('e1000000-0000-0000-0000-000000000001',
             'a1000000-0000-0000-0000-000000000005',
             85000, 'pending') $$,
  '42501',
  NULL,
  'student: cannot insert payment'
);

RESET ROLE;

-- ============================================================
-- INSTRUCTOR — no access
-- ============================================================

SELECT tests.authenticate('a1000000-0000-0000-0000-000000000002', p_is_instructor => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.payments),
  0,
  'instructor: cannot read any payments'
);

SELECT throws_ok(
  $$ INSERT INTO public.payments (enrollment_id, student_id, amount_cents, status)
     VALUES ('e1000000-0000-0000-0000-000000000001',
             'a1000000-0000-0000-0000-000000000005',
             85000, 'pending') $$,
  '42501',
  NULL,
  'instructor: cannot insert payment'
);

RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
