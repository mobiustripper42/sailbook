# SailBook V2 — Project Plan

**V1 shipped:** April 9, 2026 (v1.0.0)
**V2 planning:** April 11, 2026
**Deadline:** May 15, 2026 (Simply Sailing season opener — hard) — Phases 0–2 (payments live) is the critical path

---

## Estimation Method

Fibonacci scale (2, 3, 5, 8, 13). See `VELOCITY_AND_POKER_GUIDE.md` for definitions.
All estimates from planning poker between Spink and Claude.
Disagreements logged in the Standing Disagreements table at the bottom.
Tests are baked into every task estimate — no separate testing tasks.

**V1 velocity baseline:** 0.38 hrs/pt lifetime across 52.75 hours and ~111 pts.

---

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
| 0.15 | ~~Playwright test suite — attendance + cancellation + makeup~~ | 5 | [x] <!-- completed 2026-04-12 --> 7 tests (11/21 pass, 10 skip by design). Flows: mark attended, All Attended, student sees badge, enrollment cancel, session cancel + makeup + student view. `test.setTimeout(90000/120000)` on setup-heavy tests. |
| 0.16 | ~~Playwright test suite — instructor views~~ | 3 | [x] <!-- completed 2026-04-12 --> 18 tests (9 pass, 9 skip by design). Suites: dashboard empty state, dashboard with sessions, session roster, access control. `createInstructorCourse()` inline helper. |
| 0.17 | ~~Save @ui-reviewer agent spec to `.claude/agents/ui-reviewer.md`~~ | 2 | [x] <!-- completed 2026-04-12 --> Mira/Sky/Mist theme, Nunito Sans, xs radius, dark-mode-first. Token-based color rules, 12-point checklist, scored output format. |
| 0.18 | ~~Write session skills — `/its-alive`, `/pause-this`, `/restart-this`, update `/kill-this`, `/its-dead`~~ | 2 | [x] <!-- completed pre-project --> Five skill files in `.claude/skills/`. Done before V2 work began. |
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
| 1.0 | ~~Theme & dark mode — apply Mira preset b7CSfQ4Xo, swap to Nunito Sans, xs radius, wire next-themes toggle~~ | 5 | [x] <!-- completed 2026-04-13, revised 2026-04-15 --> Mira Sky/Mist oklch vars, Nunito Sans, next-themes toggle, defaultTheme="system", localStorage-only persistence per device. theme_preference column exists in DB but is not read/written. --radius 0.125rem. |
| 1.1 | ~~Session editing — edit date, time, location, instructor on existing sessions~~ | 3 | [x] <!-- completed 2026-04-13 --> Inline edit form (sub-row pattern). SessionRow client component. updateSession action. 2 Playwright tests. |
| 1.2 | ~~Set course back to Draft status (from Active)~~ | 2 | [x] <!-- completed 2026-04-13 --> revertToDraft action; Revert to Draft button in CourseStatusActions; self-contained Playwright test, 3/3 viewports. |
| 1.3 | ~~Inactive instructor cascade — deactivating instructor clears course + session assignments~~ | 2 | [x] <!-- completed 2026-04-14 --> SECURITY DEFINER trigger; confirm dialog on Deactivate button; 5 pgTAP + 2 Playwright tests; DEC-019. 6 code review fixes deferred to next session. |
| 1.4 | ~~Course status review — confirm statuses cover all needs via @architect~~ | 2 | [x] <!-- completed 2026-04-15 --> @architect confirmed existing statuses (draft/active/cancelled) are sufficient for V1. No schema changes needed. |
| 1.5 | ~~Student history view — past enrollments, attendance, completions visible to admin/instructor/student~~ | 5 | [x] <!-- completed 2026-04-15 --> `/student/history` ("Experience"), `/admin/students/[id]`, `/instructor/students/[id]`. Shared `fetchStudentHistory()` helper. RLS migration broadens instructor read to all student data. 36 Playwright + 67 pgTAP tests green. |
| 1.6 | ~~ASA number field — add to profiles, show in admin student list + student profile~~ | 2 | [x] <!-- completed 2026-04-15 --> Migration + UI. Admin list/detail/edit. Student Experience page. 5 Playwright tests. |
| 1.7 | ~~Experience level — generic codes/lookup table + migrate experience levels onto it~~ | 5 | [x] <!-- completed 2026-04-16 --> codes table + RLS + 8 pgTAP + 9 Playwright tests. DEC-021. Register page + admin edit forms now load from DB. |
| 1.8 | ~~Password reset — "Forgot password" on login page + reset flow~~ | 3 | [x] <!-- completed 2026-04-15 --> requestPasswordReset + updatePassword actions; forgot-password + reset-password pages; proxy guard; Playwright tests. All code review findings fixed in session 71. |
| 1.9 | ~~Unsaved changes guard — warn before leaving form with edits in progress~~ | 3 | [x] <!-- completed 2026-04-15 --> useUnsavedChanges hook: beforeunload + capture-phase click listener (sidebar nav) + pushState guard + popstate (back button). Wired to all admin edit/create/inline forms. 32 Playwright tests. |
| 1.10 | ~~Student "instructor notes" field + expand instructor roster (phone, email, age, notes indicator)~~ | 3 | [x] <!-- completed 2026-04-16 --> Register form + student account page; blue dot indicator on roster; "Note from student" callout on detail page. |
| 1.11 | ~~Spots remaining fix — only count confirmed enrollments against capacity~~ | 3 | [x] <!-- completed 2026-04-13 --> Both RPCs + admin detail page JS filter updated. Tests updated throughout; confirmTestEnrollment helper added. |
| 1.12 | ~~Past courses not enrollable — filter student browse to exclude courses with all sessions in the past~~ | 2 | [x] <!-- completed 2026-04-14 --> Post-fetch JS filter on student browse page; courses with zero sessions remain visible. One accepted edge case: active course with future cancelled + past scheduled session still shows (pathological, ignored). |
| 1.13 | ~~Dual-role nav toggle — "Switch to Student/Instructor View" for multi-role users~~ | 2 | [x] <!-- completed 2026-04-14 --> RoleToggle component; student + instructor layouts; mobile drawer support; 18 Playwright tests. |
| 1.14 | ~~Dashboard instructor assignment clarity — verify courses-without-instructors count + show "Using course instructor" on sessions~~ | 3 | [x] <!-- completed 2026-04-15 --> Count was correct; "Course default" label already in SessionInstructorSelect. Added Playwright tests: warning card, count increment, session select label. |
| 1.15 | ~~Theme default — defaultTheme="system" for unauthenticated pages~~ | 3 | [x] <!-- completed 2026-04-15, revised 2026-04-15 --> DB persistence reverted (see DEC-020). ThemeProvider defaultTheme="system". Toggle writes to localStorage only via next-themes. No ThemeSync, no /api/theme route. |
| 1.16 | ~~Restore admin mobile hamburger menu — theme changes broke mobile nav~~ | 2 | [x] <!-- completed 2026-04-13 --> AdminMobileNavDrawer component; hidden md:flex on aside; test skips updated. |
| 1.17 | ~~Session row Action dropdown — consolidate Attendance/Edit/Cancel/Delete into shadcn DropdownMenu~~ | 2 | [x] <!-- completed 2026-04-13 --> Single ··· DropdownMenu; SessionActions deleted; data-session-id on TableRow; all tests updated. |
| 1.18 | ~~Add logo to login page and favicon to browser tab~~ | 2 | [x] <!-- completed 2026-04-15 --> logo.png in CardHeader (right, vertically centered); favicon.svg in layout metadata. |
| 1.19 | ~~Dark / Light theme not applyed to /dev instruction page, can read any text~~ | 2 | [x] <!-- completed 2026-04-15 --> bg-white → bg-background text-foreground; gray hardcodes → bg-muted. |
| 1.20 | ~~Instructor mobile hamburger menu — aside is always visible at all viewports, no mobile drawer exists~~ | 2 | [x] <!-- completed 2026-04-14 --> InstructorMobileNavDrawer component; hidden md:flex on aside; 9 Playwright tests. |
| 1.21 | ~~Dev login helper — dropdown of seed users that auto-fills + submits the login form~~ | 2 | [x] <!-- completed 2026-04-14 --> DevLoginHelper component; NEXT_PUBLIC_DEV_MODE gate; 7 seed users; requestSubmit(); 4 Playwright tests. |
| 1.22 | ~~End-of-phase @ui-reviewer pass~~ | — | [x] <!-- completed 2026-04-15 --> Run as part of Session 66 housekeeping. Findings folded into 6.3/6.4 which are now done. |
| 1.23 | ~~Student account page — let students edit their own name, phone, ASA number, and experience level~~ | 3 | [x] <!-- completed 2026-04-16 --> `/student/account` with full profile edit form; Account link in student nav + mobile drawer. |

