# SailBook — Claude Code Project Context

## What We're Building
Scheduling, enrollment, and payment management system for Simply Sailing. Single school, single season.

Replaces manual scheduling with a web app where:
- **Admin (Andy)** manages course types, courses, sessions, enrollments, attendance, makeups, payments, refunds, and notifications
- **Instructors** view assigned sessions, rosters with student details, and add session notes
- **Students** self-register, pay via Stripe, view schedule and attendance, cancel enrollments, manage notification preferences

## Stack
- **Frontend:** Next.js 16+ (App Router), Tailwind CSS, shadcn/ui, Nunito Sans
- **Backend:** Supabase (PostgreSQL + Auth + Row Level Security) — no separate API server
- **Payments:** Stripe (Checkout Sessions, webhooks)
- **Notifications:** Twilio (SMS), Resend (email)
- **Hosting:** Vercel (frontend), Supabase Cloud (database)
- **Testing:** pgTAP (RLS), Playwright (integration), axe-core (accessibility)

## Key Docs
| File | Purpose |
|------|---------|
| `docs/SPEC.md` | What we're building — scope, V1 vs V2 vs V3 |
| `docs/DECISIONS.md` | Why we made each architectural choice |
| `docs/USER_STORIES.md` | What each role does (AS-*, ST-*, IN-* IDs) |
| `docs/PROJECT_PLAN.md` | Phases, tasks, estimates, velocity |
| `docs/RETROSPECTIVES.md` | Phase-end retrospectives — velocity actuals, scope changes, forecast updates |
| `docs/AGENTS.md` | Agent and skill specs |
| `docs/BRAND.md` | Philosophy, visual direction, voice |
| `docs/sailbook-schema.sql` | Reference schema (migrations are source of truth) |
| `session-log.md` | Session-to-session continuity log |
| `VELOCITY_AND_POKER_GUIDE.md` | Estimation method and tracking |

## Core Data Model
```
course_types → courses → sessions
                    ↓
               enrollments (student × course)
                    ↓
          session_attendance (student × session)
                    ↓
          makeup_session_id (cross-course makeup reference)

codes (generic lookup: experience levels, qualification types, etc.)
qualifications (admin-granted certs, prereq satisfaction)
course_type_prerequisites (prereq flagging)
invites (one-time tokens for instructor/admin onboarding)
payments (Stripe receipt history)
waitlist_entries (notify on spot opening)
```

## Micro Workflow (every task, no exceptions)

1. **Spec it** — poker estimate, acceptance criteria
2. **Plan it** — summarize what you're going to do (files to create/edit, approach). Wait for explicit approval before writing any code or running any commands.
3. **Cut the branch** — once the plan is approved: `git checkout -b task/X.Y-short-description`. Branch name includes the task ID.
4. **Build it** — implement the feature
5. **Write the test** — Playwright integration test + pgTAP if RLS-touching
6. **Run targeted tests** — `npx playwright test tests/foo.spec.ts`. `supabase test db` if RLS-touching. Do NOT run the full suite — that's the user's call.
7. **Open PR** — `/kill-this` commits, pushes branch, opens PR. Preview URL lands in the PR description.
8. **Review & ship** — tap the preview URL, address any `@code-review` findings, run full suite if RLS-touching, then `/ship-it` to merge.

**Full suite (`npx playwright test`) is never run automatically.** `/kill-this` will ask before closing out.

## Migration Protocol

**All schema changes go through `supabase/migrations/`.** No exceptions.

- Create migration: `supabase migration new descriptive_name`
- Test locally: `supabase db reset` (replays all migrations + seed)
- Apply to remote: `supabase db push`
- Never edit schema through the Supabase dashboard on any environment
- `supabase/seed.sql` runs automatically on `db reset` — use for test data
- After schema changes: regenerate types with `npx supabase gen types typescript --local > src/lib/supabase/types.ts`
- **Before creating a migration:** run `gh pr list` to check for open PRs touching the same tables. If overlap exists, merge the in-flight PR first (or rename the new migration to a later timestamp to keep ledger order clean).

## Commands
```bash
# Development
npm run dev                    # local dev server (localhost:3000)
npm run build                  # production build
npm run lint                   # ESLint

# Database (local Supabase)
supabase start                 # start local Supabase (Docker)
supabase stop                  # stop local Supabase
supabase db reset              # wipe + replay all migrations + seed
supabase migration new name    # create new migration file
supabase db push               # apply migrations to remote project

# Testing
supabase test db               # run pgTAP RLS tests
npx playwright test            # run integration tests
npx playwright test --ui       # run with browser UI

# Types
npx supabase gen types typescript --local > src/lib/supabase/types.ts
```

## Conventions

### TypeScript
- Strict mode on. No `any`.
- Use generated Supabase types from `lib/supabase/types.ts`.
- Regenerate after every schema change.

### Components
- Server Components by default. Add `'use client'` only when needed.
- shadcn/ui components in `components/ui/` — don't edit directly.
- Feature components in `components/[feature]/`.
- Keep components under 200 lines. Split if larger.

