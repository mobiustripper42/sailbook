SET search_path TO public;

-- SailBook Seed Data
-- Demo data for local development + Playwright test users.
-- Runs automatically on `supabase db reset`.
-- All users share password: qwert12345
--
-- DEMO USERS (for walkthrough / manual testing)
--   andy@ltsc.test    — admin
--   mike@ltsc.test    — instructor
--   lisa@ltsc.test    — instructor
--   chris@ltsc.test   — instructor + student (dual-role demo)
--   sam@ltsc.test     — student, confirmed enrollments
--   alex@ltsc.test    — student, pending enrollment (shows in admin alert)
--   jordan@ltsc.test  — student, not enrolled (use for live demo enrollment)
--
-- PLAYWRIGHT TEST USERS (for automated tests — do not use manually)
--   pw_admin@ltsc.test      — admin only
--   pw_instructor@ltsc.test — instructor only
--   pw_student@ltsc.test    — student only

-- ============================================================
-- USERS (auth.users + auth.identities + profiles)
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
   extensions.crypt('qwert12345', extensions.gen_salt('bf')), now(),
   '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"first_name":"Andy","last_name":"Kaminski","is_admin":true,"is_instructor":false,"is_student":false}',
   now(), now()),

  -- Instructor Mike
  ('a1000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'mike@ltsc.test',
   extensions.crypt('qwert12345', extensions.gen_salt('bf')), now(),
   '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"first_name":"Mike","last_name":"Theriault","is_admin":false,"is_instructor":true,"is_student":false}',
   now(), now()),

  -- Instructor Lisa
  ('a1000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'lisa@ltsc.test',
   extensions.crypt('qwert12345', extensions.gen_salt('bf')), now(),
   '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"first_name":"Lisa","last_name":"Chen","is_admin":false,"is_instructor":true,"is_student":false}',
   now(), now()),

  -- Chris Marino — instructor + student (dual-role demo)
  ('a1000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'chris@ltsc.test',
   extensions.crypt('qwert12345', extensions.gen_salt('bf')), now(),
   '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"first_name":"Chris","last_name":"Marino","is_admin":false,"is_instructor":true,"is_student":true}',
   now(), now()),

  -- Student Sam — confirmed enrollments, attended April course
  ('a1000000-0000-0000-0000-000000000005',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'sam@ltsc.test',
   extensions.crypt('qwert12345', extensions.gen_salt('bf')), now(),
   '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"first_name":"Sam","last_name":"Davies","is_admin":false,"is_instructor":false,"is_student":true}',
   now(), now()),

  -- Student Alex — pending enrollment (shows in admin alert)
  ('a1000000-0000-0000-0000-000000000006',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'alex@ltsc.test',
   extensions.crypt('qwert12345', extensions.gen_salt('bf')), now(),
   '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"first_name":"Alex","last_name":"Rivera","is_admin":false,"is_instructor":false,"is_student":true}',
   now(), now()),

  -- Student Jordan — not enrolled (use for live demo enrollment)
  ('a1000000-0000-0000-0000-000000000007',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'jordan@ltsc.test',
   extensions.crypt('qwert12345', extensions.gen_salt('bf')), now(),
   '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"first_name":"Jordan","last_name":"Park","is_admin":false,"is_instructor":false,"is_student":true}',
   now(), now()),

  -- Playwright: admin test user
  ('f1000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'pw_admin@ltsc.test',
   extensions.crypt('qwert12345', extensions.gen_salt('bf')), now(),
   '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"first_name":"PW","last_name":"Admin","is_admin":true,"is_instructor":false,"is_student":false}',
   now(), now()),

  -- Playwright: instructor test user
  ('f1000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'pw_instructor@ltsc.test',
   extensions.crypt('qwert12345', extensions.gen_salt('bf')), now(),
   '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"first_name":"PW","last_name":"Instructor","is_admin":false,"is_instructor":true,"is_student":false}',
   now(), now()),

  -- Playwright: student test user
  ('f1000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'pw_student@ltsc.test',
   extensions.crypt('qwert12345', extensions.gen_salt('bf')), now(),
   '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"first_name":"PW","last_name":"Student","is_admin":false,"is_instructor":false,"is_student":true}',
   now(), now()),

  -- Playwright: second student test user (for multi-student capacity tests)
  ('f1000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'pw_student2@ltsc.test',
   extensions.crypt('qwert12345', extensions.gen_salt('bf')), now(),
   '', '', '', '', '', '',
   '{"provider":"email","providers":["email"]}',
   '{"first_name":"PW","last_name":"Student2","is_admin":false,"is_instructor":false,"is_student":true}',
   now(), now());

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES
  ('a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','andy@ltsc.test',         '{"sub":"a1000000-0000-0000-0000-000000000001","email":"andy@ltsc.test"}',         'email',now(),now(),now()),
  ('a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000002','mike@ltsc.test',         '{"sub":"a1000000-0000-0000-0000-000000000002","email":"mike@ltsc.test"}',         'email',now(),now(),now()),
  ('a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000003','lisa@ltsc.test',         '{"sub":"a1000000-0000-0000-0000-000000000003","email":"lisa@ltsc.test"}',         'email',now(),now(),now()),
  ('a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000004','chris@ltsc.test',        '{"sub":"a1000000-0000-0000-0000-000000000004","email":"chris@ltsc.test"}',        'email',now(),now(),now()),
  ('a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000005','sam@ltsc.test',          '{"sub":"a1000000-0000-0000-0000-000000000005","email":"sam@ltsc.test"}',          'email',now(),now(),now()),
  ('a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000006','alex@ltsc.test',         '{"sub":"a1000000-0000-0000-0000-000000000006","email":"alex@ltsc.test"}',         'email',now(),now(),now()),
  ('a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000007','jordan@ltsc.test',       '{"sub":"a1000000-0000-0000-0000-000000000007","email":"jordan@ltsc.test"}',       'email',now(),now(),now()),
  ('f1000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000001','pw_admin@ltsc.test',     '{"sub":"f1000000-0000-0000-0000-000000000001","email":"pw_admin@ltsc.test"}',     'email',now(),now(),now()),
  ('f1000000-0000-0000-0000-000000000002','f1000000-0000-0000-0000-000000000002','pw_instructor@ltsc.test','{"sub":"f1000000-0000-0000-0000-000000000002","email":"pw_instructor@ltsc.test"}','email',now(),now(),now()),
  ('f1000000-0000-0000-0000-000000000003','f1000000-0000-0000-0000-000000000003','pw_student@ltsc.test',   '{"sub":"f1000000-0000-0000-0000-000000000003","email":"pw_student@ltsc.test"}',   'email',now(),now(),now()),
  ('f1000000-0000-0000-0000-000000000004','f1000000-0000-0000-0000-000000000004','pw_student2@ltsc.test',  '{"sub":"f1000000-0000-0000-0000-000000000004","email":"pw_student2@ltsc.test"}',  'email',now(),now(),now());

