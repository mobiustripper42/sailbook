# SailBook V2 — Project Plan

**V1 shipped:** April 9, 2026 (v1.0.0)
**V2 planning:** April 11, 2026
**Deadline:** TBD — no hard date, but Phases 0–2 (payments live) is the critical path

---

## Estimation Method

Fibonacci scale (2, 3, 5, 8, 13). See `VELOCITY_AND_POKER_GUIDE.md` for definitions.
All estimates from planning poker between Spink and Claude.
Disagreements logged in the Standing Disagreements table at the bottom.
Tests are baked into every task estimate — no separate testing tasks.

**V1 velocity baseline:** 0.38 hrs/pt lifetime across 52.75 hours and ~111 pts.

---

## Micro Workflow (every task, no exceptions)

1. Spec it (poker estimate, acceptance criteria)
2. Build it
3. Write the test (Playwright + pgTAP if RLS-touching)
4. Run the test suite — `supabase test db` + `npx playwright test`
5. Confirm 375px mobile screenshot passes
6. `/kill-this` → `/its-dead` → push

No test, no push.

---

## Phase 0: Infrastructure (do first, no feature work until green)

Everything needed to develop safely. No user-facing changes.

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 0.1 | ~~Install Docker Desktop on WSL2, verify running~~ | 2 | [x] <!-- completed 2026-04-11 --> Docker 29.3.1 + WSL2 integration verified. |
| 0.2 | ~~Initialize local Supabase (`supabase init`, `supabase start`)~~ | 2 | [x] <!-- completed 2026-04-11 --> Local stack running. |
| 0.3 | ~~Baseline migration — dump prod schema as `supabase/migrations/000_baseline.sql`~~ | 3 | [x] <!-- completed 2026-04-11 --> 28 policies + helper functions. Reset verified clean. |
| 0.4 | ~~Seed data — consolidate demo-seed into `supabase/seed.sql`, add Playwright test users~~ | 2 | [x] <!-- completed 2026-04-11 --> Schema-qualified inserts, extensions.crypt(). Reset clean. |
| 0.5 | ~~Verify: `supabase db reset` → app runs against local Supabase~~ | 2 | [x] <!-- completed 2026-04-12 --> Login confirmed, seed users visible, local DB active. |
| 0.6 | ~~pgTAP setup — install extension, create `supabase/tests/` structure, verify pipeline~~ | 3 | [x] <!-- completed 2026-04-12 --> 00_smoke.sql passes 7/7. Pipeline confirmed. |
| 0.7 | ~~pgTAP test suite — RLS tests for `profiles` table (all roles × CRUD)~~ | 3 | [x] <!-- completed 2026-04-12 --> 12 tests, 19/19 total passing. authenticate() helper established. |
| 0.8 | ~~pgTAP test suite — RLS tests for `course_types`, `courses`, `sessions`~~ | 5 | [x] <!-- completed session 38, 2026-04-12 --> 13 tests, 32/32 total passing. |
| 0.9 | ~~pgTAP test suite — RLS tests for `enrollments`, `session_attendance`~~ | 5 | [x] <!-- completed 2026-04-12 --> 16 tests, 48/48 total passing. throws_ok(sql,'42501',NULL,desc) pattern established. |
| 0.10 | ~~RLS audit — fix gaps found by pgTAP tests~~ | 3 | [x] <!-- completed 2026-04-12 --> 2 policy fixes + 11 gap tests. 59/59 passing. Code-review agent caught 2 follow-up gaps, both fixed. |
| 0.11 | ~~Install Playwright + Playwright MCP + a11y-mcp-server, configure viewports (375/768/1440)~~ | 3 | [x] <!-- completed 2026-04-12 --> @playwright/test v1.59.1 + Chromium installed. playwright.config.ts with 3 viewport projects (375/768/1440). MCP servers in .mcp.json (@playwright/mcp, a11y-mcp-server). |
| 0.12 | ~~Playwright test suite — auth flows (login, register, role routing)~~ | 3 | [x] <!-- completed 2026-04-12 --> 39/39 passing across 3 viewports. Fixed login action to redirect directly to role dashboard. Chromium for all viewports (WebKit not installed). |
| 0.13 | ~~Playwright test suite — admin course CRUD (create type, create course, add sessions)~~ | 8 | [x] <!-- completed 2026-04-12 --> 18/18 passing across 3 viewports. runId() for unique test data; force:true for mobile sidebar overlap; main form scope for requestSubmit(). |
| 0.14 | ~~Playwright test suite — student browse + register + capacity + duplicate prevention~~ | 8 | [x] <!-- completed 2026-04-12 --> 24 tests (14 pass, 10 desktop-only skips). createTestCourse helper; browser.newContext() for user switching; tests/helpers.ts extracted. |
| 0.15 | Playwright test suite — attendance + cancellation + makeup | 5 | The operational core. |
| 0.16 | Playwright test suite — instructor views | 3 | Dashboard, roster, session detail. Read-only pages. |
| 0.17 | Save @ui-reviewer agent spec to `.claude/agents/ui-reviewer.md` | 2 | Tuned to SailBook design language. |
| 0.18 | ~~Write session skills — `/its-alive`, `/pause-this`, `/restart-this`, update `/kill-this`, `/its-dead`~~ | 2 | [x] <!-- completed pre-project --> Five skill files in `~/.claude/skills/`. Done before V2 work began. |
| 0.19 | ~~Update CLAUDE.md — micro workflow, migration protocol, test commands, new agents, conventions~~ | 3 | [x] <!-- completed pre-project --> V2 conventions, migration protocol. Done before V2 work began. |
| 0.20 | ~~Update all docs — SPEC.md, DECISIONS.md, AGENTS.md, BRAND.md for V2 scope~~ | 3 | [x] <!-- completed pre-project --> Andy's philosophy note in BRAND.md. New DECs. V2 scope in SPEC.md. Done before V2 work began. |

