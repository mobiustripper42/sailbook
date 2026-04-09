# SailBook — Session Log

Session summaries for continuity across work sessions.
Format: append newest entry at the top.

## Session 26 — 2026-04-09 09:00–10:30 (1.50 hrs)
**Duration:** 1.50 hours
**Task:** Phase 5.5 continued + housekeeping
**Completed:**
- Fixed cross-origin dev server block: `next.config.ts` `allowedDevOrigins: ['192.168.50.202']` — this was why phone showed stale JS (bundles were blocked, browser ran cache)
- `next.config.ts` server actions `allowedOrigins` updated to include 192.168.50.202
- Course browse (`/student/courses`): `Card size="sm"`, Date/Dates pluralized
- Course detail (`/student/courses/[id]`): Session/Sessions pluralized
- `card.tsx`: `rounded-2xl` → `rounded-lg` globally (all roles)
- 5.5 marked complete in PROJECT_PLAN.md
- Added tasks: 5.23 (Admin mobile, effort 3), 5.24 (Instructor mobile, effort 2), 5.25 (UX/UI design review, effort 3)
- Committed: `bc21861`
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 5.7 — End-to-end walkthrough with Andy. Load demo-seed.sql first. Start at /dev.
**Context:** Phone dev testing now works reliably. Restart dev server after config changes. `allowedDevOrigins` is the key — without it, JS bundles are blocked cross-origin and React doesn't hydrate. Card `size="sm"` is the standard for all student-facing cards. `rounded-lg` is now global.

## Session 25 — 2026-04-08 07:30–08:30 (1.00 hr)
**Duration:** 1.00 hour
**Task:** Phase 5.5 — Mobile responsiveness pass (student dashboard + my-courses)
**Completed:**
- PM status check — confirmed must-ship scope (5.5, 5.7, 5.8, 5.9, 5.11), recommended cuts (5.12, 5.13 cut; 5.14–5.16, 5.10, 5.22 deferred)
- 5.5 (partial) — Mobile nav + padding pass on all student pages:
  - `src/components/student/mobile-nav-drawer.tsx` (new) — sticky top bar + hamburger + slide-in drawer for mobile; `pointer-events-none` when closed to prevent touch intercept on Android Chrome
  - `src/app/(student)/layout.tsx` — sidebar `hidden md:flex`, new content column wraps `MobileNavDrawer` + main; `p-4 sm:p-8` on `<main>` (layout-level padding, DEC-017 pattern)
  - All 5 student pages — stripped outer `p-8`; error fallbacks stripped too
  - `src/app/(student)/student/dashboard/page.tsx` — `fmtDate` → short format (`weekday: short, month: short`); upcoming courses row stacks on mobile (`flex-col sm:flex-row`)
  - `src/components/student/my-courses-list.tsx` — session rows: date+time on one line, location `pl-1 truncate` below; `Card size="sm"` for reduced padding; `space-y-2`
  - `src/app/(auth)/layout.tsx` — `min-h-screen` → `min-h-dvh`, `items-start pt-16 sm:items-center sm:pt-0` fixes login form pushed off-screen by keyboard on Android
- Architect consulted on padding pattern → layout-level padding approved (DEC-017)
**In Progress:** Nothing
**Blocked:** Phone click-through issue (hamburger + filter buttons not responding) — suspected Turbopack stale bundle cache; `pointer-events-none` applied to drawer as defensive fix; restart dev server to resolve
**Next Steps:**
- Confirm click-through works after dev server restart on phone
- 5.5 still has remaining pages (browse, course detail, attendance) — or move on to 5.7 with Andy
- Commit this work (not yet committed)
**Context:** Layout padding is now DEC-017: one place in `(student)/layout.tsx <main>`. Any new student page must NOT add outer `p-*` — layout provides it. The `size="sm"` prop on Card reduces all padding to 16px (from 24px) — use it in student-facing views. Android Chrome may cache JS bundles aggressively on local dev; incognito/Brave private tab doesn't fully bypass — restart dev server is the reliable fix.

## Session 24 — 2026-04-07
**Duration:** 0.50 hours
**Task:** Phase 5.6 — Demo seed data + walkthrough page
**Completed:**
- Renamed `docs/dev-seed.sql` → `docs/dev-seed-qa.sql` (preserved for QA edge-case testing)
- Created `docs/demo-seed.sql` — clean, walkthrough-friendly LTSC data:
  - 7 users: Andy (admin), Mike + Lisa + Chris (instructors), Sam + Alex + Jordan (students)
  - Chris Marino is instructor + student (dual-role demo per PO suggestion)
  - 5 course types incl. Dinghy Sailing for Adults + Open Sailing (+ inactive Advanced Racing)
  - 6 courses: ASA 101 Weekend May (2/4), ASA 101 Evening May (1/4), ASA 103 (no instructor, triggers warning), ASA 101 April (completed w/ attendance history), Dinghy draft, Open Sailing July (5 Wed sessions Jul 1–29 @ 17:30–21:00)
  - Alex has pending enrollment (shows in admin alert), Jordan has none (use for live demo enrollment)
- Rewrote `src/app/dev/page.tsx` — replaced QA edge-case reference with guided walkthrough:
  - 4 sections: Admin Tour (8 parts), Student Experience (3 parts), Instructor View (2 parts), Dual Role (2 parts)
  - Each part shows account email, numbered steps, and what to expect
- Updated PROJECT_PLAN.md: 5.6 marked complete
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 5.7 — End-to-end walkthrough with Andy. Load demo-seed.sql first. Start at /dev.
**Context:** Wednesdays in July 2026: Jul 1, 8, 15, 22, 29 — all confirmed. Chris's dual-role routing: lands on /instructor/dashboard (instructor takes priority), can manually nav to /student/dashboard since is_student=true.

## Session 23 — 2026-04-07 16:10–16:34 (0.25 hrs)
**Duration:** 0.25 hours
**Task:** Phase 5.21 — Student attendance page: enrollment status badge
**Completed:**
- 5.21 — Enrollment status badge ("Enrolled" / "Pending confirmation") on each course card on the student attendance page
  - `src/app/(student)/student/attendance/page.tsx` — added `status` to enrollment select, added `enrollmentStatus` to `CourseAttendance` type, threaded through courseMap build
  - `src/components/student/course-attendance-card.tsx` — added `enrollmentStatusVariant()` + `enrollmentStatusLabel()` helpers, rendered badge in card header alongside existing "needs makeup" badge