-- All seed users share Eric's phone number — every notification triggered in
-- dev fires an SMS to him, which is the smoke test built into the seed data.
-- Replace with per-user numbers if you ever need to tell who got the SMS.
INSERT INTO public.profiles (id, email, first_name, last_name, phone, is_admin, is_instructor, is_student, experience_level, asa_number, theme_preference) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'andy@ltsc.test',         'Andy',   'Kaminski',   '+14403631199', true,  false, false, null,           null,     'dark'),
  ('a1000000-0000-0000-0000-000000000002', 'mike@ltsc.test',         'Mike',   'Theriault',  '+14403631199', false, true,  false, null,           null,     'dark'),
  ('a1000000-0000-0000-0000-000000000003', 'lisa@ltsc.test',         'Lisa',   'Chen',       '+14403631199', false, true,  false, null,           null,     'dark'),
  ('a1000000-0000-0000-0000-000000000004', 'chris@ltsc.test',        'Chris',  'Marino',     '+14403631199', false, true,  true,  'intermediate', null,     'dark'),
  ('a1000000-0000-0000-0000-000000000005', 'sam@ltsc.test',          'Sam',    'Davies',     '+14403631199', false, false, true,  'beginner',     '101234', 'dark'),
  ('a1000000-0000-0000-0000-000000000006', 'alex@ltsc.test',         'Alex',   'Rivera',     '+14403631199', false, false, true,  'beginner',     null,     'dark'),
  ('a1000000-0000-0000-0000-000000000007', 'jordan@ltsc.test',       'Jordan', 'Park',       '+14403631199', false, false, true,  null,           null,     'dark'),
  ('f1000000-0000-0000-0000-000000000001', 'pw_admin@ltsc.test',     'PW',     'Admin',      '+14403631199', true,  false, false, null,           null,     'dark'),
  ('f1000000-0000-0000-0000-000000000002', 'pw_instructor@ltsc.test','PW',     'Instructor', '+14403631199', false, true,  false, null,           null,     'dark'),
  ('f1000000-0000-0000-0000-000000000003', 'pw_student@ltsc.test',   'PW',     'Student',    '+14403631199', false, false, true,  null,           null,     'dark'),
  ('f1000000-0000-0000-0000-000000000004', 'pw_student2@ltsc.test',  'PW',     'Student2',   '+14403631199', false, false, true,  null,           null,     'dark');