**Phase 0 total: 70 pts**
**Projected hours (at 0.38 hr/pt): ~27 hrs**

**Ejection point:** Dev environment is professional-grade. Every future session is faster and safer. No user-facing value yet.

**Demo:** `supabase db reset` → `npm run dev` → `supabase test db` (all green) → `npx playwright test` (all green) → app works on localhost against local database.

---

## Phase 1: V1 Fixes & Gaps

Bugs, missing functionality, and quick profile improvements. Makes the existing app solid before adding new features.

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 1.1 | Session editing — edit date, time, location, instructor on existing sessions | 3 | Currently must cancel and recreate. Bug, not feature. |
| 1.2 | Set course back to Draft status (from Active) | 2 | Missing state transition. One button + server action. |
| 1.3 | Inactive instructor cascade — deactivating instructor clears course + session assignments | 2 | DB function for cascade. Warning tile already exists. DEC entry. |
| 1.4 | Course status review — confirm statuses cover all needs via @architect | 2 | Audit existing status logic. Probably fine as-is. |
| 1.5 | Student history view — past enrollments, attendance, completions visible to admin/instructor/student | 5 | New page/component across three roles. Terminology TBD with Andy ("Sailing Record"?). |
| 1.6 | ASA number field — add to profiles, show in admin student list + student profile | 2 | Migration + UI. Not mandatory. |
| 1.7 | Experience level — generic codes/lookup table + migrate experience levels onto it | 5 | DEC: generic codes table pattern. Reusable for qualifications, prereqs, skill names. |
| 1.8 | Password reset — "Forgot password" on login page + reset flow | 3 | Supabase `resetPasswordForEmail()`. Uses default mailer until Phase 3. |
| 1.9 | Unsaved changes guard — warn before leaving form with edits in progress | 3 | `beforeunload` + App Router interception. May need community package. |
| 1.10 | Student "instructor notes" field + expand instructor roster (phone, email, age, notes indicator) | 3 | "Anything you want your instructor to know?" free text. Dot/asterisk on roster if populated. Andy request. |
| 1.11 | Spots remaining fix — only count confirmed enrollments against capacity | 3 | Currently counts all non-cancelled. UI language cleanup ("X spots remaining"). Andy request. |
| 1.12 | Past courses not enrollable — filter student browse to exclude courses with all sessions in the past | 2 | V1 bug. Auto-transition status or query filter. Andy request. |
| 1.13 | Dual-role nav toggle — "Switch to Student/Instructor View" for multi-role users | 2 | Chris (instructor + student) needs visible toggle. Roles already exist, this is UI/routing. Andy request. |
| 1.14 | Dashboard instructor assignment clarity — verify courses-without-instructors count + show "Using course instructor" on sessions | 3 | Andy reported confusing number. Also clarify DEC-007 default behavior in UI. Andy request. |