**Phase 1 total: 58 pts** (40 original + 3 for 1.15 + 2 for 1.16 + 2 for 1.17 + 2 for 1.18 + 2 for 1.19 + 2 for 1.20 + 2 for 1.21 + 3 for 1.23)
**Projected hours: ~19 hrs**

**Session 49 polish credit: 8 pts** — one-off theme diagnosis/fix session (2026-04-13). Not tied to a task; effort logged separately. Counts toward lifetime velocity but not Phase 1 task completion.

**Ejection point:** V1 is solid. All known bugs fixed. Student records are richer. App is more trustworthy.

---

## Phase 2: Payments (Stripe)

The app makes money. Student self-cancellation ships here (ST-10).

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 2.1 | ~~Stripe account setup — test mode, API keys in `.env.local`~~ | 2 | [x] <!-- completed 2026-04-15 --> stripe npm package, src/lib/stripe.ts singleton client, env vars in .env.local. |
| 2.2 | ~~Schema migration — `stripe_customer_id` on profiles, `stripe_checkout_session_id` on enrollments, `payments` table~~ | 3 | [x] <!-- completed 2026-04-15 --> Migration + RLS. 10 pgTAP tests (77/77). Types regenerated. CHECK constraint on payments.status still needed (new migration). |
| 2.3 | ~~Stripe Checkout Session creation — server action, redirect to Stripe hosted page~~ | 5 | [x] <!-- completed 2026-04-15 --> createCheckoutSession action; pending_payment hold; Stripe customer upsert; ENROLLMENT_HOLD_MINUTES env var; success + cancel pages (2.6 folded in); dev-only /api/test/enroll route; 15 Playwright tests. |
| 2.4 | ~~Enrollment hold expiration — release `pending_payment` spots after timeout~~ | 5 | [x] <!-- completed 2026-04-18 --> Vercel Cron GET route; Resume Payment UX; capacity RPC fixed to count active holds; VOLATILE RPCs; pw_student2 seed; 4 Playwright tests; pgTAP 86/86. First scheduled job (Vercel Cron or Supabase Edge Function). Handles race with webhook. **Also:** fix "Payment pending" dead-end UX — course page shows a badge but no way to resume. Fix: (1) select `hold_expires_at` in enrollment query on `student/courses/[id]/page.tsx`; (2) pass `hasPendingPayment` + expiry to `EnrollButton`; (3) hold active → "Resume Payment" button (calls `createCheckoutSession`, which already reuses the existing Stripe session); (4) hold expired → normal "Pay & Register" button. |
| 2.5 | ~~Stripe webhook endpoint — `app/api/webhooks/stripe/route.ts`~~ | 5 | [x] <!-- completed 2026-04-18 --> Signature verification, confirm enrollment on checkout.session.completed, upsert payment row, upsert session_attendance. UNIQUE constraint on payments.stripe_checkout_session_id prevents duplicate rows on concurrent delivery. Verified E2E with Stripe CLI. 4 Playwright tests. |
| 2.6 | ~~Post-payment redirect — success + cancel URLs, confirmation page~~ | 2 | [x] <!-- completed 2026-04-15 --> Folded into 2.3. |
| 2.7 | ~~Student self-cancellation — cancel enrollment, trigger Stripe refund~~ | 5 | [x] <!-- completed 2026-04-19 --> Admin-controlled refund flow (DEC-022). Student requests cancellation (confirmed → cancel_requested); admin processes refund in 2.8. alert-dialog added. pgTAP 90/90, Playwright 2/2. |
| 2.8 | ~~Admin enrollment view — payment status, Stripe link, manual refund trigger~~ | 5 | [x] <!-- completed 2026-04-19 --> Payment column with amount/refund display + Stripe link. Process Refund dialog with partial amount input. WITH CHECK security fix. 4 Playwright tests. Scope expanded +2 pts to include partial refund. |
| 2.9 | ~~Member pricing field — `member_price` on courses alongside `price`~~ | 2 | [x] <!-- completed 2026-04-20 --> `member_price` on courses, `is_member` on profiles. Checkout picks member price for members. Admin course forms + student edit updated. Student course detail shows member price. 3 Playwright tests. |
| 2.10 | ~~Playwright end-to-end payment test — register → pay → confirm → cancel → refund~~ | 5 | [x] <!-- completed 2026-04-20 --> Intercepts Stripe redirect to capture session ID, fires signed checkout.session.completed webhook, tests full confirm→cancel→refund chain. 12/12 across 3 viewports. |
| 2.11 | ~~README: Stripe setup instructions — keys, webhook config, test mode~~ | 1 | [x] <!-- completed 2026-04-20 --> Full README rewrite: Stripe keys, webhook CLI setup, test cards, test commands. |
| 2.12 | ~~End-of-phase @ui-reviewer and lint pass~~ | 2 | [x] <!-- completed 2026-04-21 --> Badge dot+label redesign, button variant sweep, UI reviewer fixes, all code review items resolved. |

