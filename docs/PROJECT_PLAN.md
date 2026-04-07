# SailBook — Project Plan

**Target:** May 15, 2026
**Today:** April 6, 2026
**Available:** 40 days (6 weeks)

---

## Phase 0: Infrastructure (Days 1–2)
Get the project running locally with auth working end-to-end.

- [x] 0.1 — Create GitHub repo, initialize Next.js 14+ with App Router
- [x] 0.2 — Install and configure Tailwind CSS + shadcn/ui
- [x] 0.3 — Create Supabase project, run schema SQL
- [x] 0.4 — Configure Supabase Auth (email/password)
- [x] 0.5 — Set up environment variables (.env.local)
- [x] 0.6 — Wire up Supabase client in Next.js
- [x] 0.7 — Build middleware.ts (auth guard + role routing)
- [x] 0.8 — Create root layout with auth provider
- [x] 0.9 — Build login page + registration page
- [x] 0.10 — Verify: can create account, log in, get redirected by role
- [x] 0.11 — Connect Vercel to GitHub repo, verify deploy
- [x] 0.12 — Write CLAUDE.md for Claude Code (project context, conventions, file structure)
- [x] 0.13 — Set up RLS policies for profiles table

**Demo:** Log in as admin, student, or instructor → land on correct (empty) dashboard.

---

## Phase 1: Admin — Course Catalog & Creation (Days 3–7)
Admin can set up the school's offerings.

- [x] 1.1 — Admin dashboard page (placeholder stats)
- [x] 1.2 — Course types CRUD — list, create, edit, deactivate
- [x] 1.3 — RLS policies for course_types table
- [x] 1.4 — Course creation form — select type, instructor, capacity, price
- [x] 1.5 — Session creation within course — add multiple sessions with date/time/location
- [x] 1.6 — Course list page — all offerings with status, enrollment count
- [x] 1.7 — Course detail page — sessions, enrollments, edit capability
- [x] 1.8 — RLS policies for courses and sessions tables
- [x] 1.9 — Instructor management — list, add, deactivate

**Demo:** Admin creates ASA 101 Weekend (2 sessions), ASA 101 Evenings (4 sessions), and Open Sailing (weekly sessions). Assigns instructors.

---

## Phase 2: Student — Browse & Register (Days 8–12)
Students can find and sign up for courses.

- [x] 2.0 — Migrate role model: replace single `role` column with `is_admin`, `is_instructor`, `is_student` boolean flags. Update proxy.ts, RLS policies, registration, and types. (Do this first — Phase 2 bakes role assumptions in deeper.)
- [x] 2.1 — Student dashboard — stat cards (enrolled courses, upcoming sessions), next session highlight, upcoming courses list
- [x] 2.2 — Course browse page — available courses with spots remaining
- [x] 2.3 — Course detail view (student-facing) — type, schedule, instructor, price
- [x] 2.4 — Registration flow — enroll in a course
- [x] 2.5 — Capacity enforcement — can't register if full
- [x] 2.6 — Duplicate enrollment prevention
- [x] 2.7 — My courses page — enrolled courses with session schedule; list view with line/card toggle; filter by status (upcoming, past, all)
- [x] 2.8 — RLS policies for enrollments table
- [x] 2.9 — Student list + edit for admin — view all students, edit profile details
- [x] 2.10 — Instructor edit for admin — edit profile details (name, phone, etc.)

**Demo:** Student browses courses, registers for ASA 101 Weekend, sees it in "My Courses" with session dates. Admin sees enrollment.

---

## Phase 3: Attendance & Cancellations (Days 13–18)
The real operational value — tracking who showed up.

- [x] 3.1 — Attendance page for admin — select session, mark each student `[effort: 4]`
- [x] 3.2 — Auto-create attendance records when student enrolls (status: expected) `[effort: 2]`
- [x] 3.3 — Cancel session flow — mark reason, flip attendance to missed `[effort: 3]`
- [x] 3.4 — Create makeup session flow — new session, assign affected students `[effort: 4]`
- ~~3.5 — Cross-course makeup — assign students from different courses~~ **(deferred to V2 — PO decision 2026-04-04)**
- ~~3.6 — Makeup tracking — link makeup_session_id on attendance records~~ **(deferred to V2 — PO decision 2026-04-04)**
- [x] 3.7 — Admin view: students with outstanding missed sessions `[effort: 2]` <!-- completed 2026-04-05 -->
- [x] 3.8 — Student view: my attendance history + missed sessions needing makeup `[effort: 3]` <!-- completed 2026-04-05 -->
- [x] 3.9 — RLS policies for session_attendance table `[effort: 3]` <!-- completed 2026-04-05 -->
- [x] 3.10 — Student course view: show session status (cancelled badge, missed indicator) and filter/dim cancelled sessions `[effort: 2]` <!-- completed 2026-04-05 -->

**Demo:** Admin cancels a Saturday session (weather). Creates makeup. Assigns affected students. Attendance tracked correctly. *(Cross-course makeup deferred to V2.)*

---

## Phase 4: Instructor Views (Days 19–21)
Instructors see their assignments.

- [x] 4.1 — Instructor dashboard — stat cards (upcoming sessions, total students), upcoming sessions list with course name/date/time/roster count `[effort: 3]` <!-- completed 2026-04-05 -->
- [x] 4.2 — Session roster view — enrolled students, attendance status `[effort: 2]` <!-- completed 2026-04-05 -->
- [x] 4.3 — Identify makeup students in roster (from other courses) `[effort: 2]` <!-- completed 2026-04-06 -->
- [x] 4.4 — RLS policies — instructors see only their own courses/sessions `[effort: 3]` <!-- completed 2026-04-06 -->

