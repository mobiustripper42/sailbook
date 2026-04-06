# SailBook — QA Test Cases

Manual test cases by task. Prerequisites unless noted: seed data loaded, logged in as admin (andy@ltsc.test / qwert12345).

---

## Phase 3: Attendance & Cancellations

### 3.1 — Attendance page for admin

**Navigate to attendance**
- [ X] Go to `/admin/courses` → pick a course with enrolled students
- [ X] Each session row shows an "Attendance" button
- [ X] Click "Attendance" → page shows session date, time, location, instructor
- [ X] Breadcrumb link back to course works
- [ X] "Back to Course" button works

**Mark attendance**
- [ x] All enrolled (non-cancelled) students appear with status "Expected"
- [ x] Change one student to "Attended", another to "Missed" → "Unsaved changes" appears
- [x] Click "Save Attendance" → "Attendance saved." message appears
- [ x] Refresh page → statuses persist

**Quick-mark buttons**
- [ x] "All Attended" flips every dropdown to Attended
- [ x] "All Missed" flips every dropdown to Missed
- [ x] Save and refresh → statuses persist

**Edge cases**
- [ x] Course with no enrollments → "No enrolled students for this session."
- [ x] Cancelled enrollment student does NOT appear in the list
- [ x] Saving twice without changes → no error

### 3.2 — Auto-create attendance records on enrollment

**New enrollment**
- [x ] Log in as a student (e.g. dan@ltsc.test — zero enrollments)
- [x ] Enroll in a course with sessions (e.g. ASA 101 Weekend Intensive)
- [x ] Check `session_attendance` table → one row per session, all `status = 'expected'`, linked to the new enrollment ID

**Re-enrollment after cancellation**
- [x ] Log in as bob@ltsc.test (has cancelled enrollment in c001)
- [x ] Re-enroll in ASA 101 Weekend Intensive
- [x ] Check `session_attendance` → records upserted back to `expected` (not duplicated)

**Cancel enrollment cascade**
- [ ] As admin, cancel a student's enrollment from the course detail page
- [ ] Check `session_attendance` → all `expected` records for that enrollment flipped to `missed`
- [ ] Any `attended` or `excused` records are NOT changed

**Cancel course cascade**
- [x ] As admin, cancel an entire course (use course status actions)
- [x ] Check `session_attendance` → all `expected` records across all enrollments in that course flipped to `missed`

**Edge cases**
- [ ] Enroll in a course with zero sessions → enrollment succeeds, no attendance rows created
- [ ] Check that attendance records have correct `session_id` / `enrollment_id` foreign keys (no orphans)

### 3.3 — Cancel session flow

**Setup:** Use seed data as-is. ASA 101 Evening Series (c002) has 4 sessions with 4 enrolled students. First session (d003, May 6) has Alice marked as `attended`, everyone else `expected`.

**Cancel a session with reason**
- [ x] Go to `/admin/courses/<c002-id>` → sessions table
- [ x] Click "Cancel" on the May 6 session (d003)
- [ x] Browser prompt appears asking for reason → enter "weather"
- [ x] Session status badge changes to red "cancelled"
- [ x] Hover over the cancelled badge → tooltip shows "weather"
- [ x] "Attendance" button still visible for cancelled session (admin may need to review/correct)
- [ x] "Cancel" button is no longer shown for the cancelled session (Delete still visible)

**Attendance cascade**
- [ X] Check `session_attendance` for session d003:
  - Alice (e002) stays `attended` — was NOT flipped (already non-expected)
  - Bob (e003) flipped to `missed` (was `expected`)
  - Sarah (e004) flipped to `missed` (was `expected`)
  - Carol (e005) flipped to `missed` (was `expected`)

**Cancel a session without reason**
- [ X] Click "Cancel" on another scheduled session (e.g. May 13, d004)
- [ X] Leave reason blank (just press OK on the prompt)
- [ X] Session shows cancelled badge, no tooltip text
- [ X] All `expected` attendance records for that session flipped to `missed`

**Cancel prompt dismissed**
- [ X] Click "Cancel" on a scheduled session → press Cancel/Escape on the browser prompt
- [X ] Nothing happens — session stays `scheduled`, no attendance changed