**Phase 2 total: 40 pts**
**Projected hours: ~14 hrs**

**Ejection point:** App takes money. Students can pay and self-cancel. This is the make-or-break phase.

---

## Phase 3: Notifications + Auth Hardening

Users know what's happening. Auth is production-grade.

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 3.1 | ~~Twilio setup — account, phone number, API keys~~ | 2 | [x] <!-- completed 2026-04-25 --> Account + toll-free number + creds in `.env.local`. `npm install twilio`. `@ts-expect-error` directive removed. Toll-Free Verification submission pending — must be approved before `NOTIFICATIONS_ENABLED=true`. |
| 3.2 | ~~Resend setup — account, API key, domain verification for sailbook.live~~ | 2 | [x] <!-- completed 2026-04-25 --> Domain verified, SPF + DKIM in Cloudflare, API key in `.env.local`. `npm install resend`. `@ts-expect-error` directive removed. |
| 3.3 | ~~Notification service — shared module for SMS (Twilio) + email (Resend) with mock mode for testing~~ | 3 | [x] <!-- completed 2026-04-24 --> Dispatcher with `NOTIFICATIONS_ENABLED` gate. Mock buffer + dev-only test API route. Twilio/Resend lazy-imported behind `@ts-expect-error` (remove in 3.1/3.2). 4 Playwright tests. |
| 3.4 | ~~Enrollment notifications — SMS + email on confirmed, plus admin alert on new enrollment, plus low enrollment warning to admin~~ | 8 | [x] <!-- completed 2026-04-25 --> Re-estimated from 5 → 8 in session 93: scope includes new cron route + vercel.json entry + threshold logic + both Stripe webhook and admin-enroll trigger paths. Code review flagged 3 fixups (HTML escape, missing notify in `confirmEnrollment`, threshold rounding) — queued as first thing next session. Admin shouldn't have to log in to know someone signed up. Andy request. |
| 3.5 | ~~Session cancellation notice — SMS + email to enrolled students~~ | 3 | [x] <!-- completed 2026-04-26 --> sessionCancellation template + notifySessionCancelled trigger wired into cancelSession action. Optional cancel reason. No admin alert (admin did the cancel). 3 desktop Playwright tests green. |
| 3.6 | ~~Makeup session assignment — SMS + email to affected students~~ | 3 | [x] <!-- completed 2026-04-26 --> makeupAssignment template + notifyMakeupAssigned trigger wired into createMakeupSession. References both original and new session dates. FK embed via session_attendance.makeup_session_id. 3 desktop Playwright tests green. |
| 3.7 | ~~Session reminder — SMS 24 hours and 1 week before session start~~ | 5 | [x] <!-- completed 2026-04-26 --> sessionReminder template + notifyUpcomingSessionReminders trigger + /api/cron/session-reminders route + vercel.json entry. UTC-safe date math, single template parameterized by leadTimeLabel. Optional referenceDate for testability. 5 desktop Playwright tests green. Vercel Cron chosen over Supabase Edge Function (absorbed into established cron pattern from expire-holds + low-enrollment). |
| 3.8 | ~~Admin notification preferences — checkboxes per event type × channel~~ | 3 | [x] <!-- completed 2026-04-26 --> DEC-026: JSONB on profiles. `notification_preferences` column, `isAdminChannelEnabled()` helper, gated in both admin fan-outs. UI at `/admin/notification-preferences`. 4 desktop UI tests green. Dispatcher tests deferred until `NOTIFICATIONS_ENABLED=false` returns. |
| 3.9 | ~~Student notification preferences — opt out of SMS, email-only option~~ | 2 | [x] <!-- completed 2026-04-26 --> Two checkboxes (SMS / email) on `/student/account`, reuses 3.8's `notification_preferences` JSONB column with `student_global` key. All 4 student fan-outs in `triggers.ts` gated. Both admin + student actions now merge with existing JSONB (dual-role bug fix). Bundled DEC-015 migration of `updateStudentProfile`. 5 desktop tests green incl. dispatcher gating. |
| 3.10 | ~~Password strength + email verification~~ | 3 | [x] <!-- completed 2026-04-27 --> Min length 12, `lower_upper_letters_digits`. `enable_confirmations = true`. New `/auth/callback` route + `/register/check-email` landing. Branded confirmation template at `supabase/templates/confirmation.html`. Register action uses `adminClient` for profile insert (no session post-signUp with confirmations on). Seed password rotated to `Sailbook12345`. 5 desktop tests green. **Manual smoke test deferred to next session.** |
| 3.11 | ~~OAuth login — Google~~ | 2 | [x] <!-- completed 2026-04-29 --> Scored 2, effective scope 5 (see standing disagreements). Google provider in `supabase/config.toml`, creds in `supabase/.env`. New `signInWithGoogle` action + GoogleSignInButton on /login + /register. New `handle_new_user` SECURITY DEFINER trigger unifies profile creation across email/password, Google OAuth, and admin-createStudent. Invite page passes `?next=` for OAuth round-trip. 6 desktop tests green. |
| 3.12 | ~~Security audit — run @security-agent, evaluate findings, fix serious issues~~ | 3 | [x] <!-- completed 2026-04-28 --> /security-review skill against Phase 3 surface (auth, notifications, test routes, RLS migration, cron, email template). Zero qualifying findings at >80% confidence. Excluded items (length cap on `instructor_notes`, backslash in `auth/callback` `next`, `listUsers` page truncation in dev-only test route, JSONB shape validation absence) noted but excluded by review rules. |
| 3.13 | ~~README: Twilio/Resend setup instructions — keys, sender config~~ | 1 | [x] <!-- completed 2026-04-29 --> README gains Twilio Setup, Resend Setup, and a Notifications gating section. Toll-Free Verification gate documented (carrier filter blocks SMS until approved). Resend domain-verification flow + note that Supabase Auth emails go through SMTP (separate Dashboard config, in Pre-Launch Checklist). |
| 3.14 | ~~End-of-phase close — @ui-reviewer pass, lint clean, all tests green, all code review resolved, retrospective, archive session log~~ | 5 | [x] <!-- completed 2026-04-29 --> Full Playwright suite 404/612 green (1 cross-file flake — known issue, tracked). Lint clean (3 pre-existing warnings cleaned up). Code review of e212ee1 cleared. Retrospective written in `docs/RETROSPECTIVES.md`. Polish backlog all 4 items shipped: (a) `noValidate` on all 5 auth forms; (b) controlled inputs preserve register values across rejection; (c) `validatePassword` + `friendlyPasswordError` in `src/lib/auth/password-rules.ts`, `PASSWORD_RULES_HELP` extracted (3 forms now share); (d) covered by a+b+c. UI reviewer findings: rounded-md→xs on register select/textarea, ghost→default button on reset-password "Link expired", phone helper-text tightened. |
| 3.15 | ~~Logged-in password change — "Change password" form on student/admin/instructor account pages~~ | 3 | [x] <!-- completed 2026-04-29 --> New `/account/password` route, role-agnostic. `changePassword` server action re-auths via `signInWithPassword` then calls `updateUser`. Three-field client form (current/new/confirm) with auto-clear on success. "Change password" link added to all 3 desktop sidebars + 3 mobile drawers. 5 desktop tests green. Did NOT flip `secure_password_change` in config.toml — manual re-auth gives clearer errors. |

