-- SailBook Dev Seed Data
-- Run in the Supabase SQL Editor after a full wipe (see sql-helpers.sql).
-- All test users share password: Test1234!
-- Fixed UUIDs — safe to reference in queries / re-run after wipe.
--
-- Edge cases covered:
--   • Course at capacity (can't enroll)
--   • Course with no instructor assigned yet
--   • Draft course (not visible to students)
--   • Cancelled course
--   • Cancelled enrollment (student can re-enroll)
--   • Student with multiple enrollments
--   • Student with zero enrollments
--   • Past/completed course with historical enrollment
--   • Inactive course type (shouldn't appear in create form)
--   • Session with location vs. without

-- ============================================================
-- USERS  (auth.users + profiles)
-- Requires pgcrypto (enabled by default on Supabase)
-- ============================================================

-- GoTrue requires token columns to be '' (empty string), not NULL.
-- Seeding directly bypasses GoTrue's defaults — set them explicitly.
INSERT INTO auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  reauthentication_token,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) VALUES
  -- Admin
  ('a0000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'andy@ltsc.test',
   crypt('Test1234!', gen_salt('bf')), now(),
   '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"first_name":"Andy","last_name":"Admin","is_admin":true,"is_instructor":false,"is_student":false}',
   now(), now()),

  -- Instructor Dave
  ('a0000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'dave@ltsc.test',
   crypt('Test1234!', gen_salt('bf')), now(),
   '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"first_name":"Dave","last_name":"Instructor","is_admin":false,"is_instructor":true,"is_student":false}',
   now(), now()),

  -- Instructor Sarah (also a student — multi-role edge case)
  ('a0000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'sarah@ltsc.test',
   crypt('Test1234!', gen_salt('bf')), now(),
   '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"first_name":"Sarah","last_name":"Instructor","is_admin":false,"is_instructor":true,"is_student":true}',
   now(), now()),

  -- Student Alice — multiple upcoming enrollments
  ('a0000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'alice@ltsc.test',
   crypt('Test1234!', gen_salt('bf')), now(),
   '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"first_name":"Alice","last_name":"Student","is_admin":false,"is_instructor":false,"is_student":true}',
   now(), now()),

  -- Student Bob — has a cancelled enrollment (re-enroll test)
  ('a0000000-0000-0000-0000-000000000005',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'bob@ltsc.test',
   crypt('Test1234!', gen_salt('bf')), now(),
   '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"first_name":"Bob","last_name":"Student","is_admin":false,"is_instructor":false,"is_student":true}',
   now(), now()),

  -- Student Carol — enrolled in the full course (4/4)
  ('a0000000-0000-0000-0000-000000000006',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'carol@ltsc.test',
   crypt('Test1234!', gen_salt('bf')), now(),
   '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"first_name":"Carol","last_name":"Student","is_admin":false,"is_instructor":false,"is_student":true}',
   now(), now()),

  -- Student Dan — zero enrollments (fresh student)
  ('a0000000-0000-0000-0000-000000000007',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'dan@ltsc.test',
   crypt('Test1234!', gen_salt('bf')), now(),
   '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"first_name":"Dan","last_name":"Student","is_admin":false,"is_instructor":false,"is_student":true}',
   now(), now()),

  -- Student Eve — only past/completed enrollments
  ('a0000000-0000-0000-0000-000000000008',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'eve@ltsc.test',
   crypt('Test1234!', gen_salt('bf')), now(),
   '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"first_name":"Eve","last_name":"Student","is_admin":false,"is_instructor":false,"is_student":true}',
   now(), now());

-- auth.identities is required for signInWithPassword to work.
-- Supabase creates this automatically on normal signUp — direct inserts must do it manually.
-- provider_id is required in newer Supabase versions; for email provider it equals the email.
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES
  ('a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','andy@ltsc.test', '{"sub":"a0000000-0000-0000-0000-000000000001","email":"andy@ltsc.test"}', 'email',now(),now(),now()),
  ('a0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000002','dave@ltsc.test', '{"sub":"a0000000-0000-0000-0000-000000000002","email":"dave@ltsc.test"}', 'email',now(),now(),now()),
  ('a0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000003','sarah@ltsc.test','{"sub":"a0000000-0000-0000-0000-000000000003","email":"sarah@ltsc.test"}','email',now(),now(),now()),
  ('a0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000004','alice@ltsc.test','{"sub":"a0000000-0000-0000-0000-000000000004","email":"alice@ltsc.test"}','email',now(),now(),now()),
  ('a0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000005','bob@ltsc.test',  '{"sub":"a0000000-0000-0000-0000-000000000005","email":"bob@ltsc.test"}',  'email',now(),now(),now()),
  ('a0000000-0000-0000-0000-000000000006','a0000000-0000-0000-0000-000000000006','carol@ltsc.test','{"sub":"a0000000-0000-0000-0000-000000000006","email":"carol@ltsc.test"}','email',now(),now(),now()),
  ('a0000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000007','dan@ltsc.test',  '{"sub":"a0000000-0000-0000-0000-000000000007","email":"dan@ltsc.test"}',  'email',now(),now(),now()),
  ('a0000000-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000008','eve@ltsc.test',  '{"sub":"a0000000-0000-0000-0000-000000000008","email":"eve@ltsc.test"}',  'email',now(),now(),now());

INSERT INTO profiles (id, email, first_name, last_name, is_admin, is_instructor, is_student, experience_level) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'andy@ltsc.test',  'Andy',  'Admin',      true,  false, false, null),
  ('a0000000-0000-0000-0000-000000000002', 'dave@ltsc.test',  'Dave',  'Instructor', false, true,  false, null),
  ('a0000000-0000-0000-0000-000000000003', 'sarah@ltsc.test', 'Sarah', 'Instructor', false, true,  true,  'advanced'),
  ('a0000000-0000-0000-0000-000000000004', 'alice@ltsc.test', 'Alice', 'Student',    false, false, true,  'beginner'),
  ('a0000000-0000-0000-0000-000000000005', 'bob@ltsc.test',   'Bob',   'Student',    false, false, true,  'beginner'),
  ('a0000000-0000-0000-0000-000000000006', 'carol@ltsc.test', 'Carol', 'Student',    false, false, true,  'intermediate'),
  ('a0000000-0000-0000-0000-000000000007', 'dan@ltsc.test',   'Dan',   'Student',    false, false, true,  null),
  ('a0000000-0000-0000-0000-000000000008', 'eve@ltsc.test',   'Eve',   'Student',    false, false, true,  'intermediate');

