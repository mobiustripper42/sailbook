-- pgTAP coverage for update_session_notes RPC (Phase 4.6).
-- Authorization: admin OR assigned instructor (course-level OR session-level).
-- All other paths must return an error string and leave the row untouched.

BEGIN;
SELECT plan(8);

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
-- Seed reference (see 01_rls_profiles.sql for full table)
--   a1000000-...-001  andy           admin
--   a1000000-...-002  mike           instructor (owns c001 → session d001)
--   a1000000-...-005  sam            student (enrolled in c001)
--   f1000000-...-002  pw_instructor  instructor (no course assignments)
--   d1000000-...-001  session in c001 (mike's course)
-- ============================================================

-- Reset notes to a known state regardless of any prior state.
UPDATE public.sessions SET notes = NULL WHERE id = 'd1000000-0000-0000-0000-000000000001';

-- ─── Admin can update any session's notes ─────────────────────────────────────

SELECT tests.authenticate(
  'a1000000-0000-0000-0000-000000000001',
  p_is_admin => true
);
SET LOCAL ROLE authenticated;

SELECT is(
  public.update_session_notes('d1000000-0000-0000-0000-000000000001', 'admin wrote this'),
  NULL,
  'admin: update_session_notes returns NULL on success'
);

RESET ROLE;
SELECT is(
  (SELECT notes FROM public.sessions WHERE id = 'd1000000-0000-0000-0000-000000000001'),
  'admin wrote this',
  'admin: notes column was actually updated'
);

-- ─── Assigned instructor (mike) can update his own session ────────────────────

SELECT tests.authenticate(
  'a1000000-0000-0000-0000-000000000002',
  p_is_instructor => true
);
SET LOCAL ROLE authenticated;

SELECT is(
  public.update_session_notes('d1000000-0000-0000-0000-000000000001', 'mike wrote this'),
  NULL,
  'assigned instructor: returns NULL on success'
);

RESET ROLE;
SELECT is(
  (SELECT notes FROM public.sessions WHERE id = 'd1000000-0000-0000-0000-000000000001'),
  'mike wrote this',
  'assigned instructor: notes column was updated'
);

-- ─── Other instructor (pw_instructor) cannot update mike's session ────────────

SELECT tests.authenticate(
  'f1000000-0000-0000-0000-000000000002',
  p_is_instructor => true
);
SET LOCAL ROLE authenticated;

SELECT is(
  public.update_session_notes('d1000000-0000-0000-0000-000000000001', 'pw_instructor tried'),
  'Not authorized for this session.',
  'other instructor: returns auth error'
);

RESET ROLE;
SELECT is(
  (SELECT notes FROM public.sessions WHERE id = 'd1000000-0000-0000-0000-000000000001'),
  'mike wrote this',
  'other instructor: notes column was NOT changed'
);

-- ─── Student cannot update notes ──────────────────────────────────────────────

SELECT tests.authenticate(
  'a1000000-0000-0000-0000-000000000005',
  p_is_student => true
);
SET LOCAL ROLE authenticated;

SELECT is(
  public.update_session_notes('d1000000-0000-0000-0000-000000000001', 'sam tried'),
  'Not authorized for this session.',
  'student: returns auth error'
);

RESET ROLE;

-- ─── 2000-char cap is enforced ────────────────────────────────────────────────

SELECT tests.authenticate(
  'a1000000-0000-0000-0000-000000000001',
  p_is_admin => true
);
SET LOCAL ROLE authenticated;

SELECT is(
  public.update_session_notes(
    'd1000000-0000-0000-0000-000000000001',
    repeat('x', 2001)
  ),
  'Notes must be 2000 characters or fewer.',
  'oversize input: returns length error'
);

RESET ROLE;

ROLLBACK;