- Updated `docs/QA.md` with 5 test cases under `### 5.21`
- No seed data changes needed — existing Alice/Bob/Eve enrollments cover all badge states
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 5.4 (loading states), 5.5 (mobile responsiveness), or 5.6 (production seed for Andy walkthrough) — pick based on priority
**Context:** 5.21 was genuinely a 1-pointer. enrollment.status was already queryable via the existing join — just wasn't being selected. CourseAttendanceCard is a server component so no client complexity added.

## Session 22 — 2026-04-07 15:18–17:30 (2.25 hrs, includes full computer reboot)
**Duration:** 2.25 hours (extended by ~45 min due to dev server incident)
**Task:** Phase 5.20 — Student course browse: enrollment status on course cards
**Completed:**
- 5.20 — Enrollment status badges on course browse page (`src/app/(student)/student/courses/page.tsx`):
  - Concurrent `Promise.all` query for user + enrollments (reverted from sequential after post-reboot confirmation)
  - Builds `enrollmentMap` (courseId → status)
  - Enrolled courses show "Enrolled"/"Pending confirmation" badge; button changes to "View"
  - `enrollmentStatusLabel()` helper added locally (same as my-courses-list.tsx)
  - `export const dynamic = 'force-dynamic'` retained — resolved the stale-cache issue
  - `redirect('/login')` guard added
- Debug artifacts (yellow `<pre>` block, `console.log` lines) stripped before commit
- QA cases in `docs/QA.md` (5.20 section) confirmed passing
- Build passes clean
**Incident:** Multiple conflicting Next.js dev server processes caused the server to become unresponsive mid-session. Required full computer reboot to clear. `pkill -f node` was attempted and did not resolve it. Root cause: zombie processes not killable without full restart.
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:**
- 5.21 (effort 1) — Student attendance page: show enrollment status badge (Enrolled / Pending) per course alongside session attendance badges
- 5.4 (effort 2) — Loading states / optimistic UI (cuttable per plan if time is tight)
**Context:**
- `force-dynamic` on the courses browse page is intentional — without it, Next.js caches the pre-auth render and enrollment badges don't appear even for logged-in users
- If dev server becomes unresponsive, a full computer reboot may be required — `pkill -f node` is not guaranteed to work

## Session 23 — 2026-04-07 13:30–14:56 (1.25 hrs)
**Duration:** 1.25 hours (1.5 hrs elapsed, −0.25 away from desk)
**Task:** Phase 5.18 + 5.19 — admin dashboard pending count, student enrollment status badges
**Completed:**
- 5.18 — Admin dashboard "Pending Confirmation (N)" count in card header; "Showing 10 of N pending" overflow notice when >10; two-query approach (separate `head: true` count) required — `count: 'exact'` on complex join select does not populate `.count` in Supabase JS
- 5.19 — Student enrollment status labels throughout: `my-courses-list.tsx` (card + list view), student course detail page bottom CTA; `enrollmentStatusLabel()` helper with explicit branches; "Pending confirmation" for `registered`, "Enrolled" for `confirmed`
- QA cases added to `docs/QA.md` for 5.18 and 5.19
- Added 5.20 (course browse enrollment status) and 5.21 (attendance page enrollment status) to PROJECT_PLAN.md as Phase 5 must-haves
- Added "Relative Upcoming badge" to SPEC.md V2 Ideas
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:**
- 5.20 (effort 2) — Student course browse: show "Enrolled" / "Pending" badge on cards, change button to "View" when enrolled
- 5.21 (effort 1) — Student attendance page: enrollment status badge per course
**Context:**
- `count: 'exact'` on `.select()` with embedded joins returns null for `.count` — always use a separate `head: true` count query for the enrollments table
- Dev vs local Supabase confusion cost debugging time — double-check `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` when results look wrong

## Session 22 — 2026-04-06 22:18–23:05 (0.75 hrs)
**Duration:** 0.75 hours
**Task:** Phase 5.3 QA pass + UI consistency polish
**Completed:**
- QA pass on Phase 5.3 (error handling, empty states, form validation) — all checks pass
- Standardized navigation buttons to "New [Entity]" across courses and course-types pages
- Removed verbose subtitle `<p>` tags from: instructors, missed-sessions, student attendance, student courses (Available Courses), student my-courses pages
- Replaced ad-hoc Card empty states with shared `EmptyState` component (student attendance, admin missed-sessions)
- Upgraded "Browse available courses" inline link → `Button` on My Courses empty state
- Added unsaved-changes guard to V2 ideas in SPEC.md
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:**
- 5.18 (effort 1) — dashboard pending count restore
- 5.19 (effort 1) — student pending badge
- Then 5.4 (effort 2) — loading states
**Context:**
- All 5.3 work is done and QA'd — clean starting point for 5.18/5.19

## Session 21 — 2026-04-06 19:05–20:53 (1.75 hrs)
**Duration:** 1.75 hours (estimated — no recorded start; prior session ended ~19:00; scope consistent with ~1.75 hrs)
**Task:** Phase 5.3 — Error handling, form validation, empty states
**Completed:**
- `src/components/empty-state.tsx` — new shared `EmptyState` component (centered text + optional ReactNode action)
- `docs/DECISIONS.md` — added DEC-016 (empty state pattern), ordered after DEC-015
- `src/actions/courses.ts` — null guard for `course_type_id` in both `createCourse` and `updateCourse`; auth guard added to `updateCourse` (was inconsistent with `createCourse`)
- `src/components/admin/course-form.tsx` — removed `required` from shadcn `<Select name="course_type_id">` to eliminate browser native tooltip fighting with the dropdown; server-side guard handles it
- `text-destructive` sweep — 6 files changed from `text-red-600`: `course-status-actions`, `enrollment-actions`, `course-type-actions`, `instructor-actions`, `session-actions`, `attendance-form`
- `admin/courses/page.tsx`, `admin/course-types/page.tsx` — EmptyState with CTA button
- `admin/students/page.tsx`, `admin/instructors/page.tsx`, `student/courses/page.tsx` — EmptyState without CTA
- `docs/QA.md` — Phase 5.3 section added with full UI walkthrough
- `docs/dev-seed.sql` — edge case comment updated
- `docs/PROJECT_PLAN.md` — 5.3 marked complete
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:**
- QA pass on 5.3 using QA.md section — focus on: course type null guard (submit with nothing selected), empty states on list pages, error color consistency
- After QA: 5.18 (effort 1 — dashboard pending count restore) + 5.19 (effort 1 — student pending badge) as a quick pair
- Then: 5.4 (loading states, effort 2)
**Context:**
- Empty states on list pages are hard to hit with seed data. Fastest QA path: fresh wipe before re-seeding, check all 5 pages, then re-seed
- Inline table empty states (sessions/enrollments inside course detail) intentionally left as `<p>` per DEC-016 — `EmptyState` centered layout doesn't fit inside a Card table
- Course Type null guard: without seed data and with seed data both work. The UX is: submit with no type selected → "Course type is required" at top of form
- User noted they don't love the UX of the error-at-top pattern for missing course type, but rolling with it for V1

