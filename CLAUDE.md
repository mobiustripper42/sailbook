# SailBook — Claude Code Project Context

## What We're Building
Scheduling and enrollment management system for Learn To Sail Cleveland (LTSC). Single school, single season. Target launch: **May 15, 2026**.

Replaces manual scheduling with a web app where:
- **Admin (Andy)** manages course types, courses, sessions, enrollments, attendance, and makeups
- **Instructors** view their assigned sessions and rosters
- **Students** self-register for courses and track their own attendance

## Stack
- **Frontend:** Next.js 14+ (App Router), Tailwind CSS, shadcn/ui, Geist font
- **Backend:** Supabase (PostgreSQL + Auth + Row Level Security) — no separate API server
- **Hosting:** Vercel (frontend), Supabase Cloud (database)

## Key Docs
| File | Purpose |
|------|---------|
| `docs/SPEC.md` | What we're building — scope, V1 vs V2 |
| `docs/DECISIONS.md` | Why we made each architectural choice |
| `docs/USER_STORIES.md` | What each role does (AS-*, ST-*, IN-* IDs) |
| `docs/PROJECT_PLAN.md` | Phases, tasks, current status |
| `docs/AGENTS.md` | Agent workflow and prompt patterns |
| `docs/sailbook-schema.sql` | Canonical database schema |
| `session-log.md` | Session-to-session continuity log |

## Core Data Model
```
course_types → courses → sessions
                    ↓
               enrollments (student × course)
                    ↓
          session_attendance (student × session)
                    ↓
          makeup_session_id (cross-course makeup reference)
```

## Project File Structure (target)
```
sailbook/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (admin)/
│   │   │   ├── layout.tsx
│   │   │   └── admin/
│   │   │       ├── dashboard/page.tsx
│   │   │       ├── courses/
│   │   │       ├── course-types/
│   │   │       ├── sessions/
│   │   │       └── students/
│   │   ├── (instructor)/
│   │   │   ├── layout.tsx
│   │   │   └── instructor/
│   │   │       └── dashboard/page.tsx
│   │   ├── (student)/
│   │   │   ├── layout.tsx
│   │   │   └── student/
│   │   │       ├── dashboard/page.tsx
│   │   │       └── courses/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/           # shadcn/ui components (do not edit directly)
│   │   └── [feature]/    # feature-specific components
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts     # browser client
│   │   │   ├── server.ts     # server client (Server Components / Server Actions)
│   │   │   └── types.ts      # generated DB types
│   │   └── utils.ts
│   └── proxy.ts
├── docs/             # project documentation
├── session-log.md    # session continuity log
└── CLAUDE.md         # this file
```

## Conventions

### TypeScript
- Strict mode on. No `any`.
- Use generated Supabase types from `lib/supabase/types.ts`. Regenerate with `npx supabase gen types typescript --local > lib/supabase/types.ts` after schema changes.

### Components
- Server Components by default. Add `'use client'` only when needed (event handlers, hooks, browser APIs).
- shadcn/ui components live in `components/ui/`. Don't edit them directly — extend or wrap instead.
- Feature components live in `components/[feature]/` (e.g., `components/courses/`, `components/attendance/`).
- Keep components under 200 lines. Split if larger.

### Data Fetching
- Server Components fetch directly via Supabase server client.
- Mutations go through Server Actions (not API routes).
- Client-side data (real-time, after interaction) uses Supabase browser client.

### Auth & RLS
- All auth through Supabase Auth. No custom JWT handling.
- Role is in `profiles.role` — check it via `auth.uid()` in RLS policies.
- Every table needs RLS policies before shipping. No table is accessible without explicit policy.
- Middleware (`middleware.ts`) handles role-based redirects: `/admin/*`, `/instructor/*`, `/student/*`.

### Database
- Schema source of truth: `docs/sailbook-schema.sql`.
- Instructor on session: `NULL` means use course default (`DEC-007`).
- Makeups: `session_attendance.makeup_session_id` can reference any session, cross-course (`DEC-006`).
- No schools table — single-tenant by design (`DEC-008`).

### Naming
- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Server Actions: `camelCase` in `actions/` files or co-located with feature
- DB columns: `snake_case` (matches Supabase)

### UI / Brand
- Colors: white/black base, navy and gray accents. No color for color's sake.
- Font: Geist Sans (Vercel default in Next.js 14+)
- No nautical kitsch — no anchors, rope borders, or "ahoy"
- shadcn/ui defaults. Override only when necessary.

## Commands
```bash
npm run dev          # local dev server (localhost:3000)
npm run build        # production build
npm run lint         # ESLint
npx supabase start   # start local Supabase (Docker)
npx supabase stop    # stop local Supabase
npx supabase gen types typescript --local > lib/supabase/types.ts  # regenerate types
```

## Workflow Note
- **Diagnostic commands** (build, lint, type check, test): run these with the Bash tool directly — see errors, fix them, don't bother the user.
- **Environment-changing commands** (npm install, supabase migrations, git push, deploys): output these for the user to run in their own terminal.

## Tone
Occasional dry humor and sarcasm are welcome. Don't overdo it — one good line beats three forced ones.

## Agent Workflow

### Starting a session
1. Check `session-log.md` for last entry — read "Next Steps" and "In Progress"
2. Check `docs/PROJECT_PLAN.md` for current phase task list
3. Open a named session for the task: `claude -n "phase-X-task-name"`

### During a session
- Use `@architect` (Opus) before committing to a new pattern or adding a dependency
- Use `@code-review` (Sonnet) after completing a task or set of commits

### Ending a session
1. Commit all work
2. Run `/compact` if above 50% context
3. Append a session summary to `session-log.md` in this format:

```markdown
## [Session Name] — [Date] [Time]
**Task:** What you were working on
**Completed:** What got done
**In Progress:** What's partially done (with file paths and line numbers)
**Blocked:** Anything waiting on a decision or external input
**Next Steps:** Exactly what to do when you sit back down
**Context:** Gotchas, weird behavior, things you'll forget
```

The summary must be detailed enough for a cold-start session to get productive in under 2 minutes.

## Scope Discipline
V1 ships May 15. When in doubt, check `docs/SPEC.md` section "Not V1."

Features explicitly out of scope:
- Payment processing
- Student self-cancellation
- Email/SMS notifications
- Automated makeup suggestions
- Multi-school / multi-tenant
- Waitlists
