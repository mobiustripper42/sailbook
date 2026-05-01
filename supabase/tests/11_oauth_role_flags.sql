-- Tests for BEFORE UPDATE trigger that preserves role flags when an OAuth
-- provider overwrites raw_user_meta_data (BUG: admin-created-student-oauth).
--
-- Covers:
--   (a) Baseline: AFTER INSERT trigger still stamps flags (no regression)
--   (b) OAuth identity-link simulation: UPDATE with Google-only payload →
--       BEFORE UPDATE re-stamps flags from public.profiles
--   (c) Flags already present: trigger is a no-op, values survive unchanged
--   (d) No profiles row: UPDATE with missing flags → trigger no-ops safely
--
-- Run with: supabase test db

BEGIN;
SELECT plan(8);

CREATE SCHEMA IF NOT EXISTS tests;

-- ============================================================
-- Test user: fresh auth.users row, no prior profile
-- ============================================================

INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, aud, role
) VALUES (
  'f9000000-0000-0000-0000-000000000001',
  'oauth_test@ltsc.test',
  '',
  NOW(), NOW(), NOW(),
  '{}',
  '{"first_name": "OAuth", "last_name": "Tester"}',
  'authenticated',
  'authenticated'
);

-- ============================================================
-- (a) AFTER INSERT trigger stamps role flags on new users
-- ============================================================

SELECT is(
  (SELECT (raw_user_meta_data->>'is_student')::boolean
     FROM auth.users WHERE id = 'f9000000-0000-0000-0000-000000000001'),
  true,
  '(a) AFTER INSERT: is_student stamped by handle_new_user'
);

SELECT is(
  (SELECT (raw_user_meta_data->>'is_admin')::boolean
     FROM auth.users WHERE id = 'f9000000-0000-0000-0000-000000000001'),
  false,
  '(a) AFTER INSERT: is_admin stamped as false by handle_new_user'
);

-- ============================================================
-- (b) Simulate OAuth identity-link: clobber metadata with Google payload
-- ============================================================

-- profiles row exists (created by handle_new_user above)
UPDATE auth.users
   SET raw_user_meta_data = jsonb_build_object(
         'iss',     'https://accounts.google.com',
         'sub',     '109876543210',
         'name',    'OAuth Tester',
         'picture', 'https://lh3.googleusercontent.com/photo.jpg',
         'email',   'oauth_test@ltsc.test'
       )
 WHERE id = 'f9000000-0000-0000-0000-000000000001';

SELECT is(
  (SELECT (raw_user_meta_data->>'is_student')::boolean
     FROM auth.users WHERE id = 'f9000000-0000-0000-0000-000000000001'),
  true,
  '(b) BEFORE UPDATE: is_student re-stamped after OAuth clobber'
);

SELECT is(
  (SELECT (raw_user_meta_data->>'is_admin')::boolean
     FROM auth.users WHERE id = 'f9000000-0000-0000-0000-000000000001'),
  false,
  '(b) BEFORE UPDATE: is_admin re-stamped as false after OAuth clobber'
);

-- OAuth keys survive alongside re-stamped role flags
SELECT is(
  (SELECT raw_user_meta_data->>'iss'
     FROM auth.users WHERE id = 'f9000000-0000-0000-0000-000000000001'),
  'https://accounts.google.com',
  '(b) BEFORE UPDATE: OAuth iss key preserved alongside role flags'
);

-- ============================================================
-- (c) Flags already present: trigger is a no-op, values survive
-- ============================================================

-- Manually elevate is_admin to true in metadata (profiles still has false)
UPDATE auth.users
   SET raw_user_meta_data = jsonb_build_object(
         'is_admin',      true,
         'is_instructor', false,
         'is_student',    true,
         'custom_key',    'custom_value'
       )
 WHERE id = 'f9000000-0000-0000-0000-000000000001';

-- All three flags present → trigger no-ops → manually-set values survive
SELECT is(
  (SELECT (raw_user_meta_data->>'is_admin')::boolean
     FROM auth.users WHERE id = 'f9000000-0000-0000-0000-000000000001'),
  true,
  '(c) BEFORE UPDATE no-op: is_admin=true survives (flags present, trigger skips)'
);

-- ============================================================
-- (d) No profiles row: trigger no-ops safely (no crash, no NULL clobber)
-- ============================================================

INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, aud, role
) VALUES (
  'f9000000-0000-0000-0000-000000000002',
  'orphan_oauth@ltsc.test',
  '',
  NOW(), NOW(), NOW(),
  '{}',
  '{"first_name": "Orphan"}',
  'authenticated',
  'authenticated'
);

-- Delete the profile that handle_new_user just created so there's no profiles row
DELETE FROM public.profiles WHERE id = 'f9000000-0000-0000-0000-000000000002';

-- Now simulate OAuth clobber — trigger fires, FOUND = false, should no-op
UPDATE auth.users
   SET raw_user_meta_data = '{"iss": "https://accounts.google.com", "sub": "999"}'
 WHERE id = 'f9000000-0000-0000-0000-000000000002';

SELECT is(
  (SELECT raw_user_meta_data
     FROM auth.users WHERE id = 'f9000000-0000-0000-0000-000000000002'),
  '{"iss": "https://accounts.google.com", "sub": "999"}'::jsonb,
  '(d) BEFORE UPDATE no-op: no profiles row → metadata unchanged, no crash'
);

SELECT is(
  (SELECT raw_user_meta_data->>'is_student'
     FROM auth.users WHERE id = 'f9000000-0000-0000-0000-000000000002'),
  NULL,
  '(d) BEFORE UPDATE no-op: is_student stays NULL when no profiles row exists'
);

SELECT * FROM finish();
ROLLBACK;
