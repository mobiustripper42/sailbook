-- Tests for Phase 4.1: instructor invite link (invites table + accept_invite RPC)
--
-- Verifies:
--   - role CHECK constraint rejects invalid values
--   - role is PRIMARY KEY; a second row with the same role is blocked (upsert is required)
--   - RLS: admin can CRUD, instructor cannot read, student cannot insert
--   - accept_invite: rejects invalid role, invalid token, unauthenticated caller
--   - accept_invite: valid token flips is_instructor on the caller's profile
--
-- Run with: supabase test db

BEGIN;
SELECT plan(17);

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
--   a1000000-...-0001 = Andy  (admin)
--   a1000000-...-0002 = Mike  (instructor)
--   a1000000-...-0005 = Sam   (student, will be promoted by accept_invite)
--   a1000000-...-0006 = Alex  (student, stays a student)
-- ============================================================

-- ============================================================
-- Schema: CHECK constraint and PK behavior
-- ============================================================

SELECT throws_ok(
  $$ INSERT INTO public.invites (role, token) VALUES ('student', 'tok_bad_role') $$,
  '23514',
  NULL,
  'invites: role CHECK rejects values other than instructor/admin'
);

-- Seed an instructor invite as postgres (bypasses RLS) — a baseline for later tests
INSERT INTO public.invites (role, token, created_by)
  VALUES ('instructor', 'tok_seed_instructor', 'a1000000-0000-0000-0000-000000000001');

SELECT throws_ok(
  $$ INSERT INTO public.invites (role, token) VALUES ('instructor', 'tok_duplicate') $$,
  '23505',
  NULL,
  'invites: role is PRIMARY KEY — second instructor row is rejected'
);

-- ============================================================
-- RLS: admin can read invites
-- ============================================================

SELECT tests.authenticate('a1000000-0000-0000-0000-000000000001', p_is_admin => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.invites WHERE role = 'instructor'),
  1,
  'invites: admin can SELECT the instructor invite'
);

RESET ROLE;

-- ============================================================
-- RLS: instructor cannot read invites
-- ============================================================

SELECT tests.authenticate('a1000000-0000-0000-0000-000000000002', p_is_instructor => true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.invites),
  0,
  'invites: instructor cannot read invites (RLS filters to 0 rows)'
);

RESET ROLE;

-- ============================================================
-- RLS: student cannot insert
-- ============================================================

SELECT tests.authenticate('a1000000-0000-0000-0000-000000000005', p_is_student => true);
SET LOCAL ROLE authenticated;

SELECT throws_ok(
  $$ INSERT INTO public.invites (role, token) VALUES ('instructor', 'tok_student_insert') $$,
  '42501',
  NULL,
  'invites: student INSERT is blocked by RLS'
);

RESET ROLE;

-- ============================================================
-- RLS: instructor cannot UPDATE or DELETE invites
-- ============================================================

SELECT tests.authenticate('a1000000-0000-0000-0000-000000000002', p_is_instructor => true);
SET LOCAL ROLE authenticated;

-- UPDATE under RLS with zero visible rows silently affects zero rows rather
-- than raising — so we assert the row is unchanged instead of using throws_ok.
UPDATE public.invites SET token = 'tok_instructor_hijack' WHERE role = 'instructor';

SELECT is(
  (SELECT count(*)::int FROM public.invites
    WHERE role = 'instructor' AND token = 'tok_instructor_hijack'),
  0,
  'invites: instructor UPDATE is a no-op under RLS (token unchanged)'
);

-- Same story for DELETE.
DELETE FROM public.invites WHERE role = 'instructor';

RESET ROLE;

SELECT is(
  (SELECT count(*)::int FROM public.invites WHERE role = 'instructor'),
  1,
  'invites: instructor DELETE is a no-op under RLS (row still exists)'
);

-- ============================================================
-- accept_invite: invalid role rejected
-- ============================================================

SELECT tests.authenticate('a1000000-0000-0000-0000-000000000005', p_is_student => true);
SET LOCAL ROLE authenticated;

SELECT is(
  public.accept_invite('student', 'tok_seed_instructor'),
  false,
  'accept_invite: invalid role returns false'
);

-- ============================================================
-- accept_invite: bad token rejected, profile unchanged
-- ============================================================

SELECT is(
  public.accept_invite('instructor', 'tok_wrong'),
  false,
  'accept_invite: unknown token returns false'
);

SELECT is(
  (SELECT is_instructor FROM public.profiles WHERE id = 'a1000000-0000-0000-0000-000000000005'),
  false,
  'accept_invite: is_instructor unchanged after bad token'
);

-- ============================================================
-- accept_invite: valid token flips is_instructor true
-- ============================================================

SELECT is(
  public.accept_invite('instructor', 'tok_seed_instructor'),
  true,
  'accept_invite: valid token returns true'
);

SELECT is(
  (SELECT is_instructor FROM public.profiles WHERE id = 'a1000000-0000-0000-0000-000000000005'),
  true,
  'accept_invite: is_instructor set to true on caller profile'
);

RESET ROLE;

-- ============================================================
-- accept_invite: unauthenticated caller rejected (no auth.uid())
-- ============================================================

-- Clear JWT claims so auth.uid() returns NULL
SELECT set_config('request.jwt.claims', '', true);
SET LOCAL ROLE authenticated;

SELECT is(
  public.accept_invite('instructor', 'tok_seed_instructor'),
  false,
  'accept_invite: unauthenticated caller returns false'
);

RESET ROLE;

-- A separate student's profile is unchanged by an unauth call. Run this as
-- postgres (bypasses RLS) — under SET LOCAL ROLE authenticated with empty
-- JWT claims, auth.uid() is NULL and RLS hides all profile rows, so the
-- SELECT would return NULL rather than the actual flag.
SELECT is(
  (SELECT is_instructor FROM public.profiles WHERE id = 'a1000000-0000-0000-0000-000000000006'),
  false,
  'accept_invite: unauthenticated call does not touch any profile'
);

-- ============================================================
-- RLS: admin can UPDATE (regenerate) invite token
-- ============================================================

SELECT tests.authenticate('a1000000-0000-0000-0000-000000000001', p_is_admin => true);
SET LOCAL ROLE authenticated;

SELECT lives_ok(
  $$ UPDATE public.invites SET token = 'tok_regen_1' WHERE role = 'instructor' $$,
  'invites: admin can UPDATE (regenerate) token'
);

RESET ROLE;

-- ============================================================
-- accept_invite: admin role grants is_admin on caller's profile
-- ============================================================

-- Seed an admin invite as postgres (bypasses RLS)
INSERT INTO public.invites (role, token, created_by)
  VALUES ('admin', 'tok_seed_admin', 'a1000000-0000-0000-0000-000000000001');

-- Authenticate as Alex (a still-student, untouched by earlier tests)
SELECT tests.authenticate(
  'a1000000-0000-0000-0000-000000000006',
  p_is_student => true
);
SET LOCAL ROLE authenticated;

SELECT is(
  public.accept_invite('admin', 'tok_seed_admin'),
  true,
  'accept_invite: valid admin token returns true'
);

RESET ROLE;

SELECT is(
  (SELECT is_admin FROM public.profiles WHERE id = 'a1000000-0000-0000-0000-000000000006'),
  true,
  'accept_invite: is_admin set to true on caller profile'
);

SELECT * FROM finish();
ROLLBACK;
