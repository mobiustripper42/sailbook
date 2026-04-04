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
