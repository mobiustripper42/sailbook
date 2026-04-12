# SailBook — Session Log

Session summaries for continuity across work sessions.
Format: append newest entry at the top.

## Session 44 — 2026-04-12 18:08–18:33 (0.42 hrs)
**Duration:** 0.42 hours | **Points:** 8 pts
**Task:** Phase 0.14 — Playwright test suite for student browse + register + capacity + duplicate prevention

**Completed:**
- Created `tests/student-enrollment.spec.ts` — 24 tests (14 pass, 10 skipped by design) across 3 viewports
- Suites: browse courses, enroll flow, capacity enforcement, duplicate prevention
- Browse tests run all viewports (read-only); enrollment/capacity/duplicate tests are desktop-only
- `createTestCourse()` helper: creates + publishes a course via admin UI, returns UUID
- User-switching via `browser.newContext()` — separate context per user (admin → pw_student → jordan)
- Ran code-review agent; actioned all 7 findings in follow-up commit
- Extracted shared `tests/helpers.ts` with `loginAs()` and `runId()`; updated `admin-course-crud.spec.ts` to import from it
- Fixed `jordanCtx` context leaks (try/finally), added `'3 of 4 remaining'` spot-decrement assertion, added seed-row comments, documented duplicate-prevention server-side coverage gap
- `supabase db reset` needed before pgTAP after accumulated Playwright runs; 59/59 pgTAP + 69/69 Playwright green
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 0.15 — Playwright test suite for attendance + cancellation + makeup. Key flows: pw_student enrolled in a course → admin marks attendance (present/absent) → student sees updated attendance badge on detail page → cancellation flow (admin cancels enrollment or session) → makeup session linkage. Check existing `/admin/courses/[id]/sessions/[sessionId]/attendance` page and attendance actions before writing tests.
**Context:** `createTestCourse` is only called from desktop-only tests — `force: true` on Create Course is safe (no mobile layout conflict). `getByText('Full', { exact: true })` needed when course title contains 'Full' as substring. `supabase db reset` is routine maintenance before pgTAP — schedule it at start of any session that will run both suites. `tests/helpers.ts` is the single source for `loginAs`/`runId`/`PASSWORD` — add new shared helpers there, not inline.

## Session 43 — 2026-04-12 17:14–17:59 (0.75 hrs)
**Duration:** 0.75 hours | **Points:** 8 pts
**Task:** Phase 0.13 — Playwright test suite for admin course CRUD

**Completed:**
- Created `tests/admin-course-crud.spec.ts` — 16 passing tests across 3 viewports (5 skipped with rationale), 55/55 full suite green
- Suites: course type creation + list, course creation with session, add session to existing course, course detail cards, course type edit
- Edit test includes write verification: navigates back to edit page after save and asserts `Description` field value matches — no-op submits now fail
- Ran code-review agent; actioned `force:true` scoping and write verification findings
- Established patterns for 0.14–0.16 (see Context)
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 0.14 — Playwright test suite for student browse + register + capacity + duplicate prevention. Use `pw_student@ltsc.test`. Key flows: browse /student/courses, enroll in a course (enroll button → confirmation), try to enroll in a full course (capacity check), try to enroll twice (duplicate prevention). Supabase + dev server must be running.
**Context:** `test.skip(test.info().project.name !== 'desktop')` — use for admin tests involving the sessions table; overflow-x-auto + non-responsive sidebar make mobile/tablet button clicks unreliable as sessions accumulate. Most admin interaction tests can be desktop-only. `force: true` WITHOUT prior scrollIntoViewIfNeeded() for buttons near the sessions table — scroll repositions the element so the force-click lands on whatever was previously on top. field-sizing-content textareas: fill() appends instead of replacing when field has a value — fix with click() + Ctrl+A + keyboard.type(). page.locator('main form').evaluate(f => f.requestSubmit()) when multiple forms on page. runId() helper for unique test data per run (avoids unique constraint re-run failures). Write verification pattern: after save redirect, goto(editUrl) and assert field value. Code-review agent run post-commit; findings addressed in follow-up commit.

## Session 42 — 2026-04-12 08:53–09:41 (0.75 hrs)
**Duration:** 0.75 hours | **Points:** 3 pts
**Task:** Phase 0.12 — Playwright test suite for auth flows