## Session 20 — 2026-04-06 (1.25 hrs)
**Duration:** 1.25 hours (1.5 hrs elapsed minus 15 min away from desk)
**Task:** Phase 5.2 — Instructor swap on individual sessions
**Completed:**
- `src/actions/sessions.ts` — added `updateSessionInstructor` server action; updates `sessions.instructor_id`, revalidates course detail path
- `src/components/admin/session-instructor-select.tsx` — new client component; controlled shadcn `<Select>`, "Course default" as first option (value ""), error surface via inline message, uses `useTransition` for pending state
- `src/app/(admin)/admin/courses/[id]/page.tsx` — fetches all instructor profiles, passes to `SessionInstructorSelect` in session table Instructor column
- `src/app/(admin)/admin/courses/[id]/sessions/[sessionId]/attendance/page.tsx` — fetches course instructor as fallback; computes `effectiveInstructor = session.instructor_id ?? course.instructor_id`, displays in attendance header
- `src/app/(student)/student/courses/[id]/page.tsx` — per-session instructor override display: shows session-level instructor when set, falls back to course default
- `src/app/(student)/student/courses/[id]/attendance/page.tsx` — same effective-instructor fallback logic for student attendance view
- `docs/migrations/012_rls_instructor_profiles_read.sql` — RLS fix: admin sessions page was failing to load instructor list because profiles SELECT policy for admins was missing (or narrowly scoped); added explicit admin read policy
- `dev-seed.sql` — d002 session seeded with an instructor override for testable QA scenario
- `docs/QA.md` — Section 5.2 added with full UI walkthrough and SQL verification steps
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 5.3 — Error handling, form validation, empty states (effort: 3). Covers form-level validation messages, API error surfacing, and empty-state UI across admin and student views. No dependencies.
**Context:**
- `SessionInstructorSelect` uses shadcn `<Select>` (controlled) not a raw `<select>`. Value "" maps to NULL (course default) in the action.
- Migration 012 RLS fix was unplanned but necessary — instructor dropdown was empty without it. Zero scope impact.
- Phase 5 velocity now 0.50 hrs/pt (4.0 hrs / 8 pts). Lifetime avg is ~0.22. The gap is driven by 5.1 scope creep and 5.17 depth. Effort-1 tasks (5.18, 5.19) should pull the ratio back down.

## Session 19 — 2026-04-06 (1.25 hrs)
**Duration:** 1.25 hours (1.5 elapsed minus 15 min away from desk)
**Task:** Phase 5.17 — Student enrollment RLS + enrollment count bugs
**Completed:**
- Migration 010: added student INSERT + UPDATE policies on `session_attendance` — enrollment flow was creating the `enrollments` row but silently failing on the `session_attendance` upsert (RLS had SELECT only). Students saw an error on screen; admin saw the enrollment; no attendance records were created.
- Migration 011: added `get_course_active_enrollment_count()` and `get_all_course_enrollment_counts()` SECURITY DEFINER helpers — direct enrollment count queries run as the student's session client and returned 0 or 1 (student's own row only), breaking capacity enforcement and spots-remaining display
- Fixed `enrollInCourse` action to use RPC for capacity gate (was bypassable by any unenrolled student)
- Fixed student course detail page and browse page to use RPC for enrollment counts
- Fixed admin courses list and course detail page to exclude `cancelled` enrollments from capacity display (was counting all statuses including cancelled)
- Added task 5.19 to PROJECT_PLAN.md: student "Pending confirmation" badge on course detail + attendance pages
- Added V2 items to SPEC.md: first-come-first-served approval (`enrolled_at` already captured), payment + inventory control
- QA.md: added full 5.17 section with UI walkthrough + 5 SQL verification tests; fixed invalid LIMIT on UPDATE; strengthened UPDATE tests to SELECT before/after to confirm RLS actually blocked (not just 0 rows from empty result set)
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:**
- 5.2 — Instructor swap on individual sessions (AS-9, effort 2). Sessions already have nullable `instructor_id` (DEC-007 — NULL means use course default). Need: dropdown on session row in admin course detail, server action to update `sessions.instructor_id`, display update on course detail + attendance pages. No RLS changes needed.
- After 5.2: knock out 5.18 (effort 1, dashboard pending count) and 5.19 (effort 1, student pending badge) as a quick pair — both close out enrollment status display work started this session.
**Context:**
- Velocity running at 0.46 hrs/pt this phase vs 0.22 lifetime avg. Cause is identifiable (5.1 scope creep + 5.17 was deeper than estimated). PM says it will normalize once effort-1 tasks land. Re-flag after 5.5 (mobile pass, effort 5, most likely to balloon).
- Dan's orphaned enrollment from pre-fix testing is cleaned up by the reseed.
- SECURITY DEFINER enrollment count helpers follow the same pattern as `get_student_enrollment_ids` from migration 008.

