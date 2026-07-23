-- pgTAP coverage for save_attendance RPC (DEC-037 / #146).
-- Authorization: admin OR assigned instructor (course-level OR session-level,
-- DEC-007). Invalid statuses are rejected; makeup_session_id is never touched
-- (DEC-005/006); every UPDATE pins session_id = p_session_id.
--
-- Run with: supabase test db

BEGIN;
SELECT plan(15);

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
--   a1000000-...-002  mike           instructor
--   a1000000-...-005  sam            student
--   f1000000-...-002  pw_instructor  instructor (no course assignments)
-- ============================================================

-- Fixtures (inserted as postgres, rolled back at the end):
--   course c9 owned by mike (course-level instructor)
--   session s1 in c9 (no session-level instructor → course-level auth path)
--   session s2 in c9 with instructor_id = pw_instructor (DEC-007 override path)
--   enrollment e9: sam in c9
--   attendance (s1, e9) 'expected', makeup_session_id → s2
--   attendance (s2, e9) 'expected'

INSERT INTO public.course_types (id, name, short_code, slug)
  VALUES ('99000000-0000-0000-0000-000000000001', 'Attendance RPC Test Type', 'ATT-T', 'att-rpc-test');

INSERT INTO public.courses (id, course_type_id, instructor_id, title, status, created_by)
  VALUES ('99000000-0000-0000-0000-000000000010',
          '99000000-0000-0000-0000-000000000001',
          'a1000000-0000-0000-0000-000000000002',  -- mike
          'Attendance RPC Test Course', 'active',
          'a1000000-0000-0000-0000-000000000001'); -- andy

INSERT INTO public.sessions (id, course_id, instructor_id, date, start_time, end_time)
  VALUES
    ('99000000-0000-0000-0000-000000000021',
     '99000000-0000-0000-0000-000000000010',
     NULL,                                          -- course-level auth only
     '2026-08-01', '09:00', '12:00'),
    ('99000000-0000-0000-0000-000000000022',
     '99000000-0000-0000-0000-000000000010',
     'f1000000-0000-0000-0000-000000000002',        -- pw_instructor override
     '2026-08-02', '09:00', '12:00');

INSERT INTO public.enrollments (id, course_id, student_id, status)
  VALUES ('99000000-0000-0000-0000-000000000030',
          '99000000-0000-0000-0000-000000000010',
          'a1000000-0000-0000-0000-000000000005',   -- sam
          'confirmed');

INSERT INTO public.session_attendance (session_id, enrollment_id, status, makeup_session_id)
  VALUES ('99000000-0000-0000-0000-000000000021',
          '99000000-0000-0000-0000-000000000030',
          'expected',
          '99000000-0000-0000-0000-000000000022'),  -- makeup link to preserve
         ('99000000-0000-0000-0000-000000000022',
          '99000000-0000-0000-0000-000000000030',
          'expected', NULL);

-- ─── 1. Assigned (course-level) instructor can save attendance ────────────────

SELECT tests.authenticate(
  'a1000000-0000-0000-0000-000000000002',
  p_is_instructor => true
);
SET LOCAL ROLE authenticated;

SELECT is(
  public.save_attendance(
    '99000000-0000-0000-0000-000000000021',
    '[{"enrollment_id": "99000000-0000-0000-0000-000000000030", "status": "attended", "notes": "on time"}]'::jsonb
  ),
  NULL,
  'course-level instructor: save_attendance returns NULL on success'
);

RESET ROLE;
SELECT is(
  (SELECT status FROM public.session_attendance
   WHERE session_id = '99000000-0000-0000-0000-000000000021'
     AND enrollment_id = '99000000-0000-0000-0000-000000000030'),
  'attended',
  'course-level instructor: status flipped to attended'
);
SELECT is(
  (SELECT notes FROM public.session_attendance
   WHERE session_id = '99000000-0000-0000-0000-000000000021'
     AND enrollment_id = '99000000-0000-0000-0000-000000000030'),
  'on time',
  'course-level instructor: notes were written'
);

-- ─── 2. Non-assigned instructor is denied ─────────────────────────────────────

SELECT tests.authenticate(
  'f1000000-0000-0000-0000-000000000002',
  p_is_instructor => true
);
SET LOCAL ROLE authenticated;

SELECT is(
  public.save_attendance(
    '99000000-0000-0000-0000-000000000021',
    '[{"enrollment_id": "99000000-0000-0000-0000-000000000030", "status": "missed", "notes": null}]'::jsonb
  ),
  'Not authorized for this session.',
  'non-assigned instructor: returns auth error'
);

RESET ROLE;
SELECT is(
  (SELECT status FROM public.session_attendance
   WHERE session_id = '99000000-0000-0000-0000-000000000021'
     AND enrollment_id = '99000000-0000-0000-0000-000000000030'),
  'attended',
  'non-assigned instructor: row was NOT changed'
);

-- ─── 3. Admin can save for any session ────────────────────────────────────────

SELECT tests.authenticate(
  'a1000000-0000-0000-0000-000000000001',
  p_is_admin => true
);
SET LOCAL ROLE authenticated;

SELECT is(
  public.save_attendance(
    '99000000-0000-0000-0000-000000000021',
    '[{"enrollment_id": "99000000-0000-0000-0000-000000000030", "status": "missed", "notes": null}]'::jsonb
  ),
  NULL,
  'admin: save_attendance returns NULL on success'
);

RESET ROLE;
SELECT is(
  (SELECT status FROM public.session_attendance
   WHERE session_id = '99000000-0000-0000-0000-000000000021'
     AND enrollment_id = '99000000-0000-0000-0000-000000000030'),
  'missed',
  'admin: status flipped to missed'
);

-- ─── 4. DEC-007 session-level override instructor can save ────────────────────
-- pw_instructor is NOT the course-level owner of c9, but IS session s2's
-- instructor_id — this exercises the override branch of get_instructor_session_ids.

SELECT tests.authenticate(
  'f1000000-0000-0000-0000-000000000002',
  p_is_instructor => true
);
SET LOCAL ROLE authenticated;

SELECT is(
  public.save_attendance(
    '99000000-0000-0000-0000-000000000022',
    '[{"enrollment_id": "99000000-0000-0000-0000-000000000030", "status": "attended", "notes": ""}]'::jsonb
  ),
  NULL,
  'session-level instructor (DEC-007 override): returns NULL on success'
);

RESET ROLE;
SELECT is(
  (SELECT status FROM public.session_attendance
   WHERE session_id = '99000000-0000-0000-0000-000000000022'
     AND enrollment_id = '99000000-0000-0000-0000-000000000030'),
  'attended',
  'session-level instructor: status flipped on their session'
);

-- ─── 5. Invalid status is rejected ────────────────────────────────────────────

SELECT tests.authenticate(
  'a1000000-0000-0000-0000-000000000001',
  p_is_admin => true
);
SET LOCAL ROLE authenticated;

SELECT is(
  public.save_attendance(
    '99000000-0000-0000-0000-000000000021',
    '[{"enrollment_id": "99000000-0000-0000-0000-000000000030", "status": "present", "notes": null}]'::jsonb
  ),
  'Invalid attendance status: present.',
  'invalid status: returns error string'
);

RESET ROLE;
SELECT is(
  (SELECT status FROM public.session_attendance
   WHERE session_id = '99000000-0000-0000-0000-000000000021'
     AND enrollment_id = '99000000-0000-0000-0000-000000000030'),
  'missed',
  'invalid status: row was NOT changed'
);

-- ─── 6. Unmatched enrollment_id is rejected atomically ───────────────────────
-- A batch mixing a valid record with an enrollment that has no row for this
-- session must reject the WHOLE batch (no partial write) and report the error,
-- not silently no-op and claim success.

SELECT tests.authenticate(
  'a1000000-0000-0000-0000-000000000001',
  p_is_admin => true
);
SET LOCAL ROLE authenticated;

SELECT is(
  public.save_attendance(
    '99000000-0000-0000-0000-000000000021',
    '[{"enrollment_id": "99000000-0000-0000-0000-000000000030", "status": "excused", "notes": null},
      {"enrollment_id": "99000000-0000-0000-0000-0000000000ff", "status": "attended", "notes": null}]'::jsonb
  ),
  'No attendance record for enrollment 99000000-0000-0000-0000-0000000000ff in this session.',
  'unmatched enrollment_id: returns error for the missing row'
);