**Completed:**
- Created tests/auth.spec.ts — 13 tests across 4 suites: role routing (admin/instructor/student/dual-role), unauthenticated access (4 protected routes), cross-role protection (3 cases), login page behavior (wrong password, already-logged-in redirect)
- Fixed login action (src/app/(auth)/actions.ts): now reads user_metadata from signInWithPassword response and redirects directly to role dashboard instead of routing through / — proxy no longer responsible for post-login hop
- Renamed proxy function from `middleware` → `proxy` (Next.js 16 convention; proxy.ts is the correct filename, proxy is the correct export name)
- Fixed playwright.config.ts: switched mobile/tablet from WebKit (not installed) to Chromium browserName with 375px / 768px viewports
- Installed playwright system deps (libnspr4 etc.) to unblock Chromium headless
- 39/39 passing across mobile (375px), tablet (768px), desktop (1440px)
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 0.13 — Playwright test suite for admin course CRUD (create course type, create course, add sessions). Full admin catalog flow — first big multi-step Playwright tests. Supabase + dev server must be running.
**Context:** Next.js 16 uses proxy.ts (not middleware.ts) — function must be named `proxy`. Login action now redirects directly to role dashboard; proxy still guards cross-role access and unauthenticated requests but is NOT in the post-login path. Playwright mobile/tablet use Chromium (not WebKit) — webkit not installed, Chromium covers the viewport breakpoints we care about. login() helper in tests uses waitForURL(/dashboard/) to ensure session is fully settled before any subsequent page.goto() calls. The proxy's getUser() in Playwright contexts does not reliably see cookies set by Server Action redirects — hence the direct-redirect fix in the login action.

## Retroactive credit — 2026-04-12
**Duration:** 0.25 hrs | **Points:** 8 pts (0.18 + 0.19 + 0.20)
Tasks 0.18, 0.19, 0.20 completed before V2 work formally began: session skills, CLAUDE.md update, docs update.

## Session 41 — 2026-04-12 08:39–08:46 (0.08 hrs)
**Duration:** 0.08 hours | **Points:** 3 pts
**Task:** Phase 0.11 — Install Playwright + MCP servers, configure viewports
**Completed:**
- Installed @playwright/test v1.59.1 + Chromium headless browser
- Created playwright.config.ts with 3 viewport projects: mobile (375px), tablet (768px), desktop (1440px)
- Created .mcp.json with @playwright/mcp and a11y-mcp-server configured
- Created tests/ directory for Playwright test suite
- Confirmed build clean post-install
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 0.12 — Playwright test suite for auth flows. Login as admin (andy@ltsc.example), instructor (mike@ltsc.example), student (sam@ltsc.example). Verify each lands on correct dashboard. Requires `supabase start` + `npm run dev` running before `npx playwright test`.
**Context:** Playwright v1.59.1. MCP servers live in .mcp.json (project root), not .claude/settings.json — project settings schema rejects mcpServers. Viewports: 375/768/1440. baseURL is http://localhost:3000. Tests run against local Supabase stack.

## Session 40 — 2026-04-12 00:35–00:52 (0.25 hrs)
**Duration:** 0.25 hours | **Points:** 3 pts
**Task:** Phase 0.10 — RLS audit
**Completed:**
- Full audit of all 28 RLS policies across 6 tables — no uncovered tables in V1
- Found & fixed: "Students can update own enrollments" WITH CHECK had no status restriction; now restricted to status='cancelled' only (`supabase/migrations/20260412044427_rls_enrollment_update_restriction.sql`)
- Found & fixed: get_enrolled_course_ids included cancelled enrollments — students could see sessions for courses they'd cancelled from
- Found & fixed (code review follow-up): get_student_enrollment_ids also included cancelled enrollments — students could read/update attendance for cancelled enrollments
- Found & fixed (code review follow-up): students could cancel completed enrollments; USING clause now blocks status='completed' rows (`supabase/migrations/20260412045055_rls_student_attendance_cancelled_fix.sql`)
- Created `supabase/tests/04_rls_gaps.sql` — 11 tests: write-blocks for students/instructors, status escalation prevention, cancelled-enrollment visibility fix, completed-enrollment cancel guard
- Ran code-review agent post-commit; two findings actioned
- 59/59 pgTAP tests passing
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 0.11 — Install Playwright + Playwright MCP + a11y-mcp-server, configure viewports (375/768/1440). `npm init playwright@latest`. MCP config in `.claude/settings.json`.
**Context:** Documented intentional non-fix: admin has no DELETE policy on profiles (correct by design — deleting profiles should go through Supabase Auth admin tools, not RLS). get_student_enrollment_ids and get_enrolled_course_ids now both exclude cancelled enrollments — keep these in sync when adding future enrollment statuses. Student enrollment UPDATE policy allows only status='cancelled' AND only when starting status != 'completed'. The code-review agent caught two real gaps in the first commit.

