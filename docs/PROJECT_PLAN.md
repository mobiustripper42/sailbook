# SailBook — Project Plan

**Target:** May 15, 2026
**Today:** April 1, 2026
**Available:** ~6 weeks

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

- [ ] 1.1 — Admin dashboard page (placeholder stats)
- [ ] 1.2 — Course types CRUD — list, create, edit, deactivate
- [ ] 1.3 — RLS policies for course_types table
- [ ] 1.4 — Course creation form — select type, instructor, capacity, price
- [ ] 1.5 — Session creation within course — add multiple sessions with date/time/location
- [ ] 1.6 — Course list page — all offerings with status, enrollment count
- [ ] 1.7 — Course detail page — sessions, enrollments, edit capability
- [ ] 1.8 — RLS policies for courses and sessions tables
- [ ] 1.9 — Instructor management — list, add, deactivate

**Demo:** Admin creates ASA 101 Weekend (2 sessions), ASA 101 Evenings (4 sessions), and Open Sailing (weekly sessions). Assigns instructors.

---

## Phase 2: Student — Browse & Register (Days 8–12)
Students can find and sign up for courses.

- [ ] 2.1 — Student dashboard page (my enrollments)
- [ ] 2.2 — Course browse page — available courses with spots remaining
- [ ] 2.3 — Course detail view (student-facing) — type, schedule, instructor, price
- [ ] 2.4 — Registration flow — enroll in a course
- [ ] 2.5 — Capacity enforcement — can't register if full
- [ ] 2.6 — Duplicate enrollment prevention
- [ ] 2.7 — My courses page — enrolled courses with session schedule
- [ ] 2.8 — RLS policies for enrollments table
- [ ] 2.9 — Student list view for admin (AS-15)

**Demo:** Student browses courses, registers for ASA 101 Weekend, sees it in "My Courses" with session dates. Admin sees enrollment.

---

## Phase 3: Attendance & Cancellations (Days 13–18)
The real operational value — tracking who showed up.

- [ ] 3.1 — Attendance page for admin — select session, mark each student
- [ ] 3.2 — Auto-create attendance records when student enrolls (status: expected)
- [ ] 3.3 — Cancel session flow — mark reason, flip attendance to missed
- [ ] 3.4 — Create makeup session flow — new session, assign affected students
- [ ] 3.5 — Cross-course makeup — assign students from different courses
- [ ] 3.6 — Makeup tracking — link makeup_session_id on attendance records
- [ ] 3.7 — Admin view: students with outstanding missed sessions
- [ ] 3.8 — Student view: my attendance history + missed sessions needing makeup
- [ ] 3.9 — RLS policies for session_attendance table

**Demo:** Admin cancels a Saturday session (weather). Creates Wednesday makeup. Student from a different course also joins makeup. Attendance tracked correctly.

---

## Phase 4: Instructor Views (Days 19–21)
Instructors see their assignments.

- [ ] 4.1 — Instructor dashboard — my upcoming sessions
- [ ] 4.2 — Session roster view — enrolled students, attendance status
- [ ] 4.3 — Identify makeup students in roster (from other courses)
- [ ] 4.4 — RLS policies — instructors see only their own courses/sessions

**Demo:** Instructor logs in, sees this week's sessions, views roster with attendance.

---

## Phase 5: Polish & Ship (Days 22–28)
Make it production-ready.

- [ ] 5.1 — Admin dashboard — real stats (total courses, enrollments, upcoming sessions)
- [ ] 5.2 — Instructor swap on individual sessions (AS-9)
- [ ] 5.3 — Error handling — form validation, API errors, empty states
- [ ] 5.4 — Loading states and optimistic UI
- [ ] 5.5 — Mobile responsiveness pass (admin will use desktop, students may use phone)
- [ ] 5.6 — Seed data — create LTSC course types, Andy as admin, test instructor/student
- [ ] 5.7 — End-to-end walkthrough with Andy
- [ ] 5.8 — Bug fixes from walkthrough
- [ ] 5.9 — Production environment variables on Vercel
- [ ] 5.10 — DNS / custom domain (if wanted)

**Demo:** Andy walks through full flow — creates a course, student registers, instructor views roster, session gets cancelled, makeup scheduled. Everything works.

---

## Estimated Effort
| Phase | Effort | Notes |
|-------|--------|-------|
| 0 — Infrastructure | 4–6 hrs | Mostly config, one-time |
| 1 — Admin Catalog | 10–14 hrs | Heaviest CRUD |
| 2 — Student Browse | 8–10 hrs | Simpler views, enrollment logic |
| 3 — Attendance | 10–14 hrs | Most complex business logic |
| 4 — Instructor | 4–6 hrs | Read-only views |
| 5 — Polish | 8–12 hrs | Bug fixes, UX, deploy |
| **Total** | **44–62 hrs** | With Claude Code as collaborator |

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