## Session 19 — 2026-04-06 (1.25 hrs)
**Duration:** 1.25 hours (1.5 hrs elapsed minus 15 min away-from-desk)
**Task:** Phase 5.17 — Student enrollment RLS bug fix
**Completed:**
- 5.17 — Migration 010: added student INSERT/UPDATE policies on session_attendance so attendance records are actually created on enrollment (was silently failing since Phase 2)
- Migration 011: SECURITY DEFINER enrollment count helpers to fix broken capacity enforcement and spots-remaining display (broken as a consequence of the RLS gap)
- Bonus: fixed admin enrollment count bug — was counting cancelled enrollments toward totals; now filters to active only
- Added task 5.19 to PROJECT_PLAN.md: student pending confirmation badge (effort: 1)
- Added V2 items to SPEC.md
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** Work from top of remaining Phase 5 list — next unchecked task is 5.2 (instructor swap on individual sessions, effort: 2), then 5.3 (error handling/form validation/empty states, effort: 3)
**Context:**
- The RLS gap on session_attendance INSERT/UPDATE had been live since Phase 2 — every student enrollment in the system silently created no attendance records. Migration 010+011 fix this but existing records may need a backfill depending on test data state.
- Admin enrollment count fix was not a planned task — discovered during 5.17 QA. No separate task added; captured here.
- 5.19 (pending confirmation badge) was added this session — effort 1, fits naturally after 5.18 (pending count/link restore) since both touch enrollment status display.

## Session 18 — 2026-04-06 (~1.5 hrs)
**Duration:** ~1.5 hours (2 hrs elapsed minus 30 min downtime)
**Task:** Phase 5.1 — Admin dashboard real stats + operational panels
**Completed:**
- Replaced 4 placeholder stat cards with live Supabase queries
- Replaced "Upcoming Sessions (7 days)" count card with "Sessions in Next 7 Days" table: course name (links to attendance page), date/time, instructor (amber warning if unassigned), enrolled/capacity
- Replaced "Enrollments" count card with "Pending Confirmation" table: student name, course (links to `/admin/courses/[id]`), enrolled date, capped at 10
- Replaced "No Instructor Assigned" warning card with `InstructorCard` that shows "All Instructors Assigned" + ✓ when count = 0, amber warning when > 0
- Fixed `Array.isArray` inconsistency — aligned with `as unknown as` cast pattern used throughout codebase
- Fixed stat card numbers to right-align at consistent vertical position via fixed `h-14` CardHeader
- Added tasks 5.17 (RLS bug: student enrollment session_attendance INSERT/UPDATE) and 5.18 (dashboard pending count) to PROJECT_PLAN.md
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:**
- 5.17 first — it's a silent data corruption bug since Phase 2: student enrollment succeeds but session_attendance records are never created because RLS has no INSERT/UPDATE policy for students. Fix is `docs/migrations/010_rls_student_attendance_write.sql` adding student INSERT + UPDATE policies using existing `get_student_enrollment_ids()` helper. Propose fix → wait for approval → add migration → test with seed student enrolling.
- 5.18 after — add `pendingCount` query back to `getDashboardData()`, pass `totalCount` to `PendingEnrollments`, restore "View all (N)" link when > 10.
**Context:**
- `as unknown as` cast pattern is a known workaround for hand-written `types.ts` lacking DB relationship types — tracked in memory as `project_types_debt.md`. Proper fix is `npx supabase gen types typescript --local` once Docker/local Supabase is set up.
- Velocity this session: 0.375 hrs/pt (5.1 was 4 pts). PM flagged as above lifetime avg (0.22). Likely because 5.1 had scope creep (architect-approved) — the two table panels weren't in the original spec.
- Phase 5 forecast: ~10 hrs remaining at lifetime velocity. 39 days to May 15.

## Session 17 — 2026-04-06 (0.75 hrs)
**Duration:** 0.75 hours
**Task:** Phase 4.4 — RLS policies for instructors
**Completed:**
- Analyzed all 8 existing migrations — identified 4 gaps in instructor RLS:
  1. courses policy: only checked course-level `instructor_id`, missed session-level overrides (DEC-007)
  2. sessions policy: direct subquery on courses (recursion risk), missed session-level overrides
  3. enrollments helper: `get_instructor_course_ids()` was course-level only
  4. profiles: no instructor policy at all — roster page joins on profiles silently returned null for non-admin users
- Discovered 2 rogue policies on profiles from initial setup never dropped by migrations:
  - "Authenticated users can read profiles" (qual: true) — let anyone read all profiles
  - "Admins can update any profile" — used old `role='admin'` string
- Created `docs/migrations/009_rls_instructor_policies.sql`:
  - Drops rogue policies
  - Updated `get_instructor_course_ids()` to UNION session-level assignments
  - Added `get_instructor_student_ids()` SECURITY DEFINER helper for profiles access
  - Replaced courses policy to use helper (both assignment levels)
  - Replaced sessions policy to use `get_instructor_session_ids()` (both assignment levels)
  - Added profiles SELECT policy for instructors
  - Enrollments policy auto-benefits from updated helper (no change needed)
- Fixed instructor roster 404 → now redirects to `/instructor/dashboard` instead of blank page
- QA: all SQL impersonation tests pass (Dave isolation, Sarah isolation, DEC-007 session-level override, write denial)
- Phase 4 complete. Merged dev → main and pushed.
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** Phase 5 — Polish & Ship. Start with 5.1 (admin dashboard real stats) or 5.2 (instructor swap on sessions).
**Context:** The rogue "Authenticated users can read profiles" policy was masking the profiles RLS gap — everything appeared to work because everyone could read all profiles. Both bugs cancelled each other out in testing but were independently wrong. Phase 4 velocity: 1.75 hrs / 10 pts = 0.175 hrs/pt.

---

## Session 16 — 2026-04-06 (0.25 hrs)
**Duration:** 0.25 hours
**Task:** Phase 4.3 — Identify makeup students in instructor roster
**Completed:**
- Added query for `session_attendance WHERE makeup_session_id = this session` to find students attending as a makeup
- Joins missed session to get its date, displays "Makeup from [date]" secondary badge next to student name
- Updated `dev-seed.sql`: Carol's d003 attendance now has `makeup_session_id = d004` for testable scenario
- QA test cases added to `docs/QA.md` for 4.3; updated Carol's 3.8 test (now "Makeup scheduled" instead of "Needs makeup")
- Code review flagged: cross-course keying (enrollment_id vs student_id) won't work for V2 cross-course makeups — acceptable for V1 same-course only
- File is 216 lines (just over 200-line convention) — defer split to Phase 5 if it grows
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** Phase 4.4 — RLS policies for instructors (effort: 3). Last task in Phase 4.
**Context:** Re-seed required to pick up Carol's makeup linkage. The makeup query uses `enrollment_id` keying which only works for same-course makeups — needs refactor to `student_id` when cross-course makeups land in V2.