**Phase 3 total: 48 pts** (was 45; +3 for 3.15)
**Projected hours: ~16 hrs**

**Ejection point:** Students get confirmations, cancellation notices, and reminders. Auth is solid with email verification and OAuth. Security audited. The school runs without phone calls.

---

## Phase 4: Identity & Profiles

Clean onboarding. Richer student and instructor records.

Rows ordered: completed grouped at top; unfinished below in priority order (medium → low → close). Cut to V3: 4.7 (instructor profile expansion). IDs frozen.

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 4.1 | ~~Instructor invite link — `invites` table, single shared reusable token per role, auto-sets `is_instructor`~~ | 3 | [x] <!-- completed 2026-04-23 --> Design diverged from "one-time token" to single shared reusable link (admin regenerates to revoke). `invites` PK on role + SECURITY DEFINER `accept_invite` RPC. 15 pgTAP + 5 Playwright tests green. Reusable for 4.2 admin invite. |
| 4.4a | ~~Admin-created student profiles — passwordless auth row + `auth_source` discriminator, admin "Add Student" form~~ | 5 | [x] <!-- completed 2026-04-22 --> DEC-024. service-role createUser (no password, email_confirm: true). auth_source col on profiles. |
| 4.4b | ~~Admin-initiated enrollment + manual payment — student picker on course page, enrollment → confirmed, payment_method col~~ | 5 | [x] <!-- completed 2026-04-22 --> DEC-025. Bypasses Stripe entirely. Partial UNIQUE on stripe_checkout_session_id. payment_method: cash/check/venmo/stripe_manual. |
| 4.5 | (NOT REQUIRED) Link admin-created student to login — student uses Forgot Password on existing email | 3 | No code needed in V1. Admin tells student to use Forgot Password with their email. |
| 4.6 | ~~Instructor notes on sessions — text field per session, visible to all instructors + admin~~ | 3 | [x] <!-- completed 2026-04-29 --> IN-5. `update_session_notes` SECURITY DEFINER RPC (admin OR assigned instructor only — RLS gives instructors SELECT only on sessions, so the RPC is the write surface). 2000-char cap. New `<SessionNotesForm>` on `/instructor/sessions/[id]` with character counter + transient-success feedback. Admin reads on the existing attendance page. 8 pgTAP cases + 3 Playwright tests. |
| 4.8 | ~~Cookie-based theme sync~~ | 2 | [x] <!-- removed 2026-04-15 --> Superseded by DEC-020: theme is localStorage-only per device. No cross-device sync, no FOUC problem to solve. |
| 4.10 | ~~Recreate `.claude/agents/ui-reviewer.md` (lost in Phase 7 migration)~~ | 1 | [x] <!-- completed 2026-04-29 --> Modeled on `architect.md` / `code-review.md`. Brand rules pulled from BRAND.md (Mira/Sky/Mist, Nunito Sans, xs radius, dark-mode-default, mobile@375px). 12-point review checklist with pass/fix-soon/blocker scoring. Committed to `.claude/agents/` so it survives box moves this time. |
| 4.11 | ~~Substitute-instructor page bug fix + DEC-007 pgTAP coverage~~ | 2 | [x] <!-- completed 2026-04-29 --> Session 107 cleanup. (a) `src/app/(instructor)/instructor/sessions/[id]/page.tsx:66` redirected substitute instructors assigned only at the session level — page check contradicted the `update_session_notes` RPC's authorization. Fix: gate now `course.instructor_id !== user.id && session.instructor_id !== user.id`. (b) `10_session_notes_rpc.sql` plan 8 → 11; 3 cases for the DEC-007 override path. |
| 4.3 | Student profile expansion — classes taken, editable ASA number, experience level from codes table | 5 | **Priority: medium.** Profile page redesign. Experience level pulls from codes table (1.7). |
| 4.2 | ~~`/admin/users` consolidation — unified users page with role filter (Admin / Instructor / Student), two collapsed invite panels (admin + instructor), column sorting, replaces `/admin/students` + `/admin/instructors`~~ | 8 | [x] <!-- completed 2026-04-30 --> Re-scoped 2 → 8 pts (session 94); actual ~11 pts across two sessions. Session 109 (~6 pts): sortable `SortableHead` w/ aria-sort, both invite panels in collapsed `<details>`, generalized `acceptInvite(role, token)` + `InvitePanel` + new admin invite route + shared `AcceptInviteForm`. JWT bug carryover verified already-fixed in 4.1. Session 110 — task 4.2b (5 pts; Option A): deleted `/admin/students/page.tsx`, `/admin/instructors/{,[id]/edit}`, and per-role invite pages; consolidated invites into `/invite/[role]/[token]` with ROLE_COPY + role validation. Kept `/admin/students/{[id],[id]/edit,new}` alive — student-specific fields (experience/ASA/member) live in `ProfileEditForm`, not the unified `UserEditForm`. Users-list now branches Edit by `is_student`; instructor rows render `InstructorActions` inline preserving DEC-019 confirm dialog. PR #2. |
| 4.9 | End-of-phase close — @ui-reviewer pass, lint clean, all tests green, all code review resolved, retrospective, archive session log | 5 | **Always last.** Focus on profile expansion pages, invite flow, instructor onboarding. |