**Phase 1 total: 40 pts**
**Projected hours: ~15 hrs**

**Ejection point:** V1 is solid. All known bugs fixed. Student records are richer. App is more trustworthy.

---

## Phase 2: Payments (Stripe)

The app makes money. Student self-cancellation ships here (ST-10).

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 2.1 | Stripe account setup — test mode, API keys in `.env.local` | 2 | Get Andy's Stripe account started early. Dev uses test keys. |
| 2.2 | Schema migration — `stripe_customer_id` on profiles, `stripe_checkout_session_id` on enrollments, `payments` table | 3 | New migration. pgTAP tests for payments RLS included. |
| 2.3 | Stripe Checkout Session creation — server action, redirect to Stripe hosted page | 5 | Replaces "Register" button. Capacity check + enrollment hold creation. DEC: pessimistic inventory (hold spot on checkout start). |
| 2.4 | Enrollment hold expiration — release `pending_payment` spots after timeout | 5 | First scheduled job (Vercel Cron or Supabase Edge Function). Handles race with webhook. |
| 2.5 | Stripe webhook endpoint — `app/api/webhooks/stripe/route.ts` | 5 | First API route. Verify signature, confirm enrollment on payment success. DEC: DEC-001 survives. |
| 2.6 | Post-payment redirect — success + cancel URLs, confirmation page | 2 | Success shows confirmation. Cancel shows "hold active, try again." |
| 2.7 | Student self-cancellation — cancel enrollment, trigger Stripe refund | 5 | ST-10 ships. Cancellation policy DEC needed (full? time-based? admin override?). |
| 2.8 | Admin enrollment view — payment status, Stripe link, manual refund trigger | 3 | UI additions to existing enrollment list. Admin can issue refunds from dashboard. |
| 2.9 | Member pricing field — `member_price` on courses alongside `price` | 2 | Checkout logic picks correct price based on profile. |
| 2.10 | Playwright end-to-end payment test — register → pay → confirm → cancel → refund | 5 | Full chain integration test using Stripe test cards + Stripe CLI for webhooks. |

**Phase 2 total: 37 pts**
**Projected hours: ~14 hrs**

**Ejection point:** App takes money. Students can pay and self-cancel. This is the make-or-break phase.

---

## Phase 3: Notifications + Auth Hardening

Users know what's happening. Auth is production-grade.

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 3.1 | Twilio setup — account, phone number, API keys | 2 | Test mode available. |
| 3.2 | Resend setup — account, API key, domain verification for sailbook.live | 2 | Cloudflare DNS records. Set up info@sailbook.live email routing. |
| 3.3 | Notification service — shared module for SMS (Twilio) + email (Resend) with mock mode for testing | 3 | Abstraction layer. `NOTIFICATIONS_ENABLED=false` routes to log in test. |
| 3.4 | Enrollment notifications — SMS + email on confirmed, plus admin alert on new enrollment, plus low enrollment warning to admin | 5 | Multiple triggers through one service. Admin shouldn't have to log in to know someone signed up. Andy request. |
| 3.5 | Session cancellation notice — SMS + email to enrolled students | 3 | Includes reason, makeup info if available. |
| 3.6 | Makeup session assignment — SMS + email to affected students | 3 | New date/time/location in message. |
| 3.7 | Session reminder — SMS 24 hours before session start | 5 | Scheduled job (cron). DEC: Vercel Cron vs Supabase Edge Function. |
| 3.8 | Admin notification preferences — checkboxes per event type × channel | 3 | DEC: settings table vs JSON column. |
| 3.9 | Student notification preferences — opt out of SMS, email-only option | 2 | Profile toggle. Notification service checks before sending. |
| 3.10 | Password strength + email verification | 3 | Supabase Auth config + custom email template via Resend. |
| 3.11 | OAuth login — Google | 2 | Supabase toggle + Google Cloud console. Email/password remains fallback. |
| 3.12 | Security audit — run @security-agent, evaluate findings, fix serious issues | 3 | Post-auth-hardening + payments-live audit. Non-serious findings move to backlog. |