---

## Session 15 — 2026-04-05 (0.5 hrs)
**Duration:** 0.5 hours
**Task:** Phase 4.2 — Session roster view for instructors
**Completed:**
- Created `/instructor/sessions/[id]/page.tsx` — read-only roster page linked from dashboard "Roster →"
- Shows session header (course title, date/time/location, cancelled badge), enrolled/capacity stat, session status
- Roster table: student name (last, first), email, attendance badge using shared `attendanceStatusConfig`
- Missed sessions show "Needs makeup" or "Makeup scheduled" indicators
- Authorization: verifies logged-in instructor owns the course, returns 404 otherwise
- Bug fix: `.order('created_at')` → `.order('enrolled_at')` (enrollments table uses `enrolled_at`, not `created_at` — caused empty roster)
- QA test cases added to `docs/QA.md` — all passing
- Updated `docs/PROJECT_PLAN.md` with velocity (0.20 hrs/pt, 2/4 tasks, 5/10 pts)
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** Phase 4.3 — Identify makeup students in roster (from other courses). Then 4.4 — RLS policies for instructors.
**Context:** No new seed data needed — existing seed covers all roster scenarios. The Performance.measure negative timestamp error in Next.js dev tools is a known dev-mode bug, harmless. Dashboard has a local `fmtDate` that should be unified with shared `fmtDateLong` — deferred to Phase 5 polish.

---

## Session 14 — 2026-04-05 (0.5 hrs)
**Duration:** 0.5 hours
**Task:** Phase 3.10 — Student course view session status + attendance indicators
**Completed:**
- Enhanced `/student/courses/[id]/page.tsx` with cancelled session styling (dimmed rows, strikethrough, "Cancelled" badge)
- Added attendance column for enrolled students (Attended/Missed/Excused/Upcoming badges, "Needs makeup" / "Makeup scheduled" indicators)
- Sessions stat card shows cancelled count when applicable
- Extracted shared `AttendanceStatus` type and `attendanceStatusConfig` to `src/lib/attendance.ts` (was duplicated in 3 files)
- Added `fmtDateLong` to `src/lib/utils.ts` (weekday-inclusive format), fixed shadowed `fmtDate` inconsistency
- Updated `course-attendance-card.tsx` and `attendance/page.tsx` to use shared attendance module
- QA test cases added to `docs/QA.md` including RLS SQL verification
- All QA passed. Phase 3 complete.
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** Phase 4 — Instructor Views. Task 4.1: Instructor dashboard with upcoming sessions and roster counts.
**Context:** Phase 3 is fully done (8/8 tasks, 3.5/3.6 deferred to V2). Shared attendance config now in `src/lib/attendance.ts` — use it for any future attendance badge rendering.

---

## Sessions 12+13 — 2026-04-05 (~1.5 hrs estimated)
**Duration:** ~1.5 hours (estimated — compute crash lost timing for session 12)
**Task:** Phase 3.9 — RLS policies for session_attendance table
**Completed:**
- Created `docs/migrations/008_rls_session_attendance.sql` with full RLS policies
- Admin: full CRUD via `is_admin` metadata flag
- Students: read own attendance via `get_student_enrollment_ids()` SECURITY DEFINER helper
- Instructors: read attendance for their sessions via `get_instructor_session_ids()` SECURITY DEFINER helper
- Instructor helper handles both course-level and session-level instructor assignment (DEC-007)
- Added `DROP POLICY IF EXISTS` guards for idempotent re-runs (partial run hit duplicate policy error)
- Migration ran successfully in Supabase SQL Editor
- QA tests all passing: cross-student isolation, write denial verified via pg_policies, edge cases (zero enrollments, cancelled enrollment)
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** Task 3.10 — Student course view: show session status (cancelled badge, missed indicator) and filter/dim cancelled sessions (effort: 2). Last task in Phase 3. Then Phase 4 — Instructor Views.
**Context:** Follows same SECURITY DEFINER pattern as migrations 005/006/007. Two new helper functions: `get_student_enrollment_ids(user_id)` and `get_instructor_session_ids(user_id)`. The instructor helper uses LEFT JOIN to catch both `courses.instructor_id` and `sessions.instructor_id` matches. Session 12 died to compute crash — no timing available, user estimated ~1.5 hrs combined.

---

## Session 12 — 2026-04-05 (0.25 hrs)
**Duration:** 0.25 hours
**Task:** Phase 3.9 — RLS policies for session_attendance table
**Completed:**
- Created `docs/migrations/008_rls_session_attendance.sql` with full RLS policies
- Admin: full CRUD via `is_admin` metadata flag
- Students: read own attendance via `get_student_enrollment_ids()` SECURITY DEFINER helper (avoids enrollments RLS recursion)
- Instructors: read attendance for their sessions via `get_instructor_session_ids()` SECURITY DEFINER helper (avoids sessions + courses RLS recursion)
- Instructor helper handles both course-level and session-level instructor assignment (DEC-007)
- Marked 3.9 complete in PROJECT_PLAN.md
**In Progress:** Nothing
**Blocked:** Migration needs to be run in Supabase SQL Editor
**Next Steps:** Run `docs/migrations/008_rls_session_attendance.sql` in Supabase SQL Editor. Then task 3.10 — Student course view session status indicators (effort: 2). Phase 3 nearly complete (7/8 tasks done).
**Context:** Follows same SECURITY DEFINER pattern as migrations 005/006/007. Two new helper functions: `get_student_enrollment_ids(user_id)` and `get_instructor_session_ids(user_id)`. The instructor helper uses LEFT JOIN to catch both `courses.instructor_id` and `sessions.instructor_id` matches.

---