-- ============================================================
-- COURSE TYPES
-- ============================================================

INSERT INTO course_types (id, name, short_code, certification_body, description, min_hours, max_students, is_active) VALUES
  ('b0000000-0000-0000-0000-000000000001',
   'ASA 101 — Basic Keelboat Sailing', 'ASA101', 'ASA',
   'Foundation keelboat course. Covers points of sail, basic maneuvers, and docking.',
   16, 4, true),

  ('b0000000-0000-0000-0000-000000000002',
   'ASA 103 — Basic Coastal Cruising', 'ASA103', 'ASA',
   'Overnight coastal cruising. Prereq: ASA 101.',
   32, 4, true),

  ('b0000000-0000-0000-0000-000000000003',
   'Dinghy Sailing Intro', 'DINGHY', null,
   'Fun introduction to dinghy sailing. No experience needed.',
   8, 6, true),

  ('b0000000-0000-0000-0000-000000000004',
   'Open Sailing', 'OPEN', null,
   'Supervised open sailing time on club boats. No instruction.',
   null, 8, true),

  -- Inactive type — should not appear in new course form
  ('b0000000-0000-0000-0000-000000000005',
   'Advanced Racing', 'RACE', 'US Sailing',
   'Competitive racing tactics and rules.',
   24, 6, false);

-- ============================================================
-- COURSES
-- ============================================================

INSERT INTO courses (id, course_type_id, instructor_id, title, capacity, price, status, notes, created_by) VALUES

  -- Active, fully assigned, upcoming sessions (Alice enrolled, spots available)
  ('c0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000002',
   'ASA 101 — Weekend Intensive',
   4, 450.00, 'active', null,
   'a0000000-0000-0000-0000-000000000001'),

  -- Active, FULL (4/4), upcoming sessions (Carol is the 4th enrollee)
  ('c0000000-0000-0000-0000-000000000002',
   'b0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000003',
   'ASA 101 — Evening Series',
   4, 400.00, 'active', null,
   'a0000000-0000-0000-0000-000000000001'),

  -- Active, NO instructor assigned yet (admin forgot)
  ('c0000000-0000-0000-0000-000000000003',
   'b0000000-0000-0000-0000-000000000002',
   null,
   null,
   4, 650.00, 'active', 'Need to assign instructor before publishing sessions.',
   'a0000000-0000-0000-0000-000000000001'),

  -- Draft — invisible to students
  ('c0000000-0000-0000-0000-000000000004',
   'b0000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000002',
   null,
   6, 150.00, 'draft', 'Placeholder for summer dinghy program.',
   'a0000000-0000-0000-0000-000000000001'),

  -- Cancelled course
  ('c0000000-0000-0000-0000-000000000005',
   'b0000000-0000-0000-0000-000000000004',
   'a0000000-0000-0000-0000-000000000002',
   'Open Sailing — April',
   8, null, 'cancelled', 'Cancelled due to early-season weather.',
   'a0000000-0000-0000-0000-000000000001'),

  -- Completed, past sessions — Eve enrolled (historical record)
  ('c0000000-0000-0000-0000-000000000006',
   'b0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000002',
   'ASA 101 — March Weekend',
   4, 450.00, 'completed', null,
   'a0000000-0000-0000-0000-000000000001');