**Phase 3 total: 36 pts**
**Projected hours: ~14 hrs**

**Ejection point:** Students get confirmations, cancellation notices, and reminders. Auth is solid with email verification and OAuth. Security audited. The school runs without phone calls.

---

## Phase 4: Identity & Profiles

Clean onboarding. Richer student and instructor records.

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 4.1 | Instructor invite link — `invites` table, one-time token, auto-sets `is_instructor` | 3 | "Generate Invite Link" button on admin instructor page. |
| 4.2 | Admin invite link — same pattern for admin role | 2 | Button on admin user management page. Reuses 4.1 infrastructure. |
| 4.3 | Student profile expansion — classes taken, editable ASA number, experience level from codes table | 5 | Profile page redesign. Experience level pulls from codes table (1.7). |
| 4.4 | Admin-created students (no login) — DEC resolution + implementation | 8 | "My wife has no fingers." @architect weighs in. May be simpler than it sounds. |
| 4.5 | Link admin-created student to login — student creates account, admin links to existing profile | 3 | Depends on 4.4 architecture. Might be as simple as "student resets password." |
| 4.6 | Instructor notes on sessions — text field per session, visible to all instructors + admin | 3 | IN-5 from V1 backlog. `notes` column already exists on sessions table. UI only. |
| 4.7 | Instructor profile expansion — availability field + bio/website link | 3 | General availability for admin assignment. Name links to LTSC website bio. Andy request. |

**Phase 4 total: 27 pts**
**Projected hours: ~10 hrs**

**Ejection point:** Instructors get proper onboarding. Student profiles are richer. Instructor notes captured. Admin can create students for non-technical users.

---

## Phase 5: Pricing & Enrollment

Flexible pricing, enrollment safety rails, and waitlist.

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 5.1 | Member pricing model — `is_member` flag on profiles, checkout uses correct price | 3 | Admin-editable flag. Foundation for SailTime/boat owner discounts later. |
| 5.2 | Drop-in pricing for Open Sailing — per-session enrollment + payment | 5 | Different enrollment model. DEC: flag on course (`is_drop_in`), not course_type. |
| 5.3 | Discount codes — enable Stripe promotion codes on checkout | 2 | `allow_promotion_codes: true`. Admin creates codes in Stripe dashboard. UI note on checkout page. |
| 5.4 | Prerequisite flagging — `course_type_prerequisites` table, admin warning + override | 3 | Flag, not block. "⚠️ No ASA 101 on record" with override checkbox. |
| 5.5 | Admin qualification grant ("test out") — `qualifications` table, manual ASA cert grants | 3 | Same effect as completing a course. Satisfies prereq flags. |
| 5.6 | Duplicate enrollment in same course type — warn student + flag for admin | 3 | ⚠️ Scope creep risk. Keep tight: warning on enrollment + admin dashboard flag. No auto-clear. |
| 5.7 | Waitlist — full course → join waitlist → notify on opening | 8 | New table, student UI, admin visibility, notification on spot opening. Depends on Phase 3 notifications. Andy request. |
| 5.8 | Low enrollment warning — dashboard tile for courses below minimum threshold approaching start date | 2 | Same pattern as "courses without instructors." Meaningful only with payments live. Andy request. |

**Phase 5 total: 29 pts**
**Projected hours: ~11 hrs**

**Ejection point:** Pricing is flexible. Enrollment has safety rails. Prerequisite and waitlist systems exist. Low enrollment flagged early.

---

## Phase 6: Polish & UX

