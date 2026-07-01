-- SailBook Demo Seed Data
-- Realistic Learn to Sail Cleveland data for the product owner walkthrough.
-- All demo users share password: qwert12345
-- Fixed UUIDs — safe to reference in queries / re-run after wipe.
--
-- Run AFTER a full wipe (see sql-helpers.sql → WIPE DEV DATA block).
-- For QA edge-case testing use docs/dev-seed-qa.sql instead.
--
-- People
--   Andy Kaminski  — admin
--   Mike Theriault — instructor
--   Lisa Chen      — instructor
--   Chris Marino   — instructor + student (dual-role demo)
--   Sam Davies     — student, confirmed enrollments
--   Alex Rivera    — student, pending enrollment (shows in admin alert)
--   Jordan Park    — student, not yet enrolled (use for live demo enrollment)
--
-- Courses (session dates are anchored to current_date — see SESSIONS block below)
--   ASA 101 Weekend Intensive   active  2/4  Mike   upcoming Sat/Sun pair (~6 weeks out)
--   ASA 101 Evening Series      active  1/4  Chris  4 weekly evenings; first ~5 days out (starting-soon tile)
--   ASA 103 Coastal Cruising    active  0/4  (no instructor — triggers admin warning)
--   ASA 101 April Weekend       completed    Mike   past weekend, Sam+Jordan attended
--   Dinghy Sailing for Adults   draft        Lisa   (not visible to students)
--   Open Sailing                active  1/8  Mike   5 weekly upcoming evenings @ 5:30–9pm

-- ============================================================
-- USERS  (auth.users + profiles)
-- ============================================================

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
  ('a1000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'andy@ltsc.test',
   crypt('qwert12345', gen_salt('bf')), now(),
   '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"first_name":"Andy","last_name":"Kaminski","is_admin":true,"is_instructor":false,"is_student":false}',
   now(), now()),

  -- Instructor Mike
  ('a1000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'mike@ltsc.test',
   crypt('qwert12345', gen_salt('bf')), now(),
   '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"first_name":"Mike","last_name":"Theriault","is_admin":false,"is_instructor":true,"is_student":false}',
   now(), now()),

  -- Instructor Lisa
  ('a1000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'lisa@ltsc.test',
   crypt('qwert12345', gen_salt('bf')), now(),
   '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"first_name":"Lisa","last_name":"Chen","is_admin":false,"is_instructor":true,"is_student":false}',
   now(), now()),

  -- Chris Marino — instructor + student (dual-role)
  -- Teaches Evening Series, also enrolled in Open Sailing as a student
  ('a1000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'chris@ltsc.test',
   crypt('qwert12345', gen_salt('bf')), now(),
   '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"first_name":"Chris","last_name":"Marino","is_admin":false,"is_instructor":true,"is_student":true}',
   now(), now()),

  -- Student Sam — confirmed enrollments, attended April course
  ('a1000000-0000-0000-0000-000000000005',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'sam@ltsc.test',
   crypt('qwert12345', gen_salt('bf')), now(),
   '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"first_name":"Sam","last_name":"Davies","is_admin":false,"is_instructor":false,"is_student":true}',
   now(), now()),

  -- Student Alex — pending enrollment (shows in admin "Pending Confirmation" alert)
  ('a1000000-0000-0000-0000-000000000006',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'alex@ltsc.test',
   crypt('qwert12345', gen_salt('bf')), now(),
   '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"first_name":"Alex","last_name":"Rivera","is_admin":false,"is_instructor":false,"is_student":true}',
   now(), now()),

  -- Student Jordan — not enrolled (use for live demo enrollment during walkthrough)
  ('a1000000-0000-0000-0000-000000000007',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'jordan@ltsc.test',
   crypt('qwert12345', gen_salt('bf')), now(),
   '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"first_name":"Jordan","last_name":"Park","is_admin":false,"is_instructor":false,"is_student":true}',
   now(), now());

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES
  ('a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','andy@ltsc.test',  '{"sub":"a1000000-0000-0000-0000-000000000001","email":"andy@ltsc.test"}',  'email',now(),now(),now()),
  ('a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000002','mike@ltsc.test',  '{"sub":"a1000000-0000-0000-0000-000000000002","email":"mike@ltsc.test"}',  'email',now(),now(),now()),
  ('a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000003','lisa@ltsc.test',  '{"sub":"a1000000-0000-0000-0000-000000000003","email":"lisa@ltsc.test"}',  'email',now(),now(),now()),
  ('a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000004','chris@ltsc.test', '{"sub":"a1000000-0000-0000-0000-000000000004","email":"chris@ltsc.test"}', 'email',now(),now(),now()),
  ('a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000005','sam@ltsc.test',   '{"sub":"a1000000-0000-0000-0000-000000000005","email":"sam@ltsc.test"}',   'email',now(),now(),now()),
  ('a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000006','alex@ltsc.test',  '{"sub":"a1000000-0000-0000-0000-000000000006","email":"alex@ltsc.test"}',  'email',now(),now(),now()),
  ('a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000007','jordan@ltsc.test','{"sub":"a1000000-0000-0000-0000-000000000007","email":"jordan@ltsc.test"}','email',now(),now(),now());