RESET ROLE;
SELECT is(
  (SELECT status FROM public.session_attendance
   WHERE session_id = '99000000-0000-0000-0000-000000000021'
     AND enrollment_id = '99000000-0000-0000-0000-000000000030'),
  'missed',
  'unmatched enrollment_id: valid sibling record was NOT written (atomic)'
);

-- ─── 7. Malformed enrollment_id gets a friendly error, not a cast exception ───

SELECT tests.authenticate(
  'a1000000-0000-0000-0000-000000000001',
  p_is_admin => true
);
SET LOCAL ROLE authenticated;

SELECT is(
  public.save_attendance(
    '99000000-0000-0000-0000-000000000021',
    '[{"enrollment_id": "not-a-uuid", "status": "attended", "notes": null}]'::jsonb
  ),
  'Invalid enrollment id: not-a-uuid.',
  'malformed enrollment_id: returns friendly error string'
);

RESET ROLE;

-- ─── 8. makeup_session_id is preserved across saves (DEC-005/006) ─────────────
-- The (s1, e9) row started with makeup_session_id → s2 and has since been
-- through two successful status changes. The link must be untouched.

SELECT is(
  (SELECT makeup_session_id FROM public.session_attendance
   WHERE session_id = '99000000-0000-0000-0000-000000000021'
     AND enrollment_id = '99000000-0000-0000-0000-000000000030'),
  '99000000-0000-0000-0000-000000000022'::uuid,
  'makeup_session_id preserved across status-changing saves'
);

SELECT * FROM finish();
ROLLBACK;