Design quality, accessibility, navigation, convenience features.

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 6.1 | Mobile responsiveness pass — admin pages | 3 | Deferred from V1 (5.23). |
| 6.2 | Mobile responsiveness pass — instructor pages | 2 | Deferred from V1 (5.24). |
| 6.3 | Full @ui-reviewer design review — all roles, all pages, three viewports | 5 | Formal design audit with scored report. |
| 6.4 | Implement @ui-reviewer findings | 5 | Re-estimate after 6.3. |
| 6.5 | axe-core accessibility audit — fix critical/serious violations | 3 | WCAG 2.1 AA compliance. |
| 6.6 | Duplicate course — one-click copy, drop into edit | 2 | Deferred from V1 (5.11). |
| 6.7 | Relative session badges — "Tomorrow", "This week" instead of "Upcoming" | 3 | Date math. Always harder than it looks. |
| 6.8 | WebsiteAuditAI + Attention Insight external audit | 2 | 10-minute external validation at phase boundary. |
| 6.9 | Admin dashboard UX redesign | 5 | Dashboard has real data by now (payments, holds, notifications). Design it properly. |
| 6.10 | Back button / breadcrumb audit — consistent navigation across all roles and views | 5 | Audit every page, establish breadcrumb pattern, fix dead ends. Andy request. |
| 6.11 | Public landing page + contact form for sailbook.live | 3 | Currently drops straight to login. Basic public page + contact form. **Cuttable.** |
| 6.12 | Security audit (V2 final) — run @security-agent, evaluate findings, fix serious issues, prime V3 backlog | 3 | Full V2 surface area: payments, notifications, waitlist, prereqs, qualifications. Non-serious findings seed V3 backlog. |

**Phase 6 total: 41 pts**
**Projected hours: ~16 hrs**

**Ejection point:** The app looks and feels professional. Accessible. Navigable. Polished. Security verified.

---

## Phase 7: Skills & Tracking (future — scope TBD)

Transforms the app from scheduling into a learning management tool.

- Skill checklists per course type (ASA 101: tacking, parts of boat, etc.)
- Instructor marks skills demonstrated/executed per student per session
- Student "Sailing Record" accumulates completed skills
- Two-level checkoff: instructor demonstrates → student executes
- Makeup sessions show which skills still need covering
- Cross-instructor continuity via skill records
- Automated experience level progression based on completed skills
- Advanced analytics/reporting

**Phase 7: estimated 40–60 pts. Break down when Phase 6 is complete.**

---

## V3 Ideas (parked)

- Proxy enrollment ("Who are you enrolling?" — Me / Me + someone / Someone else) — requires shopping cart model
- Charter module — separate app, shared auth/profiles infrastructure
- General program request form — private lessons, corporate events, group bookings
- Youth enrollment — parent/guardian co-enrollment, birth month/year, ASA data standards
- In-app messaging — admin/instructor/student messaging (SMS covers this for now)
- ASA number auto-populate from ASA's API (unlikely to exist)
- Tiered instructor roles — lead/super instructor with elevated permissions
- "Put me in next available" — auto-enroll on next course opening
- Duplicate enrollment auto-clear — confirming one section cancels pending others (refund implications)
- Student calendar view — monthly calendar of enrolled sessions
- Admin / instructor calendar views
- Automated makeup suggestions
- Multi-school / multi-tenant
- AI season setup agent
- Admin impersonation mode ("view as student")
- Full coupon/discount engine (beyond Stripe promotion codes)

---

## Summary

| Phase | Pts | Projected Hours (at 0.38 hr/pt) | Ejection Point Value |
|-------|-----|--------------------------------|---------------------|
| 0 — Infrastructure | 70 | ~27 hrs | Dev environment ready |
| 1 — V1 Fixes | 40 | ~15 hrs | V1 is solid |
| 2 — Payments | 37 | ~14 hrs | App makes money |
| 3 — Notifications + Auth | 36 | ~14 hrs | Users stay informed, auth hardened, security audited |
| 4 — Identity | 27 | ~10 hrs | Onboarding is clean |
| 5 — Pricing | 29 | ~11 hrs | Flexible pricing, waitlist, prereqs |
| 6 — Polish | 41 | ~16 hrs | Professional, accessible, navigable, security verified |
| 7 — Skills | 40–60 | ~15–23 hrs | Learning management |
| **Total (0–6)** | **280** | **~107 hrs** | |