-- ============================================================
-- CODES (lookup/dropdown values)
-- ============================================================

INSERT INTO public.codes (category, value, label, description, sort_order) VALUES
  ('experience_level', 'beginner',     'Beginner',     'Little or no sailing experience',          10),
  ('experience_level', 'intermediate', 'Intermediate', 'Some sailing experience',                  20),
  ('experience_level', 'advanced',     'Advanced',               'Confident on the water',                  30)
ON CONFLICT (category, value) DO NOTHING;

-- ============================================================
-- COURSE TYPES
-- ============================================================

INSERT INTO public.course_types (id, name, short_code, certification_body, description, min_hours, max_students, is_active) VALUES
  ('b1000000-0000-0000-0000-000000000001',
   'ASA 101 - Basic Keelboat Sailing', 'ASA101', 'ASA',
   'Foundation keelboat course. Covers points of sail, basic maneuvers, and docking.',
   16, 4, true),

  ('b1000000-0000-0000-0000-000000000002',
   'ASA 103 - Basic Coastal Cruising', 'ASA103', 'ASA',
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

INSERT INTO public.courses (id, course_type_id, instructor_id, title, capacity, price, status, notes, created_by) VALUES

  -- ASA 101 Weekend May — active, Mike, 2 enrolled (Sam confirmed, Alex pending)
  ('c1000000-0000-0000-0000-000000000001',
   'b1000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000002',
   'ASA 101 - Weekend Intensive (May)',
   4, 450.00, 'active', null,
   'a1000000-0000-0000-0000-000000000001'),

  -- ASA 101 Evening Series May — active, Chris, 1 enrolled (Sam confirmed)
  ('c1000000-0000-0000-0000-000000000002',
   'b1000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000004',
   'ASA 101 - Evening Series (May)',
   4, 400.00, 'active', null,
   'a1000000-0000-0000-0000-000000000001'),

  -- ASA 103 Coastal June — active, NO instructor (triggers admin warning tile)
  ('c1000000-0000-0000-0000-000000000003',
   'b1000000-0000-0000-0000-000000000002',
   null,
   'ASA 103 - Coastal Cruising (June)',
   4, 650.00, 'active', 'Need to assign instructor before scheduling sessions.',
   'a1000000-0000-0000-0000-000000000001'),

  -- ASA 101 April Weekend — completed, Mike, Sam + Jordan attended
  ('c1000000-0000-0000-0000-000000000004',
   'b1000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000002',
   'ASA 101 - Weekend (April)',
   4, 450.00, 'completed', null,
   'a1000000-0000-0000-0000-000000000001'),

  -- Dinghy Sailing for Adults — draft, Lisa (not visible to students)
  ('c1000000-0000-0000-0000-000000000005',
   'b1000000-0000-0000-0000-000000000003',
   'a1000000-0000-0000-0000-000000000003',
   'Dinghy Sailing for Adults',
   6, 150.00, 'draft', 'Placeholder for summer dinghy program.',
   'a1000000-0000-0000-0000-000000000001'),

  -- Open Sailing — one course per Wednesday (drop-in model, single session each).
  -- Mike instructs all five. Chris is enrolled as a student in the Jul 1 course (dual-role demo).
  ('c1000000-0000-0000-0000-000000000006',
   'b1000000-0000-0000-0000-000000000004',
   'a1000000-0000-0000-0000-000000000002',
   'Open Sailing - Jul 1',
   8, 65.00, 'active', null,
   'a1000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-000000000007',
   'b1000000-0000-0000-0000-000000000004',
   'a1000000-0000-0000-0000-000000000002',
   'Open Sailing - Jul 8',
   8, 65.00, 'active', null,
   'a1000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-000000000008',
   'b1000000-0000-0000-0000-000000000004',
   'a1000000-0000-0000-0000-000000000002',
   'Open Sailing - Jul 15',
   8, 65.00, 'active', null,
   'a1000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-000000000009',
   'b1000000-0000-0000-0000-000000000004',
   'a1000000-0000-0000-0000-000000000002',
   'Open Sailing - Jul 22',
   8, 65.00, 'active', null,
   'a1000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-000000000010',
   'b1000000-0000-0000-0000-000000000004',
   'a1000000-0000-0000-0000-000000000002',
   'Open Sailing - Jul 29',
   8, 65.00, 'active', null,
   'a1000000-0000-0000-0000-000000000001');

-- ============================================================
-- SESSIONS
-- ============================================================

INSERT INTO public.sessions (id, course_id, date, start_time, end_time, location, status) VALUES

  -- ASA 101 Weekend May (c001) — Sat/Sun May 9–10
  ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', '2026-05-09', '08:00', '16:00', 'Edgewater Marina, Dock A', 'scheduled'),
  ('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', '2026-05-10', '08:00', '16:00', 'Edgewater Marina, Dock A', 'scheduled'),

  -- ASA 101 Evening Series May (c002) — 4 Wednesday evenings
  ('d1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', '2026-05-06', '18:00', '21:00', 'Edgewater Marina, Dock B', 'scheduled'),
  ('d1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000002', '2026-05-13', '18:00', '21:00', 'Edgewater Marina, Dock B', 'scheduled'),
  ('d1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000002', '2026-05-20', '18:00', '21:00', 'Edgewater Marina, Dock B', 'scheduled'),
  ('d1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000002', '2026-05-27', '18:00', '21:00', 'Edgewater Marina, Dock B', 'scheduled'),

  -- ASA 103 (c003) — no sessions yet

  -- ASA 101 April Weekend (c004) — completed, Apr 4–5
  ('d1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000004', '2026-04-04', '08:00', '16:00', 'Edgewater Marina, Dock A', 'completed'),
  ('d1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000004', '2026-04-05', '08:00', '16:00', 'Edgewater Marina, Dock A', 'completed'),

  -- Dinghy Sailing for Adults (c005) — draft, one session planned
  ('d1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000005', '2026-06-06', '10:00', '14:00', null, 'scheduled'),

  -- Open Sailing — one session per course (c006–c010), each its own Wednesday evening
  ('d1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000006', '2026-07-01', '17:30', '21:00', 'Edgewater Marina, North Wall', 'scheduled'),
  ('d1000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000007', '2026-07-08', '17:30', '21:00', 'Edgewater Marina, North Wall', 'scheduled'),
  ('d1000000-0000-0000-0000-000000000012', 'c1000000-0000-0000-0000-000000000008', '2026-07-15', '17:30', '21:00', 'Edgewater Marina, North Wall', 'scheduled'),
  ('d1000000-0000-0000-0000-000000000013', 'c1000000-0000-0000-0000-000000000009', '2026-07-22', '17:30', '21:00', 'Edgewater Marina, North Wall', 'scheduled'),
  ('d1000000-0000-0000-0000-000000000014', 'c1000000-0000-0000-0000-000000000010', '2026-07-29', '17:30', '21:00', 'Edgewater Marina, North Wall', 'scheduled');

-- ============================================================
-- ENROLLMENTS
-- ============================================================

INSERT INTO public.enrollments (id, course_id, student_id, status) VALUES

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

  -- Chris in Open Sailing — Jul 1 — registered (dual-role demo: Chris is also a student)
  ('e1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000004', 'registered');

-- ============================================================
-- SESSION ATTENDANCE
-- ============================================================

INSERT INTO public.session_attendance (session_id, enrollment_id, status) VALUES

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

  -- Chris in Open Sailing Jul 1 (e006) — single session expected
  ('d1000000-0000-0000-0000-000000000010', 'e1000000-0000-0000-0000-000000000006', 'expected');

-- ============================================================
-- QUICK REFERENCE
-- ============================================================
-- Logins (all password: qwert12345)
--   andy@ltsc.test          → admin
--   mike@ltsc.test          → instructor (ASA 101 Weekend + April + all 5 Open Sailing weeks)
--   lisa@ltsc.test          → instructor (Dinghy draft, unassigned otherwise)
--   chris@ltsc.test         → instructor + student (teaches Evening Series, enrolled in Open Sailing — Jul 1)
--   sam@ltsc.test           → student (confirmed in Weekend May + Evening May, completed April)
--   alex@ltsc.test          → student (pending/registered in Weekend May — shows in admin alert)
--   jordan@ltsc.test        → student (no current enrollments — use for live demo enrollment)
--   pw_admin@ltsc.test      → Playwright admin test user
--   pw_instructor@ltsc.test → Playwright instructor test user
--   pw_student@ltsc.test    → Playwright student test user
--   pw_student2@ltsc.test   → Playwright second student (multi-student capacity tests)
--
-- Playwright UUIDs (f1 block)
--   f1000000-0000-0000-0000-000000000001  pw_admin
--   f1000000-0000-0000-0000-000000000002  pw_instructor
--   f1000000-0000-0000-0000-000000000003  pw_student
--   f1000000-0000-0000-0000-000000000004  pw_student2