**Attendance page for cancelled session**
- [ x] Click "Attendance" on the cancelled session (or navigate to `/admin/courses/<c002-id>/sessions/<d003-id>/attendance`)
- [ x] Red banner shows: "This session was cancelled: weather. Attendance records were marked as missed."
- [ x] Badge shows red "cancelled"
- [ x] Attendance form still renders and is editable (admin may need to correct records after cancellation)

**Edge cases**
- [ X] Cancel a session that has zero enrollments (use c003 — add a session first, then cancel it) → no errors
- [ X] Cancel a session where all students already have `attended` status → no records flipped, session still marked cancelled
- [ X] Delete a cancelled session → session is removed (hard delete works)

### 3.4 — Create makeup session flow

**Schedule makeup from cancelled session**
- [ x] Go to `/admin/courses` → pick a course with a cancelled session (e.g., Evening Series c002, session d003)
- [ x] Cancelled session row shows a "Schedule Makeup" button below it
- [ x] Click "Schedule Makeup" → inline form appears with date (empty), start/end time pre-filled from original, location pre-filled
- [ x] Enter a future date, adjust time/location if needed → click "Create Makeup"
- [ x] Redirects back to course detail page — new makeup session appears in the sessions table
- [ x] Makeup session has status "scheduled" and notes visible on its attendance page

**Attendance auto-creation for makeup**
- [ x] Navigate to the new makeup session's attendance page
- [ x] Students who had "missed" status on the cancelled session appear with "expected" status
- [ x] Students who had "attended" or "excused" on the cancelled session do NOT appear in the makeup

**Makeup linkage on original records**
- [X ] Check the cancelled session's attendance — missed records should now have `makeup_session_id` set (verify via Supabase dashboard or SQL: `select * from session_attendance where session_id = '<cancelled-session-id>'`)

**Edge cases**
- [X ] Cancel a session with zero enrollments → "Schedule Makeup" still appears, creates empty session (no attendance records)
- [ X] Cancel a session where all students were "attended" → makeup creates session with no attendance records (no one was missed)
- [ X] Create a second makeup for the same cancelled session → only unlinked missed students get assigned (students already linked to first makeup are skipped)
- [ X] Makeup form cancel button collapses the form without creating anything

### 3.7 — Admin view: students with outstanding missed sessions

**Navigate to missed sessions**
- [x ] Sidebar shows "Missed Sessions" link
- [x ] Click it → `/admin/missed-sessions` loads with page title and subtitle
- [x ] Page shows student cards grouped by student, sorted by most missed first

**Verify correct records shown**
- [x ] Only `status = 'missed'` records with `makeup_session_id IS NULL` appear
- [x ] Students with missed sessions that HAVE a makeup linked do NOT appear
- [x ] Students with `attended` or `excused` status do NOT appear

**Card content**
- [x ] Each card shows student name, email, and a badge with missed count
- [x ] Each missed session row shows course name, date, time range, and location
- [x ] Student name links to `/admin/students/<id>/edit`
- [x ] Course name links to `/admin/courses/<id>`
- [x ] "View attendance" links to the correct attendance page for that session

**Empty state**
- [X ] Mark all missed sessions as attended (or assign makeups) → page shows "No outstanding missed sessions. Everyone's accounted for."

**After scheduling a makeup**
- [X ] From a course, schedule a makeup for a cancelled session
- [x ] Return to `/admin/missed-sessions` → students linked to that makeup no longer appear (or their count decreases)

**Summary line**
- [x ] Summary text shows correct count: "X missed sessions across Y students"
- [x ] Singular/plural is correct for 1 session / 1 student

### 3.8 — Student view: attendance history + missed sessions needing makeup

**Prerequisites:** Seed data loaded. Test with multiple student logins.

**Navigate to attendance**
- [X ] Log in as alice@ltsc.test → sidebar shows "Attendance" link
- [x ] Click "Attendance" → `/student/attendance` loads with title and subtitle
- [x ] Page grouped by course, each course in its own card

**Alice (mixed statuses, no missed needing makeup)**
- [x ] Shows 2 course cards: ASA 101 Weekend Intensive, ASA 101 Evening Series
- [x ] Weekend Intensive (c001): 2 sessions, both showing "Upcoming" badge
- [x ] Evening Series (c002): 4 sessions — d003 shows "Attended" badge, d004–d006 show "Upcoming"
- [x ] Cancelled session (d003) shows date with strikethrough + "Cancelled" badge
- [x ] No alert banner at top (Alice has no missed sessions needing makeup)
- [x ] No "needs makeup" badges on any course card

