# SailBook — QA Test Cases

Manual test cases by task. Prerequisites unless noted: seed data loaded, logged in as admin (andy@ltsc.test / Test1234!).

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