-- ============================================================
-- SESSIONS
-- Dates: upcoming = May 2026, past = March 2026
-- ============================================================

INSERT INTO sessions (course_id, date, start_time, end_time, location, status) VALUES

  -- ASA 101 Weekend Intensive (c001) — 2 upcoming sessions
  ('c0000000-0000-0000-0000-000000000001', '2026-05-09', '08:00', '16:00', 'Edgewater Marina, Dock A', 'scheduled'),
  ('c0000000-0000-0000-0000-000000000001', '2026-05-10', '08:00', '16:00', 'Edgewater Marina, Dock A', 'scheduled'),

  -- ASA 101 Evening Series (c002) — 4 upcoming sessions
  ('c0000000-0000-0000-0000-000000000002', '2026-05-06', '18:00', '21:00', 'Edgewater Marina, Dock B', 'scheduled'),
  ('c0000000-0000-0000-0000-000000000002', '2026-05-13', '18:00', '21:00', 'Edgewater Marina, Dock B', 'scheduled'),
  ('c0000000-0000-0000-0000-000000000002', '2026-05-20', '18:00', '21:00', 'Edgewater Marina, Dock B', 'scheduled'),
  ('c0000000-0000-0000-0000-000000000002', '2026-05-27', '18:00', '21:00', 'Edgewater Marina, Dock B', 'scheduled'),

  -- ASA 103 (c003) — no sessions yet (tests "no sessions scheduled" empty state)

  -- Dinghy draft (c004) — 1 session (shouldn't matter, draft not visible)
  ('c0000000-0000-0000-0000-000000000004', '2026-06-07', '10:00', '14:00', null, 'scheduled'),

  -- Cancelled Open Sailing (c005) — 1 cancelled session
  ('c0000000-0000-0000-0000-000000000005', '2026-04-12', '09:00', '12:00', 'Edgewater Marina, Dock A', 'cancelled'),

  -- ASA 101 March (c006) — 2 completed past sessions
  ('c0000000-0000-0000-0000-000000000006', '2026-03-14', '08:00', '16:00', 'Edgewater Marina, Dock A', 'completed'),
  ('c0000000-0000-0000-0000-000000000006', '2026-03-15', '08:00', '16:00', 'Edgewater Marina, Dock A', 'completed');

-- ============================================================
-- ENROLLMENTS
-- ============================================================

INSERT INTO enrollments (course_id, student_id, status) VALUES

  -- Alice in c001 (active, upcoming) — registered
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'registered'),

  -- Full course (c002) — 4 enrollments to hit capacity (Alice, Bob, Sarah, Carol)
  -- Alice also in c002 (confirmed — tests multi-enrollment)
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'confirmed'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', 'registered'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'registered'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000006', 'registered'),

  -- Bob has a CANCELLED enrollment in c001 — can re-enroll (tests duplicate prevention bypass)
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 'cancelled'),

  -- Eve in completed course (c006) — completed
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000008', 'completed');

-- Dan (a007) has no enrollments at all — tests empty My Courses state
-- ASA 103 (c003) has no enrollments — tests zero-enrollment course detail

-- ============================================================
-- QUICK REFERENCE
-- ============================================================
-- Logins (all password: Test1234!)
--   andy@ltsc.test   → admin
--   dave@ltsc.test   → instructor
--   sarah@ltsc.test  → instructor + student
--   alice@ltsc.test  → student (enrolled in c001 + c002, both upcoming)
--   bob@ltsc.test    → student (cancelled enrollment in c001 — can re-enroll)
--   carol@ltsc.test  → student (in full course c002)
--   dan@ltsc.test    → student (no enrollments)
--   eve@ltsc.test    → student (completed past course only)
--
-- Courses
--   c001 ASA 101 Weekend Intensive  active  1/4  2 upcoming sessions
--   c002 ASA 101 Evening Series     active  4/4  FULL  4 upcoming sessions (Alice, Bob, Sarah, Carol)
--   c003 ASA 103                    active  0/4  no instructor, no sessions
--   c004 Dinghy Intro               draft        not visible to students
--   c005 Open Sailing April         cancelled
--   c006 ASA 101 March              completed    past sessions, Eve enrolled
