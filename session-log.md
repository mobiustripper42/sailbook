# SailBook — Session Log

Session summaries for continuity across work sessions.
Format: append newest entry at the top.

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