### Data Fetching
- Server Components fetch directly via Supabase server client.
- Mutations go through Server Actions (not API routes).
- Exception: Stripe webhook uses an API route (it's a mailbox, not an API layer).
- Client-side data (real-time, after interaction) uses Supabase browser client.

### Auth & RLS
- All auth through Supabase Auth. No custom JWT handling.
- Role flags: `is_admin`, `is_instructor`, `is_student` (not mutually exclusive).
- Every table needs RLS policies before shipping. No table is accessible without explicit policy.
- Every RLS change requires a pgTAP test.
- Middleware (`proxy.ts`) handles role-based redirects.

### Error Handling (DEC-015)
- Form actions: return `string | null`. `null` = success, string = error message.
- Button actions: return `{ error: string | null }`.
- Never `throw` in server actions — return errors for inline feedback.

### Database
- Migrations are source of truth (not schema.sql, not the dashboard).
- Instructor on session: `NULL` means use course default (DEC-007).
- Makeups: `session_attendance.makeup_session_id` can reference any session, cross-course (DEC-006).
- No schools table — single-tenant (DEC-008).
- Configurable values go in the codes table, not hardcoded enums.

### Naming
- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Server Actions: `camelCase` in `actions/` files
- DB columns: `snake_case`
- Migrations: `supabase/migrations/YYYYMMDDHHMMSS_descriptive_name.sql`

### UI / Brand
- Theme: Mira preset (b7CSfQ4Xo), Sky/Mist, oklch color vars. No color for color's sake.
- Font: Nunito Sans (heading + body)
- Dark mode default. Light mode available via toggle. Preference stored in user profile.
- No nautical kitsch
- Use Mira theme vars as-is. Don't layer additional shadcn overrides on top.
- One border radius: xs throughout (`--radius: 0.125rem`) — never mixed
- Layout padding in layout.tsx only (DEC-017)
- Student-facing cards: `size="sm"` prop
- Every page works at 375px (enforced by the Playwright mobile project)

### Testing
- pgTAP tests live in `supabase/tests/`
- Playwright tests live in `tests/`
- Playwright viewports: 375px (mobile), 768px (tablet), 1440px (desktop)
- Mock external services (Twilio, Resend, Stripe) in test mode
- `NOTIFICATIONS_ENABLED=false` for test environment
- **During development:** run only the relevant file — `npx playwright test tests/foo.spec.ts`
- **Single test:** `npx playwright test -g "test name"`
- **Before pushing:** user runs the full suite — `npx playwright test` (workers=4 locally, workers=1 in CI — do not override)

## Session Skills

| Skill | When | What |
|-------|------|------|
| `/its-alive` | Session start | Stamp time, read context, recommend task |
| `/pause-this` | Mid-session break | Build check, commit WIP, note pause |
| `/restart-this` | Resume from pause | Reload context, continue same session |
| `/kill-this` | Session end (part 1) | Build check, commit, push branch, open PR, code review, draft log |
| `/ship-it` | After PR review passes | Merge PR, push migration if any, record ship time + wall clock |
| `/its-dead` | Session end (part 2) | Calc time + points, write log, update plan, PM recommendation |

## Agent Workflow

| Agent | Model | When | Purpose |
|-------|-------|------|---------|
| @architect | claude-opus-4-6 | Before design decisions, DEC-TBD items | Keep architecture coherent |
| @code-review | Sonnet | After every commit (wired into `/kill-this`) | Catch issues early |
| @pm | Sonnet | Start/end of sessions (via skills) | Track progress, flag risks |
| @ui-reviewer | Sonnet | After UI work, phase boundaries | Design quality |

## Model Selection

- **Main CC session:** Sonnet by default. Switch to Opus manually when you're stuck on something hard.
- **Agents:** model is set in each agent's frontmatter. Don't override unless the task warrants it.

## PR Workflow

- Each task gets a branch (`git checkout -b task/X.Y-short-description`).
- `/kill-this` opens the PR. `/ship-it` merges it.
- Keep no more than 3 open PRs at once. Prefer 1.
- Never have two open PRs with migrations touching the same table — merge one first.
- Self-approve unless Andy review is explicitly needed.

### PR Review on Mobile

- **GitHub mobile app, not web** — the native app's diff + approve + merge flow is usable.
- **Tap the Vercel preview URL first** — posted as a comment automatically. 60 seconds of clicking catches more than reading the diff.
- **Enable auto-merge** — repo Settings → enable auto-merge, then "Enable auto-merge" on each PR.
- **Branch protection:** require CI green (Vercel build + Playwright). Skip reviewer count for solo dev.
- **Checklist PR descriptions** — `/kill-this` should populate: migration? RLS change? UI at 375px?

## Workflow Notes
- **Diagnostic commands** (build, lint, type check, test): run directly — see errors, fix them, don't bother the user.
- **Environment-changing commands** (npm install, supabase migrations, git push, deploys): output these for the user to run.
- **Never rebase a task branch that already has commits on origin.** If main has advanced while a PR branch is open, leave the branch as-is — GitHub's "Update branch" button handles this at merge time. Rebasing rewrites remote history and requires a force-push, which is blocked by policy. Use `git merge --ff-only` only if explicitly asked.
- **Before starting `npm run dev`:** run `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` first. If it returns 200, skip the start — a server is already up. Only start a new one if the check fails.
- **Bugs from Andy:** Create a GitHub issue (`gh issue create`), tag `bug`, add to current or next phase.

## Approval Before Action (all tasks)
For every task — not just bugs — explain the plan and wait for approval before doing anything:
1. State what files you'll create or modify and why
2. Wait for "go", "do it", or equivalent
3. Do not write code, create files, run tests, or execute any commands until approved

## Bug Reports & Questions
When I report a bug or ask a question:
1. Explain the cause and your proposed fix
2. Wait for my approval before making any changes
3. Do not edit files, run commands, or implement fixes until I say "go" or "do it"

## Scope Discipline
Check `docs/SPEC.md` section "Not V2" before adding anything.

If a task starts feeling bigger than its estimate:
1. Stop and re-estimate
2. Update PROJECT_PLAN.md
3. If it's now a 13, break it down
4. If it's scope creep, flag it and move on

## Tone
Occasional dry humor and sarcasm are welcome. Don't overdo it — one good line beats three forced ones.