**Phase 4 total: 42 pts** (session 109: −3 for 4.7 cut to V3; session 108: +2 for 4.11 substitute-instructor bug + DEC-007 pgTAP coverage)
**Projected hours: ~10 hrs**

**Ejection point:** Instructors get proper onboarding. Student profiles are richer. Instructor notes captured. Admin can create students for non-technical users.

---

## Phase 5: Pricing & Enrollment

Flexible pricing, enrollment safety rails, and waitlist.

Rows ordered: completed grouped at top; unfinished below in priority order (high → low → close). Cut to V3: 5.1, 5.3, 5.5, 5.6. IDs frozen.

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 5.8 | ~~Low enrollment warning — dashboard tile for courses below minimum threshold approaching start date~~ | 5 | [x] <!-- completed 2026-04-29 --> Re-scoped from 2 → 5 (session 108): the existing 3.4 cron alert was using hardcoded `LOW_ENROLLMENT_RATIO = 0.5` and `LOW_ENROLLMENT_DAYS_OUT = 14`. 5.8 replaces both with `course_types.minimum_enrollment` (NULL = opt out) + `course_types.low_enrollment_lead_days` (default 14). Single source of truth: shared `findLowEnrollmentCourses` helper in `src/lib/low-enrollment.ts` powers both the daily cron alert AND the new admin dashboard tile. Threshold semantics changed from ratio to absolute. Course-type form gains both fields with helper text. Dashboard stat row now `grid-cols-2 lg:grid-cols-3`. 2 desktop Playwright tests; existing 7 dashboard/notification tests still green. |
| 5.10 | ~~Student `/student/courses` calendar view — month grid (desktop/tablet) + list fallback (mobile), click weekend → course detail~~ | 5 | [x] <!-- completed 2026-04-25 --> Calendar/List toggle with localStorage persistence, month grid with prev/next/today nav, course pills colored by enrollment status (max 3 per cell + "+N more"), forced list at <640px. Mobile UX needs a better browse pattern than cards (parked for Phase 5/6). 5 desktop Playwright tests green. |
| 5.2 | Open Sailing (holding a spot for $11) (then $60+tip to the captain day of) — per-session enrollment + payment | 5 | **Priority: high.** Different enrollment model. DEC: flag on course (`is_drop_in`), not course_type. |
| 5.7 | Waitlist — full course → join waitlist → notify on opening | 8 | **Priority: high.** New table, student UI, admin visibility, notification on spot opening. Depends on Phase 3 notifications. Andy request. |
| 5.4 | If a course is flagged, then admin needs to appove. student had a textbox they can justify their bullshit. notificatoins all on this crap ---- Prerequisite flagging — `course_type_prerequisites` table, admin warning + override | 3 | **Priority: low.** Flag, not block. "⚠️ No ASA 101 on record" with override checkbox. |
| 5.11 | Bulk price update — multi-select on `/admin/courses` + apply a new price to all selected courses in one action | 8 | **Priority: low.** Single-field bulk edit, narrow scope by design. With 26 ASA 101 + 5 Open Sailing nights in the season, mid-season price changes are otherwise a lot of hand-edits. Multi-field bulk edit is V3. |
| 5.9 | End-of-phase close — @ui-reviewer pass, lint clean, all tests green, all code review resolved, retrospective, archive session log | 5 | **Always last.** Focus on waitlist UI, prerequisite warning flow. |

**Phase 5 total: 39 pts** (session 109: −11 for 5.1/5.3/5.5/5.6 cut to V3; was 50)
**Projected hours: ~13 hrs**

**Ejection point:** Pricing is flexible. Enrollment has safety rails. Prerequisite and waitlist systems exist. Low enrollment flagged early.

---

## Phase 6: Polish & UX

