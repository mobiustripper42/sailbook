# SailBook — Session Log

Session summaries for continuity across work sessions.
Format: append newest entry at the top.

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