**Demo:** Instructor logs in, sees this week's sessions, views roster with attendance.

---

## Phase 5: Polish & Ship (Days 22–28)
Make it production-ready.

- [x] 5.1 — Admin dashboard — real stats (total courses, enrollments, upcoming sessions) + "courses without instructors" warning tile `[effort: 4]` <!-- completed 2026-04-06 -->
- [x] 5.2 — Instructor swap on individual sessions (AS-9) `[effort: 2]` <!-- completed 2026-04-06 -->
- [x] 5.3 — Error handling — form validation, API errors, empty states `[effort: 3]` <!-- completed 2026-04-06 -->
- [ ] 5.4 — Loading states and optimistic UI `[effort: 2]`
- [ ] 5.5 — Mobile responsiveness pass (admin will use desktop, students may use phone) `[effort: 5]`
- [x] 5.6 — Seed data — create LTSC course types, Andy as admin, test instructor/student `[effort: 1]` <!-- completed 2026-04-07 -->
- [ ] 5.7 — End-to-end walkthrough with Andy `[effort: 4]`
- [ ] 5.8 — Bug fixes from walkthrough `[effort: 5]`
- [ ] 5.9 — Production environment variables on Vercel `[effort: 1]`
- [ ] 5.10 — DNS / custom domain (if wanted) `[effort: 1]`
- [ ] 5.11 — Duplicate course — one-click copy of a course (no sessions), drop into edit mode `[effort: 2]`
- [ ] 5.12 — Student calendar view — monthly calendar of enrolled sessions with filter (same filters as list view in 2.7); stretch goal, skip if time is tight `[effort: 4]`
- [ ] 5.13 — Evaluate Docker for local dev `[effort: 1]`
- [ ] 5.14 — Admin UI for role management — add/remove admin, instructor, student flags from profile edit pages (may defer to V2) `[effort: 3]`
- [ ] 5.15 — OAuth login — Google (and others if Supabase makes it easy); email/password remains the fallback `[effort: 2]`
- [ ] 5.16 — Development database — separate Supabase project for dev, seed data pipeline, so prod isn't polluted with test data `[effort: 3]`
- [x] 5.17 — Bug: student enrollment RLS — missing INSERT/UPDATE policy on session_attendance means attendance records silently fail to create on enrollment `[effort: 2]` <!-- completed 2026-04-06 -->
- [x] 5.18 — Dashboard: restore pending confirmation total count + "Showing N of M" notice when > 10 enrollments `[effort: 1]` <!-- completed 2026-04-07 -->
- [x] 5.19 — Student enrollment status badge — show "Pending confirmation" on course detail, my-courses, and attendance pages when enrollment status is `registered` (vs `confirmed`) `[effort: 1]` <!-- completed 2026-04-07 -->
- [x] 5.20 — Student course browse: show enrollment status on course cards — enrolled students see "Enrolled" or "Pending" badge and a "View" button instead of "View & Enroll" `[effort: 2]` <!-- completed 2026-04-07 -->
- [x] 5.21 — Student attendance page: show enrollment status badge (Enrolled / Pending) per course alongside session attendance badges `[effort: 1]` <!-- completed 2026-04-07 -->

**Demo:** Andy walks through full flow — creates a course, student registers, instructor views roster, session gets cancelled, makeup scheduled. Everything works.

---

## Estimated Effort
| Phase | Effort Pts | Est. Hours | Actual Hours | Hrs/Point | Notes |
|-------|-----------|------------|--------------|-----------|-------|
| 0 — Infrastructure | — | 4–6 | ~4 | — | Pre-tracking |
| 1 — Admin Catalog | — | 10–14 | ~8 | — | Pre-tracking |
| 2 — Student Browse | — | 8–10 | ~14 | — | Pre-tracking |
| 3 — Attendance | 21 | 12–16 | ~5.5 | ~0.26 | First tracked phase (3.5/3.6 deferred V2) |
| 4 — Instructor | 10 | 4–6 | 1.75 | 0.175 | 4/4 complete |
| 5 — Polish | 49 | 7–9 | 10.25 (in progress) | 0.64 (so far) | 16 pts done (5.1+5.17+5.2+5.3+5.18+5.19+5.20+5.21). Forecast: 0.64 hrs/pt x 33 remaining = ~21.1 hrs |
| **Total** | **80** | **48–66** | **~43.50** | — | Phases 0–4 actual: ~33.25 hrs. Phase 5 in progress: 10.25 hrs. |

### Cuttable tasks (if time is tight)
- **5.12** — Student calendar view. Explicitly labeled "stretch goal" in the task. Cut first.
- **5.13** — Docker evaluation. Nice-to-have process improvement, zero user value.
- **5.14** — Admin role management UI. Can manage roles via Supabase dashboard or SQL for V1.
- **5.10** — Custom domain. Vercel subdomain works fine for launch.
- ~~**3.5/3.6** — Cross-course makeup.~~ **Cut — deferred to V2 per PO (2026-04-04).**
- **5.4** — Loading states / optimistic UI. Functional without it, just feels slower.

---

## Session Management (from Workflow 1)
- One named CC session per task: `claude -n "phase-0-auth"`
- `/compact` at 50% context
- `/clear` when switching phases
- Commit before ending any session
- Opus for architecture decisions and hard bugs
- Sonnet for routine implementation

## Key Files for Claude Code
- `CLAUDE.md` — project conventions, file structure, commands
- `docs/SPEC.md` — what we're building
- `docs/DECISIONS.md` — why we made each choice
- `docs/USER_STORIES.md` — what each role does
- `docs/sailbook-schema.sql` — database schema
- `session-log.md` — session continuity log