At V1 velocity (0.38 hrs/pt): ~107 hours for Phases 0–6.
At 8 hrs/week: ~13 weeks — mid-July for everything, early June for Phases 0–2 (critical path to payments).

---

## Velocity Tracking

| Phase | Effort Pts | Est. Hours | Actual Hours | Hrs/Point | Notes |
|-------|-----------|------------|--------------|-----------|-------|
| 0 — Infrastructure | 70 | ~27 | — | — | |
| 1 — V1 Fixes | 40 | ~15 | — | — | |
| 2 — Payments | 37 | ~14 | — | — | |
| 3 — Notifications | 36 | ~14 | — | — | |
| 4 — Identity | 27 | ~10 | — | — | |
| 5 — Pricing | 29 | ~11 | — | — | |
| 6 — Polish | 41 | ~16 | — | — | |
| **Total** | **280** | **~107** | — | — | |

---

## Estimation Poker — Standing Disagreements

| Task | Claude | Spink | Resolution | Notes |
|------|--------|-------|------------|-------|
| — | — | — | — | None. All estimates agreed. |

---

## Cuttable Tasks (if time is tight)

Ordered by least impact to cut:

- **6.7** — Relative session badges. Nice UX, zero operational impact.
- **6.11** — Public landing page. Current login-only works.
- **6.6** — Duplicate course. Admin can create from scratch — just slower.
- **6.9** — Admin dashboard redesign. Functional beats pretty.
- **5.6** — Duplicate enrollment warning. Edge case. Costs a few refunds at worst.
- **5.3** — Discount codes. Manual pricing adjustments work short-term.
- **6.1/6.2** — Mobile admin/instructor pass. Hamburger menu is the V1 stopgap.
- **4.4/4.5** — Admin-created students. Workaround: admin creates account on student's behalf.

---

## Decisions Needed During Build

| Decision | When | Who |
|----------|------|-----|
| Generic codes/lookup table pattern | Phase 1, task 1.7 | @architect |
| Inactive instructor cascade behavior | Phase 1, task 1.3 | DEC entry |
| "Student history" terminology | Phase 1, task 1.5 | Andy |
| Stripe account ownership | Phase 2 start | Andy |
| Pessimistic inventory / hold duration | Phase 2, task 2.3 | DEC + Andy |
| Cancellation refund policy | Phase 2, task 2.7 | Andy |
| DEC-001 survival (webhook = mailbox, not API layer) | Phase 2, task 2.5 | DEC entry |
| Scheduled job infrastructure (Vercel Cron vs Edge Functions) | Phase 2, task 2.4 | @architect |
| Notification settings storage (table vs JSON) | Phase 3, task 3.8 | @architect |
| Admin-created student architecture | Phase 4, task 4.4 | @architect |
| Drop-in enrollment model (flag on course) | Phase 5, task 5.2 | @architect + Andy |
| Low enrollment threshold and cutoff timing | Phase 5, task 5.8 | Andy |
| Duplicate same-course-type enrollment behavior | Phase 5, task 5.6 | Andy |

---

## Cloud Staging Environment

Not Phase 0. Add when Andy needs to preview V2 features.

- Second Supabase cloud project (free tier)
- Vercel preview branch pointing to staging Supabase
- Same migration workflow: `supabase db push --project-ref staging-ref`
- Seed with demo data for Andy testing

---

## Phase Boundary Checklist

At the end of every phase:
1. All pgTAP tests green (`supabase test db`)
2. All Playwright tests green (`npx playwright test`)
3. Run WebsiteAuditAI on deployed preview (free, 10 min)
4. Run Attention Insight Chrome extension on deployed preview (free, 5 min)
5. @pm phase retrospective — velocity check, timeline update
6. Return to primary planning chat — review docs against intent
