-- RLS tests for credit_ledger table (#106)
-- Policies under test:
--   credit_ledger: admin insert+select only (no update/delete — immutable
--   ledger) | student reads own | instructors none | anon none
--
-- Run with: supabase test db

BEGIN;
SELECT plan(11);

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
-- ============================================================

-- Insert test credit rows within this transaction (not in seed — financial data)
INSERT INTO public.credit_ledger (id, student_id, amount_cents, reason, issued_by) VALUES
  ('f2000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000005',
   5000, 'Test credit — Sam', 'a1000000-0000-0000-0000-000000000001'),
  ('f2000000-0000-0000-0000-000000000002',
   'a1000000-0000-0000-0000-000000000006',
   7500, 'Test credit — Alex', 'a1000000-0000-0000-0000-000000000001');

-- ============================================================
-- ANON
-- ============================================================

SET LOCAL ROLE anon;

SELECT is(
  (SELECT count(*)::int FROM public.credit_ledger),
  0,
  'anon: cannot read credit_ledger'
);

RESET ROLE;

-- ============================================================
-- ADMIN
-- ============================================================

SELECT tests.authenticate('a1000000-0000-0000-0000-000000000001', p_is_admin => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.credit_ledger),
  2,
  'admin: sees all credit_ledger rows'
);

-- Admin can insert
INSERT INTO public.credit_ledger (id, student_id, amount_cents, reason, issued_by)
  VALUES ('f2000000-0000-0000-0000-000000000003',
          'a1000000-0000-0000-0000-000000000005',
          2500, 'Second test credit — Sam', 'a1000000-0000-0000-0000-000000000001');

SELECT is(
  (SELECT count(*)::int FROM public.credit_ledger WHERE id = 'f2000000-0000-0000-0000-000000000003'),
  1,
  'admin: can insert credit'
);

-- Admin CANNOT update — the ledger is immutable, no UPDATE policy exists.
-- With no RLS policy permitting the row for UPDATE, Postgres matches zero
-- rows (not an error) — assert the row survives unchanged, not an exception.
UPDATE public.credit_ledger SET amount_cents = 1
  WHERE id = 'f2000000-0000-0000-0000-000000000001';

SELECT is(
  (SELECT amount_cents FROM public.credit_ledger WHERE id = 'f2000000-0000-0000-0000-000000000001'),
  5000,
  'admin: cannot update credit_ledger (immutable — no UPDATE policy, row unchanged)'
);

-- Admin CANNOT delete — same immutability guarantee, same zero-rows-matched behavior
DELETE FROM public.credit_ledger
  WHERE id = 'f2000000-0000-0000-0000-000000000001';

SELECT is(
  (SELECT count(*)::int FROM public.credit_ledger WHERE id = 'f2000000-0000-0000-0000-000000000001'),
  1,
  'admin: cannot delete credit_ledger (immutable — no DELETE policy, row survives)'
);

RESET ROLE;

-- ============================================================
-- STUDENT — Sam reads own, cannot read Alex's, cannot write
-- ============================================================

SELECT tests.authenticate('a1000000-0000-0000-0000-000000000005', p_is_student => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.credit_ledger WHERE student_id = 'a1000000-0000-0000-0000-000000000005'),
  2,
  'student: sees own credit rows (2 after admin''s second insert)'
);

SELECT is(
  (SELECT count(*)::int FROM public.credit_ledger WHERE student_id = 'a1000000-0000-0000-0000-000000000006'),
  0,
  'student: cannot read another student''s credit'
);

SELECT is(
  (SELECT count(*)::int FROM public.credit_ledger),
  2,
  'student: total visible is own credit rows only'
);

-- Student cannot insert
SELECT throws_ok(
  $$ INSERT INTO public.credit_ledger (student_id, amount_cents, reason)
     VALUES ('a1000000-0000-0000-0000-000000000005', 1000, 'Self-issued — should fail') $$,
  '42501',
  NULL,
  'student: cannot insert credit (no self-service request — #106 decision)'
);

RESET ROLE;

-- ============================================================
-- INSTRUCTOR — no access
-- ============================================================

SELECT tests.authenticate('a1000000-0000-0000-0000-000000000002', p_is_instructor => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.credit_ledger),
  0,
  'instructor: cannot read any credit_ledger rows'
);

SELECT throws_ok(
  $$ INSERT INTO public.credit_ledger (student_id, amount_cents, reason)
     VALUES ('a1000000-0000-0000-0000-000000000005', 1000, 'Instructor-issued — should fail') $$,
  '42501',
  NULL,
  'instructor: cannot insert credit'
);

RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