**Bob (missed sessions needing makeup + cancelled enrollment)**
- [ X] Log in as bob@ltsc.test → go to `/student/attendance`
- [ x] Alert banner appears: "You have X missed sessions that need a makeup..."
- [ x] Evening Series (c002): d003 shows "Missed" badge + "Needs makeup" text, d004–d006 show "Upcoming"
- [ x] Course card has red badge showing missed count needing makeup
- [ x] **Edge case:** Check whether cancelled enrollment (c001) attendance shows — Bob has 2 missed records from cancelled enrollment e006. Note behavior for follow-up.

**Carol (missed session with makeup scheduled)**
- [ ] Log in as carol@ltsc.test → go to `/student/attendance`
- [ ] No alert banner (Carol's missed session has a makeup linked)
- [ ] Evening Series (c002): d003 shows "Missed" + "Makeup scheduled", rest show "Upcoming"
- [ ] No "needs makeup" badge on course card

**Sarah (excused, instructor+student)**
- [ x] Log in as sarah@ltsc.test → go to `/student/attendance`
- [ x] Evening Series (c002): d003 shows "Excused" badge (not "Missed")
- [ x] No alert banner (excused is not "missed needing makeup")

**Dan (no enrollments — empty state)**
- [ x] Log in as dan@ltsc.test → go to `/student/attendance`
- [ x] Shows "No attendance records yet. Enroll in a course to get started."

**Eve (completed course, all attended)**
- [ x] Log in as eve@ltsc.test → go to `/student/attendance`
- [ x] ASA 101 March (c006): 2 sessions, both showing "Attended" badge
- [ x] No alert banner, no missed badges

**Session details**
- [ x] Each session row shows formatted date (e.g. "May 6"), time range, and location
- [ x] Sessions within a course sorted by date ascending
- [ x] Courses with missed sessions sort before courses without

**Plural/singular**
- [ x] Badge: "1 needs makeup" vs "2 need makeup"
- [ x] Alert: "1 missed session that needs" vs "2 missed sessions that need"

**After admin schedules a makeup**
- [ x] Admin schedules makeup for d003 (links to Bob/Carol)
- [ x] Bob/Carol reload `/student/attendance` → missed session now shows "Makeup scheduled" instead of "Needs makeup"
- [ x] Alert banner count decreases (or disappears if all resolved)

### 3.9 — RLS policies for session_attendance table

**Prerequisites:** Run `docs/migrations/008_rls_session_attendance.sql` in Supabase SQL Editor. Seed data loaded.

**Admin access (andy@ltsc.test)**
- [x ] Go to any course → session → attendance page → student list loads normally
- [x ] Mark a student as "Attended" → save → persists (admin has write access)
- [ x] Go to `/admin/missed-sessions` → all missed records across all students load

**Student read — own attendance only (alice@ltsc.test)**
- [x] Go to `/student/attendance` → shows Alice's attendance records grouped by course
- [x ] Records match what's in the database for Alice's enrollments
- [x ] No records from other students leak through (verify: Alice should NOT see Bob's or Carol's attendance)

**Student read — another student (bob@ltsc.test)**
- [ x] Log in as bob@ltsc.test → `/student/attendance` → shows only Bob's records
- [ x] Bob sees his missed sessions, not Alice's or Carol's

**Instructor read — own courses (sarah@ltsc.test)**
- [x ] Sarah is instructor on Evening Series (c002) → her session queries should return attendance for c002 sessions
- [x ] If Sarah navigates to a page that queries attendance (Phase 4 will add this), records load for her assigned courses only

**Student cannot write attendance**
- [x] Verified via `pg_policies`: student policy is SELECT only — INSERT/UPDATE/DELETE denied by definition
- [x] No student UI exposes write operations on session_attendance

**Instructor cannot write attendance**
- [x] Verified via `pg_policies`: instructor policy is SELECT only — INSERT/UPDATE/DELETE denied by definition
- [x] No instructor UI exposes write operations on session_attendance (admin marks attendance via admin-only policy)

**Cross-student isolation**
- [x] Service role: `SELECT count(*) FROM session_attendance` → 22 total records
- [x] Alice's helper: `get_student_enrollment_ids(alice)` → 6 records (e001: 2 + e002: 4)
- [x] Difference confirms RLS filtering works correctly

**Edge cases**
- [x] Dan (zero enrollments): `get_student_enrollment_ids(dan)` → 0 records, no errors
- [x] Bob (cancelled enrollment e006 for c001): `get_student_enrollment_ids(bob)` → 6 records (e003: 4 + e006: 2) — cancelled enrollment attendance still readable

### 3.10 — Student course view: session status + attendance indicators

**Prerequisites:** Seed data loaded.

**Cancelled session styling (Alice → c002)**
- Login: `alice@ltsc.test`
- Navigate: Student Courses → "ASA 101 — Evening Series"
- [X ] Schedule table has **Status** and **Attendance** columns
- [X ] May 6 row is dimmed (opacity), date has strikethrough, shows **"Cancelled"** outline badge
- [X ] May 13, 20, 27 rows are normal styling, Status column is empty
- [X ] Sessions count in stats shows **"4 (1 cancelled)"**

**Attendance badges — mixed statuses (Alice → c002)**
Same page as above:
- [X ] May 6 (cancelled session): **"Attended"** badge (default/dark variant) — Alice attended before cancel
- [X ] May 13, 20, 27: **"Upcoming"** outline badges
- [X ] No "Needs makeup" text on any row (Alice isn't missed)

**Needs makeup indicator (Bob → c002)**
- Login: `bob@ltsc.test`
- Navigate: Student Courses → "ASA 101 — Evening Series"
- [X ] May 6: **"Missed"** destructive badge + **"Needs makeup"** red text
- [X ] May 13, 20, 27: **"Upcoming"** outline badges

**No attendance column when not enrolled (Dan → c001)**
- Login: `dan@ltsc.test`
- Navigate: Student Courses → "ASA 101 — Weekend Intensive"
- [X ] Schedule table shows Date, Time, Location, Status — **no Attendance column**
- [X ] Enroll button visible at bottom

**All-expected, no cancelled sessions (Alice → c001)**
- Login: `alice@ltsc.test`
- Navigate: Student Courses → "ASA 101 — Weekend Intensive"
- [X ] Both sessions show **"Upcoming"** outline badges in Attendance column
- [X ] Status column is empty for both rows (both scheduled)
- [X ] Sessions count shows **"2"** with no cancelled note
- [X ] "Enrolled" badge at bottom

**Excused status preserved (Sarah → c002)**
- Login: `sarah@ltsc.test`
- Navigate: Student Courses → "ASA 101 — Evening Series"
- [X] May 6: **"Excused"** secondary badge (no "Needs makeup" text)
- [X ] May 13, 20, 27: **"Upcoming"** outline badges

**Completed course 404 (Eve)**
- Login: `eve@ltsc.test`
- Note: c006 is `status: 'completed'` — page filters on `status: 'active'`, so navigating to it should **404**

**RLS — student cannot write attendance**
Run in Supabase SQL Editor (see SQL below):
- [X ] UPDATE own attendance → 0 rows updated
- [X ] INSERT fake attendance → denied by RLS

```sql
-- Impersonate Alice
SET request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-000000000004","role":"authenticated","email":"alice@ltsc.test"}';
SET role = 'authenticated';

-- Try to flip her own attendance from expected to attended (should be denied)
UPDATE session_attendance
SET status = 'attended'
WHERE session_id = 'd0000000-0000-0000-0000-000000000004'
  AND enrollment_id = 'e0000000-0000-0000-0000-000000000002';
-- Expected: 0 rows updated (students have SELECT only)

-- Try to insert a fake attendance record (should be denied)
INSERT INTO session_attendance (session_id, enrollment_id, status)
VALUES ('d0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'attended');
-- Expected: denied by RLS policy

-- Reset
RESET role;
RESET request.jwt.claims;
```

---

## Phase 4: Instructor Views

### 4.1 — Instructor dashboard

**Prerequisites:** Seed data loaded. Two instructor logins: dave@ltsc.test (courses c001, c004, c005, c006) and sarah@ltsc.test (course c002). Password: qwert12345.

**Dave's dashboard (dave@ltsc.test)**
- [X ] Log in as dave@ltsc.test → redirects to `/instructor/dashboard`
- [X ] Welcome message: "Welcome back, Dave."
- [X ] Subtitle: "Your upcoming schedule."

**Dave's stat cards**
- [X] Active Courses: **1** (c001 Weekend Intensive — c004 Dinghy is draft, excluded)
- [X ] Upcoming Sessions: **2** (d001 May 9, d002 May 10)
- [X ] Total Students: **1** (Alice in c001 — Bob's cancelled enrollment excluded)

**Dave's upcoming sessions list**
- [X ] 2 session rows displayed, sorted by date
- [X ] Row 1: "ASA 101 — Weekend Intensive" · Saturday, May 9 · 8:00 AM – 4:00 PM · Edgewater Marina, Dock A · badge "1 / 4"
- [X ] Row 2: "ASA 101 — Weekend Intensive" · Sunday, May 10 · 8:00 AM – 4:00 PM · Edgewater Marina, Dock A · badge "1 / 4"
- [X ] Each row has "Roster →" link (will 404 until task 4.2 — just verify it renders)
- [X ] No Dinghy Sailing Intro row (c004 is draft, not shown)

**Sarah's dashboard (sarah@ltsc.test)**
- [X ] Log in as sarah@ltsc.test → `/instructor/dashboard`
- [X ] Welcome message: "Welcome back, Sarah."

**Sarah's stat cards**
- [ X] Active Courses: **1** (c002 Evening Series)
- [ X] Upcoming Sessions: **3** (d004 May 13, d005 May 20, d006 May 27 — d003 is cancelled, filtered out)
- [ X] Total Students: **4** (Alice, Bob, Sarah herself, Carol — all non-cancelled enrollments)

**Sarah's upcoming sessions list**
- [ X] 3 session rows, all "ASA 101 — Evening Series"
- [ X] Row 1: Wednesday, May 13 · 6:00 PM – 9:00 PM · Edgewater Marina, Dock B · badge "4 / 4"
- [ X] Row 2: Wednesday, May 20 · same time/location · badge "4 / 4"
- [ X] Row 3: Wednesday, May 27 · same time/location · badge "4 / 4"
- [ X] Cancelled session d003 (May 6) does NOT appear in the list

**Empty state**
- [X ] If an instructor has no upcoming scheduled sessions, shows: "No upcoming sessions assigned to you."
- [X ] (To test: temporarily remove Dave's instructor_id from courses, or use a fresh instructor account)

**Layout and navigation**
- [X ] Sidebar shows "SailBook" logo, "Instructor" subtitle, "Dashboard" nav link (active state)
- [X ] Instructor name displayed at bottom of sidebar
- [X ] "Sign out" link works — returns to login page

**Edge cases**
- [X ] Dave does NOT see c004 (Dinghy draft) sessions — dashboard filters to active courses only. Draft/cancelled/completed courses excluded.
- [X ] Sarah appears as her own student in Total Students count (she's enrolled in c002 via e004) — correct behavior, she is a student in that course.
- [X ] Cancelled enrollment (Bob's e006 in c001) is excluded from roster count and Total Students — verify badge shows "1 / 4" not "2 / 4" for c001 sessions.
- [X ] Non-instructor user (e.g. alice@ltsc.test) accessing `/instructor/dashboard` → middleware should redirect to student view

### 4.2 — Session roster view

**Prerequisites:** Seed data loaded. Instructor logins: sarah@ltsc.test (c002) and dave@ltsc.test (c001). Password: qwert12345.

**Navigate from dashboard (Sarah → c002 session d004)**
- [X ] Log in as sarah@ltsc.test → dashboard shows 3 upcoming sessions
- [X ] Click "Roster →" on the May 13 session (d004) → `/instructor/sessions/<d004-id>` loads
- [X ] Back link "← Back to dashboard" works

**Session header**
- [ X] Title: "ASA 101 — Evening Series"
- [ X] Date/time: "Wed, May 13 · 6:00pm – 9:00pm · Edgewater Marina, Dock B"
- [X ] Enrolled: "4 / 4"
- [X ] Status: "scheduled"

**Roster table — d004 (all expected)**
- [X ] 4 student rows: Instructor, Alice; Instructor, Sarah; Student, Bob; Student, Carol (sorted by enrollment created_at)
- [X ] All 4 show "Upcoming" outline badge (all attendance is `expected` for d004)
- [X ] Email column shows each student's email

**Roster table — d003 (cancelled, mixed attendance)**
- [X ] Navigate directly to `/instructor/sessions/<d003-id>` (cancelled session)
- [ X] "Cancelled" badge appears next to title
- [ X] Alice: "Attended" badge (default variant)
- [ X] Bob: "Missed" badge (destructive/red) + "Needs makeup" text
- [ X] Sarah: "Excused" badge (secondary variant)
- [ X] Carol: "Missed" badge + "Needs makeup" text

**Dave's roster — c001 session d001**
- [X] Log in as dave@ltsc.test → click "Roster →" on May 9 session
- [X ] 1 student row: Student, Alice — "Upcoming" badge
- [X ] Bob does NOT appear (his enrollment e006 is cancelled)
- [X ] Enrolled shows "1 / 4"

**Authorization — wrong instructor**
- [X ] As dave@ltsc.test, navigate to `/instructor/sessions/<d004-id>` (Sarah's session) → 404 page
- [X ] As alice@ltsc.test (student, not instructor), navigate to `/instructor/sessions/<d001-id>` → middleware redirects to student view

**Empty roster**
- [X ] If a session has zero active enrollments → shows "No students enrolled."

**Edge cases**
- [ X] Cancelled enrollment student (Bob in c001) excluded from roster — only active enrollments shown
- [ X] Sarah appears as a student in her own roster (she's enrolled in c002 via e004) — correct behavior
- [ X] Attendance with `makeup_session_id` set → shows "Makeup scheduled" instead of "Needs makeup" (test after admin schedules a makeup for d003)

### 4.3 — Identify makeup students in roster

**Prerequisites:** Seed data loaded (Carol's d003 attendance has `makeup_session_id = d004`). Login: sarah@ltsc.test / qwert12345.

**Makeup badge on roster (Sarah → d004)**
- [X ] Log in as sarah@ltsc.test → dashboard → click "Roster →" on May 13 session (d004)
- [X ] Carol's row shows "Makeup from Wednesday, May 6, 2026" badge (secondary/gray variant) next to her name
- [X ] Other students (Alice, Bob, Sarah) do NOT show a makeup badge
- [X ] Attendance column still works normally — all 4 students show "Upcoming" badge

**No makeup badges on other sessions**
- [X ] Navigate to d005 (May 20) roster → no makeup badges on any student
- [X ] Navigate to d006 (May 27) roster → no makeup badges on any student

**No false positives on cancelled session (d003)**
- [X ] Navigate to d003 (May 6, cancelled) roster → no "Makeup from..." badges on any student (d003 is not anyone's makeup destination)

**Edge cases**
- [X ] Session with no makeup students (d001/d002 in c001) → no badges, roster unchanged from 4.2
- [X ] Verify badge does not appear for students whose own attendance row has `makeup_session_id` (that means THEY missed and have a makeup elsewhere — different from attending HERE as a makeup)

### 4.4 — RLS policies for instructors

**Prerequisites:** Run `docs/migrations/009_rls_instructor_policies.sql` in Supabase SQL Editor. Seed data loaded.

**What changed:**
- `get_instructor_course_ids()` now includes courses where instructor has session-level assignment (not just course-level)
- Sessions policy now uses `get_instructor_session_ids()` helper (handles both assignment levels)
- Courses policy now uses `get_instructor_course_ids()` helper (handles both assignment levels)
- New policy: instructors can read student profiles for their courses (roster fix)

**Instructor can read their courses (dave@ltsc.test)**
- [X ] Log in as dave@ltsc.test → `/instructor/dashboard` loads normally
- [X ] Dashboard shows Dave's courses/sessions (same as 4.1 — no regression)

**Instructor can read roster with student profiles (sarah@ltsc.test)**
- [X ] Log in as sarah@ltsc.test → dashboard → click "Roster →" on May 13 (d004)
- [X ] Student names and emails load correctly (not null/blank) — this verifies the new profiles policy
- [X ] All 4 students visible: Alice, Bob, Sarah, Carol

**Instructor isolation — Dave cannot see Sarah's data**
- [X ] As dave@ltsc.test, navigate to `/instructor/sessions/<d004-id>` → 404 (Dave doesn't own c002)

**Instructor isolation — Sarah cannot see Dave's data**
- [X ] As sarah@ltsc.test, navigate to `/instructor/sessions/<d001-id>` → 404 (Sarah doesn't own c001)

**Student cannot see instructor-only data**
- [X] As alice@ltsc.test, navigate to `/instructor/dashboard` → middleware redirects away

**SQL verification — run in Supabase SQL Editor:**

```sql
-- ============================================================
-- TEST 1: Verify updated helper functions
-- ============================================================

-- get_instructor_course_ids for Dave (course-level: c001, c004, c005, c006)
SELECT get_instructor_course_ids('a0000000-0000-0000-0000-000000000002');
-- Expected: 4 rows (c001, c004, c005, c006)

-- get_instructor_course_ids for Sarah (course-level: c002)
SELECT get_instructor_course_ids('a0000000-0000-0000-0000-000000000003');
-- Expected: 1 row (c002)

-- get_instructor_session_ids for Dave
SELECT get_instructor_session_ids('a0000000-0000-0000-0000-000000000002');
-- Expected: 6 rows (d001-d002 from c001, d007 from c004, d008 from c005, d009-d010 from c006)

-- get_instructor_session_ids for Sarah
SELECT get_instructor_session_ids('a0000000-0000-0000-0000-000000000003');
-- Expected: 4 rows (d003-d006 from c002)

-- get_instructor_student_ids for Dave
SELECT get_instructor_student_ids('a0000000-0000-0000-0000-000000000002');
-- Expected: 3 rows (Alice from c001, Bob from c001, Eve from c006)

-- get_instructor_student_ids for Sarah
SELECT get_instructor_student_ids('a0000000-0000-0000-0000-000000000003');
-- Expected: 4 rows (Alice, Bob, Sarah, Carol from c002)

-- ============================================================
-- TEST 2: Impersonate Dave — courses isolation
-- ============================================================
SET request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-000000000002","role":"authenticated","email":"dave@ltsc.test","user_metadata":{"is_admin":false,"is_instructor":true,"is_student":false}}';
SET role = 'authenticated';

-- Dave should see his 4 courses (c001, c004, c005, c006)
SELECT id, title, status FROM courses ORDER BY title;
-- Expected: 4 rows

-- Dave should NOT see c002 (Sarah's) or c003 (no instructor)
SELECT id FROM courses WHERE id = 'c0000000-0000-0000-0000-000000000002';
-- Expected: 0 rows

-- Dave's sessions (7 total)
SELECT s.id, s.date, c.title
FROM sessions s JOIN courses c ON s.course_id = c.id
ORDER BY s.date;
-- Expected: 6 rows (d001-d002, d007, d008, d009-d010)

-- Dave should NOT see Sarah's sessions
SELECT id FROM sessions WHERE id = 'd0000000-0000-0000-0000-000000000004';
-- Expected: 0 rows

-- Dave can read student profiles for his courses
SELECT id, first_name, last_name FROM profiles
WHERE id IN ('a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000008');
-- Expected: 2 rows (Alice, Eve) — Dave's students

-- Dave cannot read Sarah's profile (she's not his student)
-- Note: Sarah IS enrolled in c002, but c002 is Sarah's own course, not Dave's
SELECT id FROM profiles WHERE id = 'a0000000-0000-0000-0000-000000000003';
-- Expected: 0 rows

-- Dave can read enrollments for his courses
SELECT id, course_id, student_id FROM enrollments ORDER BY course_id;
-- Expected: 3 rows (e001 Alice→c001, e006 Bob→c001 cancelled, e007 Eve→c006)

RESET role;
RESET request.jwt.claims;

-- ============================================================
-- TEST 3: Impersonate Sarah — courses isolation
-- ============================================================
SET request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-000000000003","role":"authenticated","email":"sarah@ltsc.test","user_metadata":{"is_admin":false,"is_instructor":true,"is_student":true}}';
SET role = 'authenticated';

-- Sarah should see c002 (her course) + active courses as student
SELECT id, title, status FROM courses ORDER BY title;
-- Expected: c002 via instructor policy + c001/c002/c003 via student active policy

-- Sarah should see sessions for c002 (via instructor) + c001/c002/c003 sessions (via student)
SELECT s.id, s.date FROM sessions s
WHERE s.course_id = 'c0000000-0000-0000-0000-000000000002'
ORDER BY s.date;
-- Expected: 4 rows (d003-d006) via instructor policy

-- Sarah should NOT see Dave's draft/cancelled/completed course sessions via instructor policy
-- (she may see some via student enrolled policy if enrolled)
SELECT id FROM sessions WHERE id = 'd0000000-0000-0000-0000-000000000007';
-- Expected: 0 rows (d007 is draft c004, Sarah not enrolled)

-- Sarah can read her students' profiles
SELECT id, first_name, last_name FROM profiles
WHERE id = 'a0000000-0000-0000-0000-000000000004';
-- Expected: 1 row (Alice — enrolled in c002)

RESET role;
RESET request.jwt.claims;

-- ============================================================
-- TEST 4: Session-level instructor override (DEC-007)
-- ============================================================
-- Temporarily assign Sarah as session-level instructor on d001 (Dave's c001 course)
UPDATE sessions SET instructor_id = 'a0000000-0000-0000-0000-000000000003'
WHERE id = 'd0000000-0000-0000-0000-000000000001';

-- Verify helper picks up session-level assignment
SELECT get_instructor_course_ids('a0000000-0000-0000-0000-000000000003');
-- Expected: 2 rows (c002 via course-level + c001 via session-level)

SELECT get_instructor_session_ids('a0000000-0000-0000-0000-000000000003');
-- Expected: 5 rows (d003-d006 from c002 + d001 from c001 session override)

-- Impersonate Sarah — she should now see c001 too
SET request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-000000000003","role":"authenticated","email":"sarah@ltsc.test","user_metadata":{"is_admin":false,"is_instructor":true,"is_student":true}}';
SET role = 'authenticated';

SELECT id, title FROM courses WHERE id = 'c0000000-0000-0000-0000-000000000001';
-- Expected: 1 row (c001 visible via session-level assignment)

SELECT id FROM sessions WHERE id = 'd0000000-0000-0000-0000-000000000001';
-- Expected: 1 row (d001 visible via session-level assignment)

-- Sarah can also read c001 enrollments now
SELECT id, student_id FROM enrollments WHERE course_id = 'c0000000-0000-0000-0000-000000000001';
-- Expected: 2 rows (e001 Alice, e006 Bob cancelled)

-- Sarah can read Alice's profile (c001 student via session-level)
SELECT id, first_name FROM profiles WHERE id = 'a0000000-0000-0000-0000-000000000004';
-- Expected: 1 row (Alice)

RESET role;
RESET request.jwt.claims;

-- Clean up: remove session-level override
UPDATE sessions SET instructor_id = NULL
WHERE id = 'd0000000-0000-0000-0000-000000000001';

-- ============================================================
-- TEST 5: Instructor cannot write (no INSERT/UPDATE/DELETE policies)
-- ============================================================
SET request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-000000000002","role":"authenticated","email":"dave@ltsc.test","user_metadata":{"is_admin":false,"is_instructor":true,"is_student":false}}';
SET role = 'authenticated';

-- Instructor cannot update course
UPDATE courses SET title = 'Hacked' WHERE id = 'c0000000-0000-0000-0000-000000000001';
-- Expected: 0 rows updated (no UPDATE policy for instructors)

-- Instructor cannot delete session
DELETE FROM sessions WHERE id = 'd0000000-0000-0000-0000-000000000001';
-- Expected: 0 rows deleted (no DELETE policy for instructors)

-- Instructor cannot modify enrollment
UPDATE enrollments SET status = 'cancelled' WHERE id = 'e0000000-0000-0000-0000-000000000001';
-- Expected: 0 rows updated (no UPDATE policy for instructors)

-- Instructor cannot modify attendance
UPDATE session_attendance SET status = 'attended'
WHERE session_id = 'd0000000-0000-0000-0000-000000000001'
  AND enrollment_id = 'e0000000-0000-0000-0000-000000000001';
-- Expected: 0 rows updated (no UPDATE policy for instructors)

RESET role;
RESET request.jwt.claims;
```

**Edge cases**
- [ ] Dan (student, no enrollments) sees zero courses when accessing instructor routes → redirected by middleware
- [ ] Andy (admin) can still do everything — admin policies unchanged
- [ ] Sarah (instructor+student) sees c002 via instructor policy AND student-enrolled policy without duplication (Postgres ORs multiple passing policies)