Design quality, accessibility, navigation, convenience features.

Rows ordered: completed grouped at top; unfinished below in priority order (very high → high → medium → low → "high but last" → close). Cut to V3: 6.0, 6.6, 6.11, 6.16. IDs frozen.

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 6.3 | ~~Full @ui-reviewer design review — all roles, all pages, three viewports~~ | 5 | [x] <!-- completed 2026-04-15 --> 8 pages audited across 3 viewports. Scored 7.75/10. S1 nav token, S3 warning color, layout padding, rounded-xl, stat card sizing, heading weights all fixed. |
| 6.4 | ~~Implement @ui-reviewer findings~~ | 5 | [x] <!-- completed 2026-04-15 --> All High + Medium findings fixed. Low-priority items deferred to Phase 5 polish. |
| 6.2 | ~~Mobile responsiveness pass — instructor pages~~ | 2 | [x] <!-- completed 2026-04-30 --> Audited /instructor/dashboard, /instructor/sessions/[id], /instructor/students/[id] at 375px. Two fixes: dashboard stat cards `grid-cols-3` → `grid-cols-2 lg:grid-cols-3` (matches admin pattern from 5.8); roster Email column `hidden sm:table-cell` so 375px shows Name + Phone + Attendance only. 2 mobile-only Playwright tests added. |
| 6.19 | Public course browse + detail pages — `/courses` and `/courses/[id]` (or `/courses/[slug]`) viewable without login; "Register" / "Enroll" CTA prompts auth → `/login?next=...&intent=enroll` | TBD | **Priority: very high — LTSC launch blocker.** Decision (session 109): keep LTSC's WordPress as the marketing front; their per-product pages link "Register" buttons into SailBook. Currently SailBook drops anonymous visitors at `/login`, so any LTSC inbound link is broken. Scope TBD — needs poker. Open questions: (1) URL shape — `/courses/[uuid]` (LTSC link is per-course, admin updates each season) vs `/courses/[slug]` (course-type-level, lists all upcoming courses of that type — closer to LTSC's `/product/asa101-...` shape) vs both; (2) RLS — open SELECT on active courses to `anon` role, or use a public RPC; (3) layout — minimal public chrome (no student/admin sidebar) or stripped student layout; (4) does this also mean a public `/` landing or stays as redirect to `/login`. |
| 6.15 | ~~Admin dashboard — pending cancellation requests widget~~ | 3 | [x] <!-- completed 2026-04-30 --> Newest-first list of cancel_requested enrollments on admin dashboard. Mirrors PendingEnrollments card. Links to /admin/courses/[id]. 1 Playwright desktop test. |
| 6.20 | Admin + instructor calendar views — month grid + list fallback, mirroring the student calendar (5.10) | TBD | **Priority: high — must ship before V2 release.** Reuse the 5.10 component shell. Admin view: all courses, all sessions, filterable by course-type/instructor. Instructor view: only sessions where they're the assigned (course-level OR session-level / DEC-007) instructor. Pts TBD — likely 5–8 since the component exists but role-specific data shapes + filters add work. Promoted from V3 Ideas in session 109. |
| 6.1 | Mobile responsiveness pass — admin pages | 3 | **Priority: medium.** Deferred from V1 (5.23). |
| 6.13 | Using an agent redsign date and time picker (date picker isn't terrible, but time picker is almost unsable) | 3 | **Priority: medium.** Human find time picker to be unusable. Needs redisign, then date picker to match (maybe even combine the two if that makes sense) |
| 6.14 | Consolidate user/student/instructor profile edit screens | 2 | **Priority: medium.** Three separate edit UIs with overlapping fields feel redundant. Audit overlap, design a unified approach (shared component or merged page per role). |
| 6.5 | axe-core accessibility audit — fix critical/serious violations | 3 | **Priority: medium** (default). WCAG 2.1 AA compliance. |
| 6.7 | Relative session badges — "Tomorrow", "This week" instead of "Upcoming" | 3 | **Priority: low.** Date math. Always harder than it looks. |
| 6.9 | Admin dashboard UX redesign | 5 | **Priority: low.** Dashboard has real data by now (payments, holds, notifications). Design it properly. |
| 6.10 | Back button / breadcrumb audit — consistent navigation across all roles and views | 5 | **Priority: low.** Audit every page, establish breadcrumb pattern, fix dead ends. Andy request. |
| 6.18 | CI + iOS testing — GitHub Actions runs Playwright on PRs to main, add iPhone WebKit project (CI-only) | 5 | **Priority: medium** (default). Triggered by Apr 29 mobile bug (missing viewport meta, broke all dropdowns on Android) — desktop tests didn't catch it. Scope: GH Actions workflow with Supabase service container, env secrets, full Playwright run on PR + push to main; add a 4th `iphone` project to `playwright.config.ts` gated to CI (`process.env.CI`); tag the layout/touch-sensitive specs (auth, dropdowns, calendar, payment) so iPhone project only runs those. Decision still open: skip iOS in CI entirely vs full WebKit run vs tagged subset — defer until task starts. Until then, no automated iOS coverage; manual phone test before each demo. |
| 6.8 | WebsiteAuditAI + Attention Insight external audit | 2 | **Priority: high but last** (run after the rest of Phase 6 settles). 10-minute external validation at phase boundary. |
| 6.12 | Security audit (V2 final) — run @security-agent, evaluate findings, fix serious issues, prime V3 backlog | 3 | **Priority: high but last** (run after the rest of Phase 6 settles). Full V2 surface area: payments, notifications, waitlist, prereqs, qualifications. Non-serious findings seed V3 backlog. |
| 6.17 | End-of-phase close — @ui-reviewer pass, lint clean, all tests green, all code review resolved, retrospective, archive session log | 5 | **Always last.** Full V2 surface area. Final retrospective before handoff. |

**Phase 6 total: 52 pts + TBD for 6.19, 6.20** (totals to be reconciled at end of V2 per Eric. Session 109: −9 for 6.0/6.6/6.11/6.16 cut to V3; +TBD for 6.19 LTSC public pages and 6.20 admin/instructor calendars promoted from V3.)
**Projected hours: ~18 hrs + TBD**

**Ejection point:** The app looks and feels professional. Accessible. Navigable. Polished. Security verified.

---

## Phase 7: Remote Dev Environment ✅

Move dev off the laptop onto a Hetzner Cloud server, accessed over Tailscale, edited via VS Code Remote-SSH. Frees the laptop, gives a stable always-on dev box, lets long-running tasks (Playwright, Supabase) keep running across reboots.

| Task | Description | Pts | Status |
|------|-------------|-----|--------|
| 7.1 | Hetzner provisioning — API token, `hcloud` CLI, SSH key, Cloud Firewall, server in Ashburn | 3 | ✅ |
| 7.2 | Server hardening + Tailscale — non-root sudo user, ufw, fail2ban, swap, unattended-upgrades, Tailscale joined, public SSH closed | 3 | ✅ |
| 7.3 | Dev tooling — fnm + Node 22, Docker + Compose, Supabase CLI, gh, Playwright system deps + browsers | 3 | ✅ |
| 7.4 | Repo bring-up — gh auth, clone, `.env.local` synced, `supabase start`, `npm install`, full pgTAP + Playwright pass on remote | 5 | ✅ |
| 7.5 | VS Code Remote-SSH — Windows-side SSH config, Tailscale for Windows, port forward 3000, edit→save→hot-reload loop | 2 | ✅ |
| 7.6 | Document — `docs/HETZNER_DEV.md`, `scripts/hetzner-provision.sh`, `scripts/hetzner-bootstrap.sh`, `scripts/hetzner-dev-tooling.sh`, README pointer | 2 | ✅ |

**Phase 7 total: 18 pts. Server is `ccx23` (4 dCPU / 16 GB / 160 GB) in `ash` at $40/mo.**

**Outcomes:**
- CPX41 was retired across all locations; landed on ccx23 ($6/mo cheaper than CPX41 was, dedicated vCPU vs shared).
- Local Supabase publishable keys are deterministic across machines (same `.env.local` Just Works).
- Non-interactive SSH doesn't source `.bashrc` — `node`/`supabase` are symlinked into `/usr/local/bin` so plain `ssh host 'cmd'` finds them.
- Tailscale SSH (`tailscale up --ssh`) is the auth backstop: even if the SSH config is busted, tailnet identity gets you in.

---

## Phase 8: Skills & Tracking (future — scope TBD)

Transforms the app from scheduling into a learning management tool.

- Skill checklists per course type (ASA 101: tacking, parts of boat, etc.)
- Instructor marks skills demonstrated/executed per student per session
- Student "Sailing Record" accumulates completed skills
- Two-level checkoff: instructor demonstrates → student executes
- Makeup sessions show which skills still need covering
- Cross-instructor continuity via skill records
- Automated experience level progression based on completed skills
- Advanced analytics/reporting

**Phase 8: estimated 40–60 pts. Break down when Phase 6 is complete.**

---

## V3 Ideas (parked)

- Proxy enrollment ("Who are you enrolling?" — Me / Me + someone / Someone else) — requires shopping cart model
- Charter module — separate app, shared auth/profiles infrastructure (Admin Pay Button)
- General program request form — private lessons, corporate events, group bookings
- Youth enrollment — parent/guardian co-enrollment, birth month/year, ASA data standards
- In-app messaging — admin/instructor/student messaging (SMS covers this for now)
- ASA number auto-populate from ASA's API (unlikely to exist)
- Tiered instructor roles — lead/super instructor with elevated permissions
- "Put me in next available" — auto-enroll on next course opening
- Duplicate enrollment auto-clear — confirming one section cancels pending others (refund implications)
- Student calendar view — monthly calendar of enrolled sessions
- ~~Admin / instructor calendar views~~ — promoted to V2 task 6.20 in session 109
- Automated makeup suggestions
- Multi-school / multi-tenant
- AI season setup agent
- Admin impersonation mode ("view as student")
- Full coupon/discount engine (beyond Stripe promotion codes)

**Cut from V2 in session 109 (2026-04-30 priority pass):**
- (4.7) Instructor profile expansion — availability field + bio/website link. Andy request.
- (5.1) Member pricing model — `is_member` flag on profiles, checkout uses correct price. Eric noted: solved by discount codes.
- (5.3) Discount codes — Stripe `allow_promotion_codes: true` + admin-managed codes in Stripe dashboard.
- (5.5) Admin qualification grant ("test out") — manual ASA cert grants via `qualifications` table.
- (5.6) Duplicate enrollment in same course type — warn student + flag for admin. Eric: probably will not happen.
- (6.0) LTSC theme tune — defuse Andy's color reaction (shift `--primary` toward navy, demo in light, stash `globals.ltsc.css` backup).
- (6.6) Duplicate course — one-click copy, drop into edit.
- (6.11) Public landing page + contact form for sailbook.live.
- (6.16) Show refund amount to student on My Courses + course detail.

---

## Summary

| Phase | Pts | Projected Hours (at 0.38 hr/pt) | Ejection Point Value |
|-------|-----|--------------------------------|---------------------|
| 0 — Infrastructure | 70 | ~27 hrs | Dev environment ready |
| 1 — V1 Fixes | 58 | ~22 hrs | V1 is solid |
| 2 — Payments | 40 | ~15 hrs | App makes money |
| 3 — Notifications + Auth | 48 | ~18 hrs | Users stay informed, auth hardened, security audited |
| 4 — Identity | 42 | ~10 hrs | Onboarding is clean (4.7 cut to V3) |
| 5 — Pricing | 39 | ~13 hrs | Flexible pricing, waitlist, prereqs (5.1/5.3/5.5/5.6 cut to V3) |
| 6 — Polish | 52 | ~18 hrs | Professional, accessible, navigable, security verified (6.0/6.6/6.11/6.16 cut to V3) |
| 7 — Remote Dev Env ✅ | 18 | ~7 hrs | Stable dev box, edit anywhere |
| 8 — Skills | 40–60 | ~15–23 hrs | Learning management |
| **Total (0–6)** | **349** | **~123 hrs** | |

Reconciled in session 109 (2026-04-30). Previous Summary total of 298 had been drifting from section totals for several phases (Phase 1 +7, Phase 2 +2, Phase 4/5/6 changes since). New total matches the sum of section totals.

At V1 velocity (0.38 hrs/pt): ~133 hours for Phases 0–6 (theoretical). At Phase 1 pace (0.26 hrs/pt): ~91 hours. With ~5.1 + 14.9 + 18.0 = 38 hrs already spent on Phases 0/1/3 actuals plus partial others, the remaining runway to May 15 is the relevant number — not the all-in.

---

## Velocity Tracking

| Phase | Effort Pts | Est. Hours | Actual Hours | Hrs/Point | Notes |
|-------|-----------|------------|--------------|-----------|-------|
| 0 — Infrastructure | 70 | ~27 | ~5.1 | 0.07 | Setup sprint; not a velocity signal (see RETROSPECTIVES.md) |
| 1 — V1 Fixes | 58 | ~19 | ~14.9 | **0.26** | +8 polish credit (session 49); 0.23 all-in; see RETROSPECTIVES.md |
| (5.10 early) | 5 | ~2 | 1.00 | 0.20 | Pulled forward from Phase 5; rolled into Phase 5 actuals when phase closes |
| 2 — Payments | 38 | ~14 | — | — | |
| 3 — Notifications | 48 | ~18 | ~18.0 | **0.38** | On baseline; many small tasks + 3.11 OAuth scope-creep ate the headroom. See RETROSPECTIVES.md |
| 4 — Identity | 42 | ~10 | — | — | Session 109: −3 (4.7 cut to V3) |
| 5 — Pricing | 39 | ~13 | — | — | Session 109: −11 (5.1/5.3/5.5/5.6 cut to V3) |
| 6 — Polish | 52 | ~18 | — | — | Session 109: −9 (6.0/6.6/6.11/6.16 cut to V3) |
| **Total** | **349** | **~123** | — | — | Reconciled in session 109. Planning baseline: 0.26–0.35 hrs/pt (Phase 1 pace to conservative) |

---

## Estimation Poker — Standing Disagreements

| Task | Claude | Spink | Resolution | Notes |
|------|--------|-------|------------|-------|
| 3.11 OAuth Google (retro) | 2 | 2 | Both wrong — actual ≈5 | Eric had instinct to push back but didn't. Trigger refactor across 4 auth paths, host-header callback fix, Google name-key surprise, proxy role-flag mismatch, VS Code port-forwarding rabbit hole. Lesson: provider integrations look like config flips but aren't — default 5+ unless pattern is established. Logged 2 pts as scored, not retro-bumped. |

---

## Cuttable Tasks (if time is tight)

Session 109 already moved the obvious cuts to V3 (4.7, 5.1, 5.3, 5.5, 5.6, 6.0, 6.6, 6.11, 6.16). Remaining V2 candidates if more is needed, ordered by least impact to cut:

- **6.7** — Relative session badges. Nice UX, zero operational impact.
- **6.9** — Admin dashboard redesign. Functional beats pretty.
- **5.11** — Bulk price update. Hand-edit each course if cut; only painful when prices change mid-season.
- **6.1** — Mobile admin pages. Hamburger menu is the V1 stopgap. (6.2 instructor mobile is "very high" — leave it in.)
- **6.10** — Back button / breadcrumb audit. Real but not blocker-grade.

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
6. Write retrospective entry in `docs/RETROSPECTIVES.md` (velocity, scope changes, process notes, forecast update)
7. Return to primary planning chat — review docs against intent

---

## Pre-Launch Checklist

Before go-live (real data, real students):

- [ ] **Vercel cron — live fire test.** The `expire-holds` cron was only tested via curl locally (Hobby tier rejects sub-daily schedules, so `*/1 * * * *` can't be verified in prod without Pro). Before launch: upgrade to Pro or use pg_cron, deploy with a short schedule, watch Vercel dashboard → Settings → Cron Jobs confirm it fires and `expired` count is correct, then set schedule to production value. Do NOT assume curl = prod parity.
- [ ] Stripe webhook signing secret set in prod env vars
- [ ] `CRON_SECRET` set in prod env vars (or remove if not needed)
- [ ] Twilio / Resend credentials set and `NOTIFICATIONS_ENABLED=true`
- [ ] `supabase db push` applied to prod Supabase project
- [ ] **Auth: enable email confirmations** in Supabase Dashboard → Authentication → Providers → Email → "Confirm email" on. (config.toml does not sync auth panel settings to remote.)
- [ ] **Auth: custom SMTP (Resend) configured** in Dashboard → Authentication → SMTP Settings: host `smtp.resend.com`, port `587`, user `resend`, pass = Resend API key, sender `info@sailbook.live`, sender name `SailBook`. Send the dashboard test email to verify.
- [ ] **Auth: confirmation email template uploaded** in Dashboard → Authentication → Email Templates → "Confirm signup". Subject: "Confirm your SailBook account". Body matches `supabase/templates/confirmation.html`. The `{{ .ConfirmationURL }}` token must be preserved.
- [ ] **Auth: password policy set** in Dashboard → Authentication → Policies: minimum length 12, requirements `lower_upper_letters_digits`. Match `supabase/config.toml`.
- [ ] **Auth: Site URL + Redirect URLs** in Dashboard → Authentication → URL Configuration: Site URL = `https://sailbook.live`, Redirect URLs include `https://sailbook.live/auth/callback`.
- [ ] **Auth: Google OAuth provider** in Dashboard → Authentication → Providers → Google: enable, paste Client ID + Client Secret. In Google Cloud Console, add `https://<prod-supabase-ref>.supabase.co/auth/v1/callback` to Authorized redirect URIs and `https://sailbook.live` to Authorized JavaScript origins.
- [ ] Smoke test: student registers → confirms email → pays → sees enrollment → admin sees payment status
