# SailBook — Project Context

Everything specific to **this** project. The seeds-managed `CLAUDE.md` shell reads this file at session start and treats it as authoritative for project-specific facts (DEC-S019). Nothing here syncs from seeds — it's yours to edit freely.

## What We're Building

Scheduling, enrollment, and payment management system for Learn to Sail Cleveland. Single school, single season. Replaces manual scheduling with a web app.

Roles:
- **Admin (Andy)** — manages course types, courses, sessions, enrollments, attendance, makeups, payments, refunds, and notifications.
- **Instructors** — view assigned sessions, rosters with student details, and add session notes.
- **Students** — self-register, pay via Stripe, view schedule and attendance, cancel enrollments, manage notification preferences.

## Stack
- **Frontend:** Next.js 16+ (App Router), Tailwind CSS, shadcn/ui, IBM Plex Sans + IBM Plex Mono (Muster design system, DEC-039)
- **Backend:** Supabase (PostgreSQL + Auth + Row Level Security) — no separate API server
- **Payments:** Stripe (Checkout Sessions, webhooks)
- **Notifications:** Twilio (SMS), Resend (email)
- **Hosting:** Vercel (frontend), Supabase Cloud (database)
- **Testing:** pgTAP (RLS), Playwright (integration), axe-core (accessibility)

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

## Commands
```bash
# Development
npm run dev                    # local dev server (localhost:3300)
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
npx playwright test            # run integration tests (full suite — user's call only)
npx playwright test tests/foo.spec.ts --project=desktop  # targeted, dev mode
npx playwright test --ui       # run with browser UI

# Types
npx supabase gen types typescript --local > src/lib/supabase/types.ts
```

## Additional Docs

Project-specific docs beyond the baseline `## Key Docs` table in the `CLAUDE.md` shell:

| File | Purpose |
|------|---------|
| `docs/DEPLOYMENT.md` | Production-branch deploy setup — Vercel `production` branch, Supabase staging/prod refs, env-var wiring (DEC-029). |
| `docs/sailbook-schema.sql` | Reference schema (migrations under `supabase/migrations/` are the source of truth). |
| `docs/EMAIL_SETUP.md` | Resend email configuration. |
| `docs/NOTIFICATION_SETUP.md` | Twilio SMS + notification preference wiring. |
| `docs/HETZNER_DEV.md` | Remote dev-server (Hetzner) setup notes. |
| `docs/QA.md` | Manual QA checklist. |
| `docs/SECURITY_AUDIT_V2.md` | V2 security audit findings + remediation. |
| `docs/session-log-archive.md` | Legacy archive — pre-V2 sessions (1–133). New sessions write to the orphan `sessions` branch. |

## Workflow Overrides

SailBook is the standard webapp shape the shell's `## Micro Workflow` assumes (Next.js + Supabase + Playwright + pgTAP + 375px screenshot) — the shell's default workflow applies as-is. Two project notes:

- **No test, no push.** RLS-touching changes require a pgTAP test; behavior changes require a Playwright test.
- **Full suite (`npx playwright test`) is never run automatically** — the database may be in use. Targeted runs (`--project=desktop` on one spec) are fine during development. Ask before the full suite.
- External services (Twilio, Resend, Stripe) are mocked in test mode; `NOTIFICATIONS_ENABLED=false` in the test environment.

## Migration Protocol (project)

The migration **discipline** lives in the shell's `## Migration Protocol`. This is SailBook's **toolchain**.

**All schema changes go through `supabase/migrations/`.** No exceptions.

- Create migration: `supabase migration new descriptive_name`
- Test locally: `supabase db reset` (replays all migrations + seed)
- `supabase/seed.sql` runs automatically on `db reset` — use for test data
- After schema changes: regenerate types with `npx supabase gen types typescript --local > src/lib/supabase/types.ts`
- Never edit schema through the Supabase dashboard on any environment.

**Deploy-time migration order (DEC-029 production-branch model):**
- Apply to **staging/preview** Supabase BEFORE merging the feature PR: `supabase link --project-ref <staging-ref> && supabase db push`.
- After `/promote-production` ships `main` → `production`: apply to **prod** Supabase: `supabase link --project-ref <prod-ref> && supabase db push`.
- Never push a migration to prod that hasn't run on staging.