INSERT INTO profiles (id, email, first_name, last_name, is_admin, is_instructor, is_student, experience_level) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'andy@ltsc.test',   'Andy',   'Kaminski',   true,  false, false, null),
  ('a1000000-0000-0000-0000-000000000002', 'mike@ltsc.test',   'Mike',   'Theriault',  false, true,  false, null),
  ('a1000000-0000-0000-0000-000000000003', 'lisa@ltsc.test',   'Lisa',   'Chen',       false, true,  false, null),
  ('a1000000-0000-0000-0000-000000000004', 'chris@ltsc.test',  'Chris',  'Marino',     false, true,  true,  'intermediate'),
  ('a1000000-0000-0000-0000-000000000005', 'sam@ltsc.test',    'Sam',    'Davies',     false, false, true,  'beginner'),
  ('a1000000-0000-0000-0000-000000000006', 'alex@ltsc.test',   'Alex',   'Rivera',     false, false, true,  'beginner'),
  ('a1000000-0000-0000-0000-000000000007', 'jordan@ltsc.test', 'Jordan', 'Park',       false, false, true,  null);

-- ============================================================
-- COURSE TYPES
-- ============================================================

INSERT INTO course_types (id, name, short_code, certification_body, description, min_hours, max_students, is_active) VALUES
  ('b1000000-0000-0000-0000-000000000001',
   'ASA 101 — Basic Keelboat Sailing', 'ASA101', 'ASA',
   'Foundation keelboat course. Covers points of sail, basic maneuvers, and docking.',
   16, 4, true),

  ('b1000000-0000-0000-0000-000000000002',
   'ASA 103 — Basic Coastal Cruising', 'ASA103', 'ASA',
   'Overnight coastal cruising. Prereq: ASA 101.',
   32, 4, true),

  ('b1000000-0000-0000-0000-000000000003',
   'Dinghy Sailing for Adults', 'DINGHY', null,
   'Fun introduction to dinghy sailing. No experience needed.',
   8, 6, true),

  ('b1000000-0000-0000-0000-000000000004',
   'Open Sailing', 'OPEN', null,
   'Supervised open sailing time on club boats. No formal instruction.',
   null, 8, true),

  -- Inactive — should not appear in New Course dropdown
  ('b1000000-0000-0000-0000-000000000005',
   'Advanced Racing', 'RACE', 'US Sailing',
   'Competitive racing tactics and rules.',
   24, 6, false);

-- ============================================================
-- COURSES
-- ============================================================

INSERT INTO courses (id, course_type_id, instructor_id, title, capacity, price, status, notes, created_by) VALUES

  -- ASA 101 Weekend May — active, Mike, 2 enrolled (Sam confirmed, Alex pending)
  ('c1000000-0000-0000-0000-000000000001',
   'b1000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000002',
   'ASA 101 — Weekend Intensive (May)',
   4, 450.00, 'active', null,
   'a1000000-0000-0000-0000-000000000001'),

  -- ASA 101 Evening Series May — active, Chris, 1 enrolled (Sam confirmed)
  ('c1000000-0000-0000-0000-000000000002',
   'b1000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000004',
   'ASA 101 — Evening Series (May)',
   4, 400.00, 'active', null,
   'a1000000-0000-0000-0000-000000000001'),

  -- ASA 103 Coastal June — active, NO instructor (triggers admin warning tile)
  ('c1000000-0000-0000-0000-000000000003',
   'b1000000-0000-0000-0000-000000000002',
   null,
   'ASA 103 — Coastal Cruising (June)',
   4, 650.00, 'active', 'Need to assign instructor before scheduling sessions.',
   'a1000000-0000-0000-0000-000000000001'),

  -- ASA 101 April Weekend — completed, Mike, Sam + Jordan attended
  ('c1000000-0000-0000-0000-000000000004',
   'b1000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000002',
   'ASA 101 — Weekend (April)',
   4, 450.00, 'completed', null,
   'a1000000-0000-0000-0000-000000000001'),

  -- Dinghy Sailing for Adults — draft, Lisa (not visible to students)
  ('c1000000-0000-0000-0000-000000000005',
   'b1000000-0000-0000-0000-000000000003',
   'a1000000-0000-0000-0000-000000000003',
   'Dinghy Sailing for Adults',
   6, 150.00, 'draft', 'Placeholder for summer dinghy program.',
   'a1000000-0000-0000-0000-000000000001'),

  -- Open Sailing July — active, Mike, 5 Wed sessions; Chris enrolled as student (dual-role demo)
  ('c1000000-0000-0000-0000-000000000006',
   'b1000000-0000-0000-0000-000000000004',
   'a1000000-0000-0000-0000-000000000002',
   'Open Sailing — July Wednesdays',
   8, null, 'active', null,
   'a1000000-0000-0000-0000-000000000001');