## Session 11 — 2026-04-05 (0.75 hrs)
**Duration:** 0.75 hours
**Task:** Phase 3.8 — Student attendance history + missed sessions needing makeup
**Completed:**
- New `/student/attendance` page showing per-course attendance history grouped by course
- Extracted `CourseAttendanceCard` component to `components/student/course-attendance-card.tsx` (code review: file length)
- Status badges per session (Attended, Missed, Excused, Upcoming) with proper `AttendanceStatus` union type
- Missed-sessions-needing-makeup highlighted with destructive badge and "Needs makeup" indicator
- Alert banner at top when student has outstanding missed sessions
- Cancelled sessions shown with strikethrough + badge (derived from `session.status`, not a `cancelled` column)
- "Makeup scheduled" label for missed sessions with makeup already assigned
- Added "Attendance" to student sidebar nav
- Courses sorted: those with missed sessions first, then alphabetically
- Fixed browser tab title: replaced raw `<title>` tags with `generateMetadata` in all 3 role layouts + template in root layout — title now persists across client-side navigation
- Changed test password from `Test1234!` to `qwert12345` across seed, QA, and dev page
- QA test cases for 3.8 written and all passing
- Plural/singular fix on badge ("1 needs" vs "2 need")
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** Task 3.9 — RLS policies for session_attendance table (effort: 3). Then 3.10 — Student course view session status indicators (effort: 2). Phase 3 nearly complete. Polish note saved: badges and buttons look alike (Phase 5).
**Context:** Phase 3 at 6/8 tasks complete (3.5/3.6 deferred V2). Bob's cancelled enrollment (e006) shows missed attendance on student page — noted as edge case, may want to filter cancelled enrollments in future. `generateMetadata` pattern is now the standard for browser titles.

---

## Session 10 — 2026-04-05 (0.75 hrs)
**Duration:** 0.75 hours
**Task:** Phase 3.7 — Admin missed sessions view + misc improvements
**Completed:**
- New `/admin/missed-sessions` page showing students with unresolved missed sessions, grouped by student
- Added "Missed Sessions" to admin sidebar nav
- Extracted `fmtDate` to `lib/utils` for shared date formatting
- Error handling matching other admin pages (code review fix)
- Browser tab title shows "SailBook - {firstName}" across all three role layouts
- Schema fix: `makeup_session_id` FK changed to `ON DELETE SET NULL` (prevents delete errors)
- Added admin impersonation mode to V2 Ideas in SPEC.md
- QA test cases for 3.7 (all passing)
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** Task 3.8 — Student view: attendance history + missed sessions needing makeup (effort: 3). Consider `/student/attendance` or integrating into My Courses. `fmtDate` utility ready for reuse.
**Context:** Phase 3 at 5/8 tasks complete (3.5/3.6 deferred V2). ~3.75 hrs actual vs 12-16 estimated. Velocity ~0.20 hrs/effort point. 40 days to May 15, no risk.

---