## Session 39 — 2026-04-12 00:27–00:34 (0.08 hrs)
**Duration:** 0.08 hours | **Points:** 5 pts
**Task:** Phase 0.9 — pgTAP RLS tests for enrollments and session_attendance
**Completed:**
- Created `supabase/tests/03_rls_enrollments.sql` — 16 tests
- enrollments: anon blocked, admin sees all 6 + can update, sam sees own 3 (not alex's), sam can INSERT own / throws 42501 on another student's, mike sees 5 (c001+c004+c006), chris sees 1 (c002)
- session_attendance: anon blocked, admin sees all 17, sam sees own 8 (not alex's), mike sees 13 (assigned sessions), chris sees 4
- `supabase test db` passes 48/48 (smoke + profiles + courses + enrollments)
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 0.10 — RLS audit: review all policies for gaps found (or not found) by the pgTAP suite. Compare against spec. Flag anything suspicious before moving to Playwright in 0.11.
**Context:** throws_ok 2-arg form matches error message, not test name — always use 4-arg form: throws_ok(sql, '42501', NULL, description). RLS violation SQLSTATE = 42501. 48/48 tests passing; full RLS coverage for profiles, course_types, courses, sessions, enrollments, session_attendance.

## Session 38 — 2026-04-12 00:17–00:22 (0.08 hrs)
**Duration:** 0.08 hours | **Points:** 5 pts
**Task:** Phase 0.8 — pgTAP RLS tests for course_types, courses, sessions
**Completed:**
- Created `supabase/tests/02_rls_courses.sql` — 13 tests
- course_types: anon blocked, authenticated sees active only (4/5), admin sees all (5/5)
- courses: admin sees all 6, student sees active+enrolled (5, not draft c005), instructor (mike) sees only assigned (3)
- sessions: admin sees all 14, student sees 13 (not d009 draft), instructor sees 9
- `supabase test db` passes 32/32 (smoke + profiles + courses)
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 0.9 — pgTAP RLS tests for enrollments and session_attendance. Highest-risk tables. Same authenticate() pattern. Test student sees own, instructor sees assigned course enrollments, admin sees all.
**Context:** RLS policies combine with OR — student sees active courses UNION enrolled courses (explains why sam sees completed c004). Session count math: active courses (11 sessions) + enrolled adds d007-d008 = 13 total.

## Session 37 — 2026-04-12 00:08–00:15 (0.08 hrs)
**Duration:** 0.08 hours | **Points:** 3 pts
**Task:** Phase 0.7 — pgTAP RLS tests for profiles
**Completed:**
- Created `supabase/tests/01_rls_profiles.sql` — 12 tests across 4 roles (anon, admin/andy, student/sam, instructor/mike)
- Covers all 7 profiles policies: admin all, anyone reads instructors, users read/update own, instructors read their students
- Established `tests.authenticate()` helper + role-switching pattern (SELECT tests.authenticate(...); SET LOCAL ROLE authenticated; ... RESET ROLE)
- Fixed: PERFORM → SELECT for void function calls in plain SQL context
- `supabase test db` passes 19/19 (smoke + profiles)
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 0.8 — pgTAP RLS tests for course_types, courses, sessions. Reuse authenticate() helper pattern from 01_rls_profiles.sql.
**Context:** PERFORM is PL/pgSQL only — use SELECT for void function calls in plain SQL test files. authenticate() is SECURITY DEFINER so it works even when called as authenticated role. Verify-as-postgres pattern: reset role, then SELECT to confirm blocked writes didn't land.

## Session 36 — 2026-04-12 00:03–00:06 (0.08 hrs)
**Duration:** 0.08 hours | **Points:** 3 pts
**Task:** Phase 0.6 — pgTAP setup
**Completed:**
- Created `supabase/tests/00_smoke.sql` — 7 tests: pgTAP alive + all 6 core tables exist (profiles, course_types, courses, sessions, enrollments, session_attendance)
- `supabase test db` passes 7/7 — pipeline confirmed working
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 0.7 — pgTAP RLS tests for `profiles` table (all roles × CRUD). This is the template test file — patterns established here carry into 0.8/0.9.
**Context:** Test files live in `supabase/tests/`. Format: BEGIN; SELECT plan(N); ... tests ... SELECT * FROM finish(); ROLLBACK; Supabase handles pgTAP extension setup automatically — no manual CREATE EXTENSION needed in test files.

## Session 35 — 2026-04-11 23:57–00:02 (0.08 hrs)
**Duration:** 0.08 hours | **Points:** 2 pts
**Task:** Phase 0.5 — Smoke test local Supabase
**Completed:**
- Updated `.env.local` to point at local Supabase (http://127.0.0.1:54321) with prod commented out for easy switching
- Confirmed `npm run dev` + login shows seed data users (not prod users)
- Smoke test passed — app running against local DB
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 0.6 — pgTAP setup. `CREATE EXTENSION pgtap` in test helper, create `supabase/tests/` structure, run a trivial test to confirm `supabase test db` works.
**Context:** `.env.local` has local/prod toggle via comments. Local is currently active. `.env.local` is gitignored — switching envs is manual.

## Session 34 — 2026-04-11 23:47–23:55 (0.17 hrs)
**Duration:** 0.17 hours | **Points:** 2 pts
**Task:** Phase 0.4 — Seed data (supabase/seed.sql)
**Completed:**
- Created `supabase/seed.sql` from demo-seed.sql — 7 demo users + 3 Playwright test users (pw_admin, pw_instructor, pw_student; f1 UUID block)
- Fixed two local Supabase quirks: `extensions.crypt()`/`extensions.gen_salt()` (pgcrypto in extensions schema, not public) and schema-qualified all table names (Supabase batches seed SQL, SET search_path doesn't carry across batches)
- `supabase db reset` runs clean — migration + seed both apply without errors
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 0.5 — Smoke test. `supabase db reset` → `npm run dev` → log in as each role (andy, mike, sam) → verify correct dashboard loads against local DB.
**Context:** Seed table names must be schema-qualified (public.profiles, etc.) — bare names fail because Supabase splits seed.sql into batches and search_path doesn't persist. crypt/gen_salt must use extensions.crypt()/extensions.gen_salt(). All passwords: qwert12345.

## Session 33 — 2026-04-11 23:28–23:44 (0.25 hrs)
**Duration:** 0.25 hours | **Points:** 5 pts
**Task:** Phase 0.2–0.3 — Finish local Supabase init + baseline migration
**Completed:**
- 0.2 done (was already complete coming in — confirmed and marked off)
- 0.3: Ran `supabase login`, linked to remote project `sbbcfnivtnakgvgtchre`
- Dumped prod schema to `supabase/migrations/000_baseline.sql` (28 policies + helper functions)
- Verified `supabase db reset` applies migration cleanly — local stack healthy
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 0.4 — Create `supabase/seed.sql`. Rebuild from demo-seed data (dev-seed-qa is stale). Add Playwright test users. Verify seed runs automatically on `supabase db reset`.
**Context:** Docker image pull on first reset is normal (one-time cache). Subsequent resets are fast/local only. `supabase/seed.sql` warned as missing — expected, not yet created.

## Session 32 — 2026-04-11 23:09–23:23 (0.25 hrs)
**Duration:** 0.25 hours | **Points:** 2 pts
**Task:** Phase 0.2 — Initialize local Supabase
**Completed:**
- `supabase init` run — `supabase/config.toml` created with `project_id = "sailbook"`
- Discussed Supabase CLI install options (brew/npm/direct download)
- Confirmed `supabase start` output format and how to verify stack is running (`supabase status`, `docker ps`)
**In Progress:** 0.2 — CLI install method not yet chosen; `supabase start` not yet run
**Blocked:** Nothing
**Next Steps:** Install Supabase CLI (`brew install supabase/tap/supabase` or `npm install -g supabase`), then `supabase start` — first run pulls Docker images, watch for port conflict on 5432
**Context:** `supabase init` already done — do NOT re-run. `project_id = "sailbook"`. Ports: API 54321, DB 54322, Studio 54323.

## Session 31 — 2026-04-11 21:06–21:15 (0.17 hrs)
**Duration:** 0.17 hours | **Points:** 2 pts
**Task:** Phase 0.1 — Docker Desktop install
**Completed:**
- Docker Desktop 29.3.1 installed on Windows with WSL2 integration enabled
- Verified `docker --version` and `docker ps` work in WSL2 without sudo — clean
- Task 0.1 complete
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 0.2 — `supabase init` then `supabase start` (first run pulls Docker images, may take a few minutes)
**Context:** Docker is fully operational in WSL2. `supabase start` will be the first real test — watch for port conflicts on 5432 (postgres).