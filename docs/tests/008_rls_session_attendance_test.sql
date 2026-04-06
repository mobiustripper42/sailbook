-- ============================================================
-- RLS Test: session_attendance (migration 008)
-- Run AFTER applying 008_rls_session_attendance.sql
-- Run each section separately in the Supabase SQL Editor.
-- ============================================================

-- ============================================================
-- 0. BASELINE — Total records (as service role / postgres)
--    Expected: 22 rows
-- ============================================================
SELECT count(*) AS total_attendance_records FROM session_attendance;
-- Expected: 22


-- ============================================================
-- 1. ADMIN (Andy) — full read access
--    Expected: sees all 22 records
-- ============================================================
SET role = 'authenticated';
SET request.jwt.claims = '{
  "sub": "a0000000-0000-0000-0000-000000000001",
  "role": "authenticated",
  "user_metadata": {"is_admin": true, "is_instructor": false, "is_student": false}
}';

SELECT count(*) AS admin_sees FROM session_attendance;
-- Expected: 22

RESET role;
RESET request.jwt.claims;


-- ============================================================
-- 2. ADMIN (Andy) — write access (insert + update)
--    Expected: both succeed
-- ============================================================
SET role = 'authenticated';
SET request.jwt.claims = '{
  "sub": "a0000000-0000-0000-0000-000000000001",
  "role": "authenticated",
  "user_metadata": {"is_admin": true, "is_instructor": false, "is_student": false}
}';

-- Insert a test record (Alice e001 + session d001 already exists, so use a combo that doesn't)
-- We'll insert and immediately delete. Using Eve's enrollment (e007) + a session she's not in (d001).
INSERT INTO session_attendance (session_id, enrollment_id, status)
VALUES ('d0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000007', 'expected');
-- Expected: INSERT succeeds (1 row)

-- Update it
UPDATE session_attendance SET status = 'attended'
WHERE session_id = 'd0000000-0000-0000-0000-000000000001'
  AND enrollment_id = 'e0000000-0000-0000-0000-000000000007';
-- Expected: UPDATE 1

-- Clean up
DELETE FROM session_attendance
WHERE session_id = 'd0000000-0000-0000-0000-000000000001'
  AND enrollment_id = 'e0000000-0000-0000-0000-000000000007';

RESET role;
RESET request.jwt.claims;


-- ============================================================
-- 3. STUDENT — Alice (read own only)
--    Alice has enrollments e001 (c001, 2 records) and e002 (c002, 4 records) = 6
-- ============================================================
SET role = 'authenticated';
SET request.jwt.claims = '{
  "sub": "a0000000-0000-0000-0000-000000000004",
  "role": "authenticated",
  "user_metadata": {"is_admin": false, "is_instructor": false, "is_student": true}
}';

SELECT count(*) AS alice_sees FROM session_attendance;
-- Expected: 6

RESET role;
RESET request.jwt.claims;


-- ============================================================
-- 4. STUDENT — Bob (read own only)
--    Bob has enrollments e003 (c002, 4 records) and e006 (c001 cancelled, 2 records) = 6
-- ============================================================
SET role = 'authenticated';
SET request.jwt.claims = '{
  "sub": "a0000000-0000-0000-0000-000000000005",
  "role": "authenticated",
  "user_metadata": {"is_admin": false, "is_instructor": false, "is_student": true}
}';

SELECT count(*) AS bob_sees FROM session_attendance;
-- Expected: 6

RESET role;
RESET request.jwt.claims;


-- ============================================================
-- 5. STUDENT — Eve (completed course only)
--    Eve has enrollment e007 (c006, 2 records)
-- ============================================================
SET role = 'authenticated';
SET request.jwt.claims = '{
  "sub": "a0000000-0000-0000-0000-000000000008",
  "role": "authenticated",
  "user_metadata": {"is_admin": false, "is_instructor": false, "is_student": true}
}';

SELECT count(*) AS eve_sees FROM session_attendance;
-- Expected: 2

RESET role;
RESET request.jwt.claims;


-- ============================================================
-- 6. STUDENT — Dan (zero enrollments)
-- ============================================================
SET role = 'authenticated';
SET request.jwt.claims = '{
  "sub": "a0000000-0000-0000-0000-000000000007",
  "role": "authenticated",
  "user_metadata": {"is_admin": false, "is_instructor": false, "is_student": true}
}';

SELECT count(*) AS dan_sees FROM session_attendance;
-- Expected: 0

RESET role;
RESET request.jwt.claims;


-- ============================================================
-- 7. STUDENT — Alice cannot INSERT
-- ============================================================
SET role = 'authenticated';
SET request.jwt.claims = '{
  "sub": "a0000000-0000-0000-0000-000000000004",
  "role": "authenticated",
  "user_metadata": {"is_admin": false, "is_instructor": false, "is_student": true}
}';

INSERT INTO session_attendance (session_id, enrollment_id, status)
VALUES ('d0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'attended');
-- Expected: ERROR "new row violates row-level security policy"

RESET role;
RESET request.jwt.claims;


-- ============================================================
-- 8. STUDENT — Alice cannot UPDATE
-- ============================================================
SET role = 'authenticated';
SET request.jwt.claims = '{
  "sub": "a0000000-0000-0000-0000-000000000004",
  "role": "authenticated",
  "user_metadata": {"is_admin": false, "is_instructor": false, "is_student": true}
}';

UPDATE session_attendance SET status = 'attended'
WHERE enrollment_id = 'e0000000-0000-0000-0000-000000000002';
-- Expected: UPDATE 0 (silently does nothing — no UPDATE policy for students)

-- Verify nothing changed (run as service role after resetting):
RESET role;
RESET request.jwt.claims;

SELECT status FROM session_attendance
WHERE session_id = 'd0000000-0000-0000-0000-000000000004'
  AND enrollment_id = 'e0000000-0000-0000-0000-000000000002';
-- Expected: still 'expected' (not 'attended')


-- ============================================================
-- 9. INSTRUCTOR — Sarah (reads attendance for her courses)
--    Sarah is instructor on c002 (4 sessions × 4 enrollees = 16 records)
--    Sarah is also a student (e004, 4 records) — but the instructor
--    policy alone should cover the c002 records.
-- ============================================================
SET role = 'authenticated';
SET request.jwt.claims = '{
  "sub": "a0000000-0000-0000-0000-000000000003",
  "role": "authenticated",
  "user_metadata": {"is_admin": false, "is_instructor": true, "is_student": true}
}';

SELECT count(*) AS sarah_sees FROM session_attendance;
-- Expected: 16 (all c002 attendance via instructor policy)
-- Sarah's student policy also gives her e004 records (4), but those
-- are a subset of the 16 so the total is still 16.

RESET role;
RESET request.jwt.claims;


-- ============================================================
-- 10. INSTRUCTOR — Dave (reads attendance for his courses)
--     Dave is instructor on c001 (2 sessions × 2 enrollments = 4 records)
--     Also c004 (draft, 0 enrollments) and c005 (cancelled, 0 enrollments)
--     and c006 (completed, 2 sessions × 1 enrollment = 2 records)
-- ============================================================
SET role = 'authenticated';
SET request.jwt.claims = '{
  "sub": "a0000000-0000-0000-0000-000000000002",
  "role": "authenticated",
  "user_metadata": {"is_admin": false, "is_instructor": true, "is_student": false}
}';

SELECT count(*) AS dave_sees FROM session_attendance;
-- Expected: 6 (c001: 4 records + c006: 2 records)

RESET role;
RESET request.jwt.claims;


-- ============================================================
-- 11. INSTRUCTOR — Dave cannot INSERT
-- ============================================================
SET role = 'authenticated';
SET request.jwt.claims = '{
  "sub": "a0000000-0000-0000-0000-000000000002",
  "role": "authenticated",
  "user_metadata": {"is_admin": false, "is_instructor": true, "is_student": false}
}';

INSERT INTO session_attendance (session_id, enrollment_id, status)
VALUES ('d0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'attended');
-- Expected: ERROR "new row violates row-level security policy"

RESET role;
RESET request.jwt.claims;


-- ============================================================
-- 12. INSTRUCTOR — Dave cannot UPDATE
-- ============================================================
SET role = 'authenticated';
SET request.jwt.claims = '{
  "sub": "a0000000-0000-0000-0000-000000000002",
  "role": "authenticated",
  "user_metadata": {"is_admin": false, "is_instructor": true, "is_student": false}
}';

UPDATE session_attendance SET status = 'attended'
WHERE session_id = 'd0000000-0000-0000-0000-000000000001'
  AND enrollment_id = 'e0000000-0000-0000-0000-000000000001';
-- Expected: UPDATE 0 (silently does nothing)

RESET role;
RESET request.jwt.claims;

-- Verify nothing changed
SELECT status FROM session_attendance
WHERE session_id = 'd0000000-0000-0000-0000-000000000001'
  AND enrollment_id = 'e0000000-0000-0000-0000-000000000001';
-- Expected: still 'expected'