## Session 9 — 2026-04-05 09:00–09:36 ET (0.50 hrs)
**Duration:** 0.50 hours (0.75 actual minus 0.25 for non-task time)
**Task:** Phase 3.4 — Create makeup session flow
**Completed:**
- 3.4 — Makeup session flow: `createMakeupSession` server action, `MakeupSessionForm` inline component, student count indicator, makeup-already-scheduled state
- Bug fix: attendance page was showing all enrolled students for makeup sessions instead of only assigned students — rewrote to drive student list from `session_attendance` records, not enrollments
- Gap fix: `addSession` now auto-creates `expected` attendance records for existing enrollees (enrollment did this for existing sessions, but adding a session didn't reciprocate)
- Seed data updated: d003 (Evening Series) now cancelled with mixed attendance (Alice=attended, Bob=missed, Sarah=excused, Carol=missed) for makeup testing
- QA test cases for 3.4 — all passing
- Added task 3.10 (student course view: session status indicators) per PO priority
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:**
1. Phase 3.7 — Admin view: students with outstanding missed sessions (effort: 2)
2. Then 3.8 (student attendance history), 3.9 (RLS for session_attendance), 3.10 (student session status indicators)
**Context:**
- Attendance page now driven by `session_attendance` records joined through enrollments — no more `?? 'expected'` fallback. This is cleaner but means every session MUST have attendance records created (addSession and enrollment both handle this now).
- `MakeupSessionForm` shows student counts: "Schedule Makeup (2 students)" or "Makeup scheduled (2 students)" when all missed students already linked. Queries `makeupCounts` map on the course detail page.
- Course detail page is 234 lines (over 200 convention). Will need extraction when next touched.
- CLAUDE.md updated with bug report workflow: explain cause, wait for approval before changing code.

---

## Session 8 — 2026-04-04 22:24–23:03 ET (0.75 hrs)
**Duration:** 0.75 hours
**Task:** Phase 3.3 — Cancel session flow
**Completed:**
- 3.3 — Cancel session flow — `cancelSession` server action, cancel reason prompt, attendance cascade (expected→missed), destructive badge with tooltip, cancelled session banner on attendance page
- Code review fixes: attendance cascade error handling, status prop union type, banner text clarification, attendance form stays editable for cancelled sessions
- QA test cases for 3.3 added to `docs/QA.md` — all passing
- Seed data updated: Alice's d003 attendance → `attended` for mixed-status testing
- Session log backfilled for 7a (3.1) and 7b (3.2)
- Multi-session time tracking workflow established
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:**
1. Phase 3.4 — Create makeup session flow (effort: 4)
2. Then 3.7 (admin missed-sessions view), 3.8 (student attendance history), 3.9 (RLS for session_attendance)
**Context:**
- `cancelSession` action in `src/actions/sessions.ts` — follows same pattern as `cancelCourse`
- Cancel only flips `expected` attendance to `missed` — `attended`/`excused` preserved
- Attendance page remains accessible and editable for cancelled sessions (admin may need to correct)
- Browser `prompt()` used for cancel reason — native dialog, works on mobile. Polish to custom modal deferred to Phase 5.

---

## Session 7b — 2026-04-04 (1.00 hrs)
**Duration:** 1.00 hours
**Task:** Phase 3.2 — Auto-create attendance records on enrollment
**Completed:**
- 3.2 — Auto-create attendance records when student enrolls (status: expected)
- Velocity tracking setup in PROJECT_PLAN.md
- Seed data update for attendance records
- QA test cases for task 3.2
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 3.3 — Cancel session flow
**Context:**
- Attendance records auto-created via database trigger or server action on enrollment
- QA test cases committed separately (af4d622)

---

## Session 7a — 2026-04-04 (0.75 hrs)
**Duration:** 0.75 hours
**Task:** Phase 3.1 — Admin attendance page
**Completed:**
- 3.1 — Admin attendance page — select session, mark each student present/absent/excused
- Breadcrumb navigation added
- Error handling standardization
- General cleanup
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 3.2 — Auto-create attendance records on enrollment
**Context:**
- Attendance page at /admin/attendance (or /admin/sessions/[id]/attendance)
- Error handling pattern standardized during this session — follow same pattern going forward

---

## Session 6 — 2026-04-04
**Task:** Phase 2.8–2.10, RLS fixes, /dev page improvements, PM update
**Completed:**
- 2.8 — RLS policies for enrollments table (`docs/migrations/006_rls_enrollments.sql`)
- 2.9 — Student list + edit for admin (`/admin/students`, `/admin/students/[id]/edit`)
- 2.10 — Instructor edit for admin (`/admin/instructors/[id]/edit`) — shared `ProfileEditForm` component + `updateProfile` server action
- Fixed `/dev` page redirect — logged-in users were being bounced to their dashboard; exempted `/dev` from the auth redirect in `proxy.ts:48`
- Added copy buttons to all emails and password on `/dev` page (`src/app/dev/copy-button.tsx`)
- Grouped edge case scenarios by user on `/dev` page
- Fixed seed data bug — Dan was enrolled in Evening Series (should have zero enrollments); swapped for Sarah
- Fixed RLS bug: students couldn't see completed/cancelled courses in My Courses — added enrollment-based course + session policies (`docs/migrations/005_student_enrolled_rls.sql`)
- Fixed RLS infinite recursion — courses policy → enrollments → courses loop; created `SECURITY DEFINER` helper functions (`docs/migrations/007_fix_rls_recursion.sql`)
- Added granular add/remove role SQL helpers to `docs/sql-helpers.sql`
- Added task 5.14 (admin role management UI, may defer to V2)
- PM updated PROJECT_PLAN.md — revised effort estimates, added cuttable tasks list
- **Phase 2 is fully complete (11/11 tasks)**
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:**
1. Start Phase 3 — begin with 3.1 (attendance page for admin) and 3.2 (auto-create attendance records on enrollment)
2. 3.2 may need to come first or alongside 3.1 since the attendance page needs records to display
3. Watch for more RLS recursion issues — `session_attendance` joins through enrollments, courses, and profiles
**Context:**
- RLS recursion fix pattern: use `SECURITY DEFINER` functions (`get_enrolled_course_ids`, `get_instructor_course_ids`) to break cross-table policy cycles. These live in migration 007.
- Migrations 005, 006, 007 have all been applied to cloud Supabase
- Seed data updated: Evening Series 4 seats = Alice, Bob, Sarah, Carol (not Dan)
- `ProfileEditForm` is shared between student and instructor edit pages — experience_level field only renders when `is_student` is true
- Profile edit updates `profiles` table only — does NOT sync `auth.users.raw_user_meta_data`. Role changes still require SQL (see sql-helpers.sql). Task 5.14 may add a UI for this.
- PM estimates ~26-36 hrs remaining. Target: start Phase 5 by April 25 to leave room for Andy walkthrough + bug fixes.

---

## Session 5 — 2026-04-03
**Task:** Phase 2.3–2.7 + dev tooling + bug fixes
**Completed:**
- 2.3 — Student course detail page (`/student/courses/[id]`) — type, schedule, instructor, price, spots
- 2.4 — Enroll server action with capacity + duplicate guards
- 2.5/2.6 — Capacity enforcement + duplicate prevention (handles re-enroll after cancellation)
- 2.7 — My Courses page (`/student/my-courses`) — card/list toggle, upcoming/past/all filter
- Rebuilt student dashboard (2.1) — stat cards, next session highlight, upcoming courses list
- Built instructor dashboard + layout — stat cards, upcoming sessions list with roster counts
- Made `courses.instructor_id` nullable — migration 004, form + action updates, Course type updated
- Created `docs/dev-seed.sql` — 8 test users, 5 course types, 6 courses, sessions, enrollments, edge cases
- Created `/dev` page — credentials, course inventory, edge case checklist, workflows, reset instructions
- Fixed `/dev` gating: local dev + Codespaces (`CODESPACES=true`) + Vercel preview (`VERCEL_ENV=preview`)
- Added `/dev` to PUBLIC_ROUTES in proxy.ts
- Debugged seed login failure (3 root causes fixed in script + applied to cloud): missing `raw_app_meta_data`, missing `auth.identities` with `provider_id`, token columns must be `''` not NULL
- Added tasks: 5.13 Docker evaluation, updated 5.1 with courses-without-instructors tile
- Saved QA workflow memory for next project
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:**
1. Start 2.8 — RLS policies for enrollments table (`docs/migrations/005_rls_enrollments.sql`)
2. Then 2.9 — Student list + edit for admin
3. Then 2.10 — Instructor edit for admin
**Context:**
- Seed login root cause: GoTrue scans `auth.users` into Go struct where token fields are `string` not `*string` — NULL panics. Always set `confirmation_token`, `recovery_token`, `email_change`, `email_change_token_new`, `email_change_token_current`, `reauthentication_token` to `''` in direct auth.users inserts
- `auth.identities` required for `signInWithPassword` — needs `provider_id` (= email) in newer Supabase
- Instructor dashboard links to `/admin/courses/[id]` for roster — Phase 4 adds instructor-specific view
- `/dev` page is the handoff artifact for testers — share with Andy before any test session

---

## Session 4 — 2026-04-03
**Task:** Phase 2.0–2.2 — Role migration, fix Codespaces Server Actions, course browse page
**Completed:**
- Diagnosed and fixed "Invalid Server Actions request" 500 — caused by Codespaces port forwarding sending mismatched `x-forwarded-host` / `origin` headers. Fixed via `serverActions.allowedOrigins: ['*.app.github.dev']` in `next.config.ts`.
- Added missing `"Users can insert own profile"` RLS policy to `docs/migrations/003_role_booleans.sql` (migration 003 drops service-role insert policy but had no self-insert replacement — new users couldn't create their own profile).
- Created `docs/sql-helpers.sql` with reusable SQL snippets: make admin, make instructor, deactivate user, partial and full dev data wipe.
- Built student layout + sidebar nav (Dashboard / Browse Courses / My Courses).
- Built `/student/courses` browse page — card grid of active courses, spots remaining (filtered to non-cancelled enrollments), date range from sessions, "Full" badge when at capacity.
- Marked 2.0, 2.1, 2.2 complete in PROJECT_PLAN.md.
**In Progress:** Nothing — 2.2 untested (pushed to main to test tomorrow)
**Blocked:** Migration 003 still needs to be applied to cloud Supabase before registration works correctly
**Next Steps:**
1. Apply `docs/migrations/003_role_booleans.sql` in Supabase SQL Editor (if not done yet)
2. Test registration flow + student browse page
3. Start 2.3 — course detail view (student-facing)
4. Then 2.4 — registration/enroll flow, 2.5 capacity enforcement, 2.6 duplicate prevention
**Context:**
- Codespaces fix: `next.config.ts` now has `experimental.serverActions.allowedOrigins` — any Codespace URL works, no need to update per session
- After migration 003: update Andy's `raw_user_meta_data` in Supabase Auth to `{is_admin: true, ...}` — see `docs/sql-helpers.sql`
- Browse page links to `/student/courses/[id]` — that route doesn't exist yet (2.3)
- Spots remaining counts only non-cancelled enrollments against capacity

---

## Session 3 — 2026-04-02
**Task:** Schema review with Andy + course status / enrollment confirmation
**Completed:** 5 schema comments reviewed. Added draft/active/completed/cancelled course statuses (default now draft). Added Publish/Complete/Cancel buttons to course detail. Added enrollment Confirm/Cancel actions. Logged DEC-013 (experience_level static), DEC-014 (enrollment status lifecycle). Added 2.0 multi-role migration as first Phase 2 task. Added 5.11 duplicate course to Phase 5. Logged AI season setup agent as V2. Verified unique constraint on enrollments already existed. Build clean throughout.
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:**
1. Commit current work
2. Start Phase 2 with task 2.0 — migrate role model to boolean flags (is_admin, is_instructor, is_student)
3. Then 2.1 student dashboard, 2.2 course browse, etc.
**Context:**
- Course status default is now 'draft' — new courses won't be student-visible until published
- Enrollment confirmed = payment received in V1 (manual admin action)
- Multi-role migration (2.0) must happen before any Phase 2 student role logic is built

---

## Session 2 — 2026-04-02
**Task:** Phase 1 — Admin Course Catalog
**Completed:** All 9 tasks (1.1–1.9). Admin layout with sidebar nav. Dashboard stat cards. Course types CRUD (list/create/edit/deactivate). Course list + detail + edit pages. Course creation form with dynamic session rows. Add/delete sessions from detail page. Instructor list + deactivate. RLS SQL migration file. Manual types.ts.
**In Progress:** Nothing — needs RLS migration applied and lint/build check
**Blocked:** Nothing
**Next Steps:**
1. Run `docs/migrations/001_rls_phase1.sql` in Supabase SQL Editor
2. Run `npm run lint` and fix any issues
3. Run `npm run build` to confirm no TypeScript errors
4. Create Andy's admin account in Supabase Auth (role: 'admin' in user_metadata)
5. Smoke test: create a course type → create a course with sessions → view detail
6. Start Phase 2 (student browse + register)
**Context:**
- Course creation form uses indexed hidden inputs (`session_date_0`, `session_start_0`, etc.) to pass dynamic session rows through FormData — server action loops until no `session_date_{i}` found
- Supabase join syntax: `instructor:profiles!courses_instructor_id_fkey` — required because profiles is referenced twice (instructor + created_by)
- Sign out is a Server Action calling `supabase.auth.signOut()` in `(auth)/actions.ts`
- No admin-side instructor creation — instructors self-register at /register (role stored in user_metadata)

---

## Session 1 — 2026-04-01
**Task:** Phase 0 — Infrastructure
**Completed:** All 13 tasks. Next.js 16 + Tailwind v4 + shadcn/ui scaffolded. Supabase project created, schema applied, Auth configured. Supabase browser/server clients wired up. proxy.ts (auth guard + role routing). Root layout with Geist font. Login + register pages with server actions. Role-based dashboard placeholders. RLS policies on profiles table. Vercel deployed and verified.
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** Phase 1 — start with 1.1 (admin dashboard placeholder stats) then 1.2 (course types CRUD)
**Context:**
- Next.js 16 uses `proxy.ts` not `middleware.ts` — already updated
- Route groups don't add URL segments — dashboards live at `/admin/dashboard`, `/instructor/dashboard`, `/student/dashboard`
- Role stored in `user.user_metadata.role` — set at registration, read by proxy.ts (no DB query per request)
- Turbopack cache issues: `rm -rf .next` fixes it. Don't change next.config.ts while server is running.
- Tailwind v4 — no tailwind.config.js, configured via CSS imports
- shadcn Maia preset adds Figtree font — we replaced it with Geist to match brand spec
- Admin user (Andy) needs to be created directly in Supabase Auth with role: 'admin' in user_metadata

---

## Session 0 — 2026-04-01
**Task:** Project setup — CLAUDE.md, @pm agent, session log
**Completed:**
- Created `CLAUDE.md` with full project context, conventions, file structure, commands, and agent workflow
- Created `.claude/agents/pm.md` — @pm agent ready to use
- Created `session-log.md` (this file)
**In Progress:** Nothing — groundwork complete
**Blocked:** Nothing
**Next Steps:** Phase 0.1 — run `npx create-next-app@latest` in the repo root, then tackle 0.2–0.13 in order
**Context:**
- Repo is docs-only right now — no app code exists yet
- Supabase project has not been created yet — do that alongside 0.3
- Schema SQL is in `docs/sailbook-schema.sql` — ready to run once Supabase project exists
- Read `docs/PROJECT_PLAN.md` Phase 0 checklist before starting

## Session 15 — 2026-04-05 23:03–23:30 (0.5 hrs)
**Duration:** 0.5 hours
**Task:** Phase 4.1 — Instructor dashboard
**Completed:**
- Cleaned up instructor dashboard: removed duplicate unused query, dead types
- Fixed Total Students to count unique students (was double-counting across sessions)
- Fixed "Roster →" link from `/admin/courses/` to `/instructor/sessions/` (4.2 target)
- Extracted `StatCard` component matching admin dashboard pattern
- Added `courses.status = 'active'` filter — draft/cancelled/completed courses excluded
- Wrote QA test cases for 4.1 in docs/QA.md — all passing
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** Phase 4.2 — Session roster view (enrolled students, attendance status)
**Context:** Roster → link will 404 until 4.2 builds `/instructor/sessions/[id]`