**Pre-promote QA gate.** `main` deploys to `dev-sailbook.vercel.app`, the shared QA environment for auth/OAuth/Stripe-checkout flows — Google OAuth and checkout redirects only work reliably on this fixed domain, not arbitrary per-PR preview URLs (see `docs/DEPLOYMENT.md`, "QA a branch on dev-sailbook.vercel.app"). Before running `/promote-production`, confirm `dev-sailbook.vercel.app` was QA'd against this release: Git Branch repointed to `main`, and actually looked at since the last merge. Promoting without this QA is what caused issue #99. This is SailBook's answer to the generic Step 0.5 QA-confirm gate in the `promote-production` skill.

**Production write protection (DEC-S009) — recommended hardening.** SailBook does not yet ship `scripts/safe-supabase.sh`. Until it does, the discipline is the guard: only `supabase link` to staging or local from a dev box; the explicit prod push above is the single sanctioned exception. To adopt the wrapper, copy `dev/claude/scripts/safe-supabase.sh` from seeds and list the prod ref in `.claude/prod-supabase-refs` (gitignored).

## Conventions

### TypeScript
- Strict mode on. No `any`.
- Use generated Supabase types from `lib/supabase/types.ts`. Regenerate after every schema change.

### Components
- Server Components by default. Add `'use client'` only when needed.
- shadcn/ui components in `components/ui/` — don't edit directly.
- Feature components in `components/[feature]/`. Keep components under 200 lines; split if larger.

### Data Fetching
- Server Components fetch directly via Supabase server client.
- Mutations go through Server Actions (not API routes).
- **Exception:** the Stripe webhook uses an API route (it's a mailbox, not an API layer).
- Client-side data (real-time, after interaction) uses the Supabase browser client.

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
- Configurable values go in the `codes` table, not hardcoded enums.

### Naming
- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Server Actions: `camelCase` in `actions/` files
- DB columns: `snake_case`
- Migrations: `supabase/migrations/YYYYMMDDHHMMSS_descriptive_name.sql`

### UI / Brand
- **Design system: the Muster language (DEC-039, supersedes D-018).** Adopted in the V3 UI redesign (PROJECT_PLAN Phase 10). The old Mira/Sky/Nunito preset is retired — do not build against it.
- Font: **IBM Plex Sans** (UI) + **IBM Plex Mono** (all meaningful numerals — times, counts, capacities, prices, codes).
- Color: harbor slate-blue accent, split `--accent` (expressive) vs `--accent-solid` + `--on-accent` (fill behind white text). Semantic chips ok/warn/bad/info (tint-bg + line) encode state, never decorate. `--faint` is AA-safe for text.
- Both themes first-class (light primary); ~12px radius; two shadow levels; a system `:focus-visible` token.
- Layout padding in layout.tsx only (DEC-017). No nautical kitsch (sail-mark logo aside). Every page works at 375px, in both themes.
- **Authoritative tokens: `docs/BRAND.md`. Reference implementation: `docs/design/mockups/sailbook-redesign.html`** (open in a browser — every role/screen, both themes; see that dir's README). `.claude/ui-context.md` + `@ui-reviewer` are rewritten to these tokens in Phase 10 task 10.1 — until then, BRAND.md wins over any stale ui-context.md content.

### Testing
- pgTAP tests in `supabase/tests/`; Playwright tests in `tests/`.
- Playwright viewports: 375px (mobile), 768px (tablet), 1440px (desktop).
- Mock external services (Twilio, Resend, Stripe) in test mode; `NOTIFICATIONS_ENABLED=false` for test.
- **During development:** run only the relevant file + desktop project — `npx playwright test tests/foo.spec.ts --project=desktop`.
- **Single test:** `npx playwright test -g "test name" --project=desktop`.
- **Before pushing:** the user runs the full suite — `npx playwright test` (workers=4 locally, workers=1 in CI — do not override).

## Workflow Notes (project)

Project-specific debugging gotchas. The shell's `## Workflow Notes` holds the universal rules.

- **Before starting `npm run dev`:** run `curl -s -o /dev/null -w "%{http_code}" http://localhost:3300/` first. If it returns 200, skip the start — a server is already up. Only start a new one if the check fails.
- **Bugs from Andy:** create a GitHub issue (`gh issue create`), tag `bug`, add to the current or next phase.
- **Supabase OAuth redirect URLs — use `/**` not `/*`:** in the Supabase Dashboard (Authentication → URL Configuration → Redirect URLs), use a double-star glob (`https://<domain>/**`). `/*` matches only one path segment, so `/auth/callback` fails to match and Supabase silently falls back to Site URL, landing the user on `/?code=...` with the callback route never running. Symptom: "auth almost works" but OAuth codes don't get exchanged.