-- ============================================================
-- SESSIONS
-- ============================================================

INSERT INTO sessions (id, course_id, date, start_time, end_time, location, status) VALUES

  -- Dates anchored to current_date so the demo timeline (past / starting-soon / upcoming)
  -- stays current on any load date — never hardcode literal dates here again (issue #70).
  -- Mirrors supabase/seed.sql offsets; titles keep their static month labels (display-only).

  -- ASA 101 Weekend Intensive (c001) — upcoming Sat/Sun pair
  ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', current_date + 40, '08:00', '16:00', 'Edgewater Marina, Dock A', 'scheduled'),
  ('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', current_date + 41, '08:00', '16:00', 'Edgewater Marina, Dock A', 'scheduled'),

  -- ASA 101 Evening Series (c002) — 4 weekly evenings; first inside the 14-day low-enrollment lead window
  ('d1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', current_date + 5, '18:00', '21:00', 'Edgewater Marina, Dock B', 'scheduled'),
  ('d1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000002', current_date + 12, '18:00', '21:00', 'Edgewater Marina, Dock B', 'scheduled'),
  ('d1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000002', current_date + 19, '18:00', '21:00', 'Edgewater Marina, Dock B', 'scheduled'),
  ('d1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000002', current_date + 26, '18:00', '21:00', 'Edgewater Marina, Dock B', 'scheduled'),

  -- ASA 103 (c003) — no sessions yet

  -- ASA 101 April Weekend (c004) — completed; sessions in the past
  ('d1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000004', current_date - 80, '08:00', '16:00', 'Edgewater Marina, Dock A', 'completed'),
  ('d1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000004', current_date - 79, '08:00', '16:00', 'Edgewater Marina, Dock A', 'completed'),

  -- Dinghy Sailing for Adults (c005) — draft, one session planned
  ('d1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000005', current_date + 10, '10:00', '14:00', null, 'scheduled'),

  -- Open Sailing (c006) — 5 weekly upcoming evenings
  ('d1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000006', current_date + 7, '17:30', '21:00', 'Edgewater Marina, North Wall', 'scheduled'),
  ('d1000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000006', current_date + 14, '17:30', '21:00', 'Edgewater Marina, North Wall', 'scheduled'),
  ('d1000000-0000-0000-0000-000000000012', 'c1000000-0000-0000-0000-000000000006', current_date + 21, '17:30', '21:00', 'Edgewater Marina, North Wall', 'scheduled'),
  ('d1000000-0000-0000-0000-000000000013', 'c1000000-0000-0000-0000-000000000006', current_date + 28, '17:30', '21:00', 'Edgewater Marina, North Wall', 'scheduled'),
  ('d1000000-0000-0000-0000-000000000014', 'c1000000-0000-0000-0000-000000000006', current_date + 35, '17:30', '21:00', 'Edgewater Marina, North Wall', 'scheduled');

-- ============================================================
-- ENROLLMENTS
-- ============================================================

INSERT INTO enrollments (id, course_id, student_id, status) VALUES

  -- Sam in ASA 101 Weekend May — confirmed
  ('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000005', 'confirmed'),

  -- Alex in ASA 101 Weekend May — registered/pending (shows in admin dashboard alert)
  ('e1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000006', 'registered'),

  -- Sam in ASA 101 Evening Series May — confirmed
  ('e1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000005', 'confirmed'),

  -- Sam in ASA 101 April (completed course) — completed
  ('e1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000005', 'completed'),

  -- Jordan in ASA 101 April (completed course) — completed
  ('e1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000007', 'completed'),

  -- Chris in Open Sailing July — registered (dual-role demo: Chris is also a student)
  ('e1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000004', 'registered');

-- ============================================================
-- SESSION ATTENDANCE
-- ============================================================

INSERT INTO session_attendance (session_id, enrollment_id, status) VALUES

  -- Sam in ASA 101 Weekend May (e001) — both sessions expected
  ('d1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'expected'),
  ('d1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'expected'),

  -- Alex in ASA 101 Weekend May (e002) — both sessions expected
  ('d1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000002', 'expected'),
  ('d1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000002', 'expected'),

  -- Sam in ASA 101 Evening Series May (e003) — all 4 sessions expected
  ('d1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000003', 'expected'),
  ('d1000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000003', 'expected'),
  ('d1000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000003', 'expected'),
  ('d1000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000003', 'expected'),

  -- Sam in ASA 101 April (e004) — attended both completed sessions
  ('d1000000-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000004', 'attended'),
  ('d1000000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000004', 'attended'),

  -- Jordan in ASA 101 April (e005) — attended Day 1, missed Day 2
  ('d1000000-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000005', 'attended'),
  ('d1000000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000005', 'missed'),

  -- Chris in Open Sailing July (e006) — all 5 sessions expected
  ('d1000000-0000-0000-0000-000000000010', 'e1000000-0000-0000-0000-000000000006', 'expected'),
  ('d1000000-0000-0000-0000-000000000011', 'e1000000-0000-0000-0000-000000000006', 'expected'),
  ('d1000000-0000-0000-0000-000000000012', 'e1000000-0000-0000-0000-000000000006', 'expected'),
  ('d1000000-0000-0000-0000-000000000013', 'e1000000-0000-0000-0000-000000000006', 'expected'),
  ('d1000000-0000-0000-0000-000000000014', 'e1000000-0000-0000-0000-000000000006', 'expected');

-- ============================================================
-- QUICK REFERENCE
-- ============================================================
-- Logins (all password: qwert12345)
--   andy@ltsc.test   → admin
--   mike@ltsc.test   → instructor (ASA 101 Weekend Intensive + April + Open Sailing)
--   lisa@ltsc.test   → instructor (Dinghy draft, unassigned otherwise)
--   chris@ltsc.test  → instructor + student (teaches Evening Series, enrolled in Open Sailing)
--   sam@ltsc.test    → student (confirmed in Weekend Intensive + Evening Series, completed April)
--   alex@ltsc.test   → student (pending/registered in Weekend Intensive — shows in admin alert)
--   jordan@ltsc.test → student (no current enrollments — use for live demo enrollment)
--
-- Courses (session dates relative to load date — current_date offsets)
--   c001  ASA 101 Weekend Intensive  active    2/4  Mike    upcoming Sat/Sun pair (+40/+41d)
--   c002  ASA 101 Evening Series     active    1/4  Chris   4 weekly evenings, first +5d (starting-soon)
--   c003  ASA 103 Coastal Cruising   active    0/4  NONE    no sessions yet
--   c004  ASA 101 April Weekend      completed 2/4  Mike    past weekend, -80/-79d (history)
--   c005  Dinghy Sailing for Adults  draft     0/6  Lisa    +10d (not visible to students)
--   c006  Open Sailing               active    1/8  Mike    5 weekly evenings, +7..+35d @ 17:30
--
-- Sessions (offsets from current_date)
--   d001-d002  c001 Weekend Intensive (+40, +41)
--   d003-d006  c002 Evening Series (+5, +12, +19, +26)
--   d007-d008  c004 April completed (-80, -79)
--   d009       c005 Dinghy draft (+10)
--   d010-d014  c006 Open Sailing (+7, +14, +21, +28, +35)
--
-- Enrollments
--   e001  Sam  → c001 (confirmed)
--   e002  Alex → c001 (registered/pending — shows in admin alert)
--   e003  Sam  → c002 (confirmed)
--   e004  Sam  → c004 (completed)
--   e005  Jordan → c004 (completed)
--   e006  Chris → c006 (registered — dual-role student enrollment)
--
-- Attendance
--   Sam c001: 2 expected
--   Alex c001: 2 expected
--   Sam c002: 4 expected
--   Sam c004: 2 attended (completed)
--   Jordan c004: day 1 attended, day 2 missed (realistic history)
--   Chris c006: 5 expected (Open Sailing)
