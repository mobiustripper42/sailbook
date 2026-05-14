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
| 4.3 | ~~Student profile expansion — classes taken, editable ASA number, experience level from codes table~~ | 5 | [x] <!-- closed 2026-05-03 --> Delivered across prior tasks: 1.5 (student history / Experience page), 1.6 (ASA number on profiles + admin list), 1.7 (experience level from codes table), 1.23 (student account edit with ASA + experience). No residual scope. |
| 4.2 | ~~`/admin/users` consolidation — unified users page with role filter (Admin / Instructor / Student), two collapsed invite panels (admin + instructor), column sorting, replaces `/admin/students` + `/admin/instructors`~~ | 8 | [x] <!-- completed 2026-04-30 --> Re-scoped 2 → 8 pts (session 94); actual ~11 pts across two sessions. Session 109 (~6 pts): sortable `SortableHead` w/ aria-sort, both invite panels in collapsed `<details>`, generalized `acceptInvite(role, token)` + `InvitePanel` + new admin invite route + shared `AcceptInviteForm`. JWT bug carryover verified already-fixed in 4.1. Session 110 — task 4.2b (5 pts; Option A): deleted `/admin/students/page.tsx`, `/admin/instructors/{,[id]/edit}`, and per-role invite pages; consolidated invites into `/invite/[role]/[token]` with ROLE_COPY + role validation. Kept `/admin/students/{[id],[id]/edit,new}` alive — student-specific fields (experience/ASA/member) live in `ProfileEditForm`, not the unified `UserEditForm`. Users-list now branches Edit by `is_student`; instructor rows render `InstructorActions` inline preserving DEC-019 confirm dialog. PR #2. |
| 4.9 | ~~End-of-phase close — @ui-reviewer pass, lint clean, all tests green, all code review resolved, retrospective, archive session log~~ | 5 | [x] <!-- closed 2026-05-03 --> Retrospective written in RETROSPECTIVES.md. Phase closed retroactively — all tasks shipped, retrospective skipped at the time due to sprint pace toward May 4 launch. |

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
| 5.2 | ~~Open Sailing (holding a spot for $11) (then $60+tip to the captain day of) — per-session enrollment + payment~~ | 5 | [x] <!-- completed 2026-05-01 --> DEC-027. `is_drop_in` on `course_type` (not course). One-course-per-night structure means existing enrollment + session_attendance + payments model requires zero schema changes to those tables. Migration: `course_types.is_drop_in BOOLEAN NOT NULL DEFAULT FALSE`. Admin course-type form gains checkbox. Student course detail shows drop-in callout when flag is set. Admin course detail shows "Drop-in" badge. 2 pgTAP + 3 Playwright tests. |
| 5.7 | ~~Waitlist — full course → join waitlist → notify on opening~~ | 8 | [x] <!-- completed 2026-05-02 --> `waitlist_entries` table with student-own RLS + admin-all + UNIQUE (course_id, student_id); `get_waitlist_position` SECURITY DEFINER RPC. Notify-all-on-spot-opened model (race-to-enroll). `joinWaitlist`/`leaveWaitlist` server actions. `notifyWaitlistSpotOpened` trigger fans out per channel pref and stamps `notified_at`; wired into `cancelEnrollment` with prior-status guard so non-confirmed cancels don't blast the list. Auto-cleanup of waitlist row in admin manual enroll, `confirmEnrollment`, and Stripe webhook. Student waitlist button + position; admin waitlist card. List-view "Course Full" button replaced with clickable "Join waitlist" link to detail page. 14 pgTAP + 4 Playwright tests. |
| 5.4 | ~~Prerequisite flagging — `course_type_prerequisites` table, admin warning + override~~ | 3 | [x] <!-- completed 2026-05-03 --> Minimum scope: new table + RLS (admin CRUD, authenticated SELECT), admin manager UI on course type edit page, student warning banner on `/student/courses/[id]` (informational, not blocking — any non-cancelled enrollment satisfies). 8 pgTAP + 3 Playwright tests. PR #20. Deferred to V3: justification textbox, admin approval flow, notifications on override. |
| 5.11 | ~~Bulk price update~~ | 8 | [x] <!-- cut 2026-05-03 --> Cut to V3 in the launch-week scope pass. Andy can edit prices one-at-a-time for season opener; 26 ASA 101 + 5 Open Sailing rows is tolerable for the first month. Promote back when bulk edit is needed in earnest. |
| 5.9 | ~~End-of-phase close — @ui-reviewer pass, lint clean, all tests green, all code review resolved, retrospective, archive session log~~ | 5 | [x] <!-- closed 2026-05-03 --> Retrospective written in RETROSPECTIVES.md. Phase closed retroactively — all tasks shipped, retrospective skipped at the time due to sprint pace toward May 4 launch. |

**Phase 5 total: 31 pts** (session 109: −11 for 5.1/5.3/5.5/5.6 cut to V3; session 130: −8 for 5.11 cut to V3; was 50)
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
| 6.19 | ~~Public course browse + detail pages — `/courses/[slug]` viewable without login; "Enroll" CTA prompts auth → `/login?next=/student/courses/[id]`~~ | 5 | [x] <!-- completed 2026-05-01 --> Slug-based URLs (`/courses/asa101`). `slug` column on `course_types` (backfilled from `short_code` lowercase). Anon SELECT RLS on `course_types`, `courses`, `sessions`. `(public)` layout with minimal header. `/dev/ltsc` mock page simulates LTSC inbound links. Course type form + actions updated. 3 anon pgTAP tests (146 total). 7 Playwright tests (LTSC mock, public page, 404, enroll link, E2E inbound flow). |
| 6.15 | ~~Admin dashboard — pending cancellation requests widget~~ | 3 | [x] <!-- completed 2026-04-30 --> Newest-first list of cancel_requested enrollments on admin dashboard. Mirrors PendingEnrollments card. Links to /admin/courses/[id]. 1 Playwright desktop test. |
| 6.20 | ~~Admin + instructor calendar views — month grid + list fallback, mirroring the student calendar (5.10)~~ | 5 | [x] <!-- completed 2026-05-01 --> Shared `SessionsCalendar`, `SessionsList`, `SessionsViewSwitcher` components. Admin page with Course Type + Instructor shadcn Select filters. Instructor page uses DEC-007 two-query merge (course-default + session-level override). Calendar nav link in all 4 nav files. 6 Playwright tests. |
| 6.1 | ~~Mobile responsiveness pass — admin pages~~ | 3 | [x] <!-- completed 2026-05-01 --> Secondary table columns hidden on mobile across courses, course-types, users, course detail (sessions + enrollments), dashboard upcoming sessions. Verified on Eric's phone. |
| 6.23 | ~~Preserve `?next=` through registration — user arriving from public course page who creates an account instead of logging in loses the enrollment destination~~ | 2 | [x] <!-- completed 2026-05-02 --> Login "Register" link + register "Sign in" link both forward `?next=`. `safeNextPath` blocks open-redirect attempts. 4 Playwright tests. |
| 6.13 | ~~Using an agent redsign date and time picker (date picker isn't terrible, but time picker is almost unsable)~~ | 3 | [x] <!-- completed 2026-05-02 --> New `TimeSelect` component (hour `flex-1 min-w-0` + minute `w-[72px] shrink-0`, two shadcn Selects). Wired into `add-session-form`, `makeup-session-form`, `course-form`, `session-row`. Forms switched to `grid-cols-2 sm:grid-cols-3` with Date `col-span-2 sm:col-span-1` (Date full-width on mobile, Start/End side-by-side below). Sessions table wrapped in `overflow-x-auto`. Below 1024px the layout still needs work — see 6.24. PR #12. |
| 6.14 | ~~Consolidate user/student/instructor profile edit screens~~ | 2 | [x] <!-- completed 2026-05-02 --> Single `UserEditForm` covers admin + instructor + student edit pages. Student-only fields (ASA #, experience, member pricing) render conditionally via `is_student` + `has_student_fields` sentinel. Deleted dead `profile-edit-form.tsx` + `instructor-actions.tsx`. Polish on same PR: copy fix on email helper ("Email cannot be changed here."), checkbox label trimmed to "Member Pricing", users list switched to `•••` UserRowActions menu (Edit / Experience / Activate-Deactivate), name cell now a Link to Edit. PR #15. |
| 6.24 | ~~Course detail page mobile rewrite — `/admin/courses/[id]` is broken below 1024px~~ | 5 | [x] <!-- completed 2026-05-02 --> Mobile card list (md:hidden) replaces session table at <md; new `SessionCardItem` mirrors row actions inside a `•••` DropdownMenu. Header refactored to `[Edit] [⋯]` per architect's review (DEC-028) — long titles + active badge no longer collide at 1208px. Edit/Makeup/Add forms normalized to the same flat-panel style (Add was the canonical one). Glyphs aligned to `•••` size="sm" across header + row triggers. Enrollments table wrapped in `overflow-x-auto`. PR #14. |
| 6.5 | ~~axe-core accessibility audit — fix critical/serious violations~~ | 3 | [x] <!-- completed 2026-05-02 --> Three root causes drove the 100+ violations: `--muted-foreground` color contrast (0.56 → 0.52), `--warning` color contrast (0.68/67 → 0.48/0.16/51), and 4 unlabeled Selects (dev-login-helper, session-instructor-select, time-select × 2). New `tests/a11y-helpers.ts` injects axe from node_modules; `tests/accessibility.spec.ts` audits 13 pages across all roles. PR #17. |
| 6.25 | ~~Public course catalog at `/courses` — replaces LTSC `/product-category/course/`~~ | 5 | [x] <!-- completed 2026-05-03 --> New `src/app/(public)/courses/page.tsx`. Responsive grid (1/2/3 col), short_code + cert_body badges, "Coming soon" badge if no upcoming, "From $X" min pricing, SEO metadata. Alpha sort by slug (sort_order migration deferred). 4 Playwright + axe-core coverage. Public-only header CTA fix (PR #27) included since the catalog made the bug visible. PR #23. Known follow-up: nested-interactive a11y bug in card markup (Link wrapping Card containing Button) — flagged in PR review, not yet fixed. |
| 6.26 | ~~Admin courses list — sortable columns + search + status filter (mirror users list)~~ | 3 | [x] <!-- completed 2026-05-03 --> New `src/components/admin/courses-list.tsx` mirrors `UsersList`. Text search (title/type/instructor), status filter pills, sortable headers. Default sort `created_at desc`. Added Created column (md+) so default sort has a visible target. Redundant View action button removed (course title is the link). 4 Playwright tests. PR #22. Follow-up: a11y nits (aria-sort on `<th>`, aria-pressed on filter pills) flagged but deferred — same gap exists in users-list. |
| 6.7 | ~~Relative session badges — "Tomorrow", "This week" instead of "Upcoming"~~ | 3 | [x] <!-- completed 2026-05-02 --> New `fmtDateRelative` util in `src/lib/utils.ts` returns Today / Tomorrow / Yesterday / `Mon, May 5` (weekday + short month + day). Day-grouped session rendering on the new admin dashboard uses it for `dayHeader()`. 7 unit tests. PR #18. |
| 6.9 | ~~Admin dashboard UX redesign~~ | 5 | [x] <!-- completed 2026-05-02 --> Dashboard restructured: date subtitle, 4-pill QuickActions row, StatRow with conditional CleanIndicator (subtle dashed-border treatment when "Enrollment is healthy"). Sessions card spans full width with day-grouped rows; Pending + Cancellation cards in a 2-col grid below. 6 Playwright tests. PR #16. |
| 6.10 | ~~Back button / breadcrumb audit — consistent navigation across all roles and views~~ | 5 | [x] <!-- completed 2026-05-03 --> Audit found most pages already had breadcrumbs but admin links lacked `hover:text-foreground`. Sed-normalized 10 admin pages. Added "Courses" breadcrumb back to catalog on `/courses/[slug]` (the only true dead end). Fixed `proxy.ts` so exact `/courses` path passes unauthenticated. PR #19. |
| 6.18 | ~~CI + iOS testing~~ | 5 | [x] <!-- cut 2026-05-03 --> Cut to V3. Local Playwright + manual phone test before each demo is the V2 process. Promote when (a) Andy is editing on his own and PRs need automated gating, or (b) we hit a second iOS-only regression. |
| 6.21 | ~~Sidebar fixed to viewport height — desktop sidebar scrolls with main content instead of staying fixed~~ | 2 | [x] <!-- completed 2026-05-01 --> `sticky top-0 h-screen overflow-y-auto` added to `aside` in admin, instructor, and student layouts. |
| 6.22 | ~~Form field preservation on server action error — all fields clear when action returns an error, user must re-enter everything~~ | 5 | [x] <!-- completed 2026-05-02 --> 12 components converted from uncontrolled to controlled. register-form switched from `useActionState` action binding to `onSubmit` + `e.preventDefault()` to prevent React 19 `form.reset()` from resetting native `<select>`. 2 Playwright tests. |
| 6.27 | ~~Restore cancelled enrollment~~ | 3 | [x] <!-- completed 2026-05-03 --> `restoreEnrollment` server action with capacity check; restores `missed→expected` for still-scheduled sessions. Restore button on cancelled enrollments in admin course detail. 2 pgTAP + 1 Playwright. PR #21. **Follow-up needed (`task/6.27-fixes`):** code review flagged 4 admin-only edge-case bugs — refund-then-restore guard (refuse if `payments.status='refunded'`), capacity check fail-open on null count, cross-course makeup attendance not restored (drop course_id filter), silent no-op when row isn't cancelled (`.select('id')` after update). |
| 6.28 | ~~Setup Staging Environment~~ | TBD | [x] <!-- cut 2026-05-03 --> Cut to V3. Vercel preview deploys (per-PR) cover the "see it before merge" use case for V2. Dedicated staging Supabase project is the right move for V3 before we have real data to protect. |
| 6.30 | ~~Mobile calendar / list view for students~~ | 5 | [x] <!-- completed 2026-05-03 --> Agenda-style list view grouping sessions by date with sticky day headers. Toggle visible on all viewports (removed mobile detection + hydration flash). `CoursesAgendaList` component. PR #28. |
| 6.29 | ~~Admin course-types list — sortable + name-as-edit-link + row menu (mirror users / courses pattern)~~ | 2 | [x] <!-- completed 2026-05-03 --> `CourseTypesList` client component with sortable columns, name-as-edit-link, `•••` row menu. Extracted shared `SortableHead<T>` component. PR #29. |
| 6.31 | ~~Instructor fixes — DEC-007 dashboard, enrolled count, agenda list, admin calendar filter layout, role nav toggles, JWT sync~~ | 5 | [x] <!-- completed 2026-05-03 --> Dashboard DEC-007 two-query fix; confirmed+completed enrolled count; agenda list view for instructor/admin calendars; `endSlot` prop on `SessionsViewSwitcher` for inline filters; admin self-role bug fix; JWT sync via `adminClient.auth.admin.updateUserById()`; role nav toggles across all three layout shells. PR #30. |
| 6.8 | ~~WebsiteAuditAI + Attention Insight external audit~~ | 2 | [x] <!-- closed 2026-05-03 --> Attention Insight done (heatmaps for student + admin dashboards saved to `docs/admin dashboard.pdf`, `docs/student dashboard.pdf`; signal: student dashboard 58% clarity / admin 48%, both heatmaps land on intended focal points). WebsiteAuditAI skipped — tool can't authenticate past `/login`, so for an internal scheduling app it would only see the marketing surface (which we don't have). Decision noted; not a V3 candidate. |
| 6.12 | ~~Security audit (V2 final)~~ | 3 | [x] <!-- completed 2026-05-03 --> Manual code review (no @security-agent existed). 0 critical, 2 moderate fixed: M1 admin check on `updateUserProfile` (was relying solely on middleware to gate a service-role action); M2 cron routes now fail-closed in prod when `CRON_SECRET` missing (extracted `verifyCron()` helper). 7 deferred items added to V3 backlog (D1–D7 in `docs/SECURITY_AUDIT_V2.md`). PR #TBD. |
| 6.17 | ~~End-of-phase close — @ui-reviewer pass, lint clean, all tests green, all code review resolved, retrospective, archive session log~~ | 5 | [x] <!-- completed 2026-05-03 --> Phase 6 retrospective in `docs/RETROSPECTIVES.md`. Full Playwright suite green (519 passed / 373 skipped / 0 fail after the prereq-flagging pollution fix). Lint clean. Code review on PRs cleared. @ui-reviewer pass folded into 6.31's per-PR review. Session log archive deferred to V2 final close (separate retro). |

**Phase 6 total: 58 pts + TBD for 6.19, 6.20** (Session 109: −9 for 6.0/6.6/6.11/6.16 cut to V3; +TBD for 6.19 + 6.20 promoted from V3. Session 122: +5 for 6.25; +3 for 6.26; +3 for 6.27. Session 127: +TBD for 6.28 staging. Session 129: +5 for 6.30 agenda; +2 for 6.29; +5 for 6.31. Session 130: −5 for 6.18 cut, −TBD for 6.28 cut.)
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

## Phase 9: Deployment & Launch

Take the May-4-ready app and put it in front of real students. One-time work; no feature scope. Order matters — items below are grouped and roughly sequenced.

**Target go-live:** 2026-05-04 (Mon) or 2026-05-05 (Tue), Andy's call. Block off ~3 hours for the deploy itself + 24 hours of "stay near the laptop" after.

### A. Pre-Deploy Sanity (do day before)

- [x] **Branch state.** `main` is green: full Playwright suite passes locally (worker=4) and `supabase test db` clean. Lint clean. No open PRs. *(Session 132: lint fixed in `task/9.A-pre-deploy-cleanup`. pgTAP clean post-reset. Full suite: 13 known-pollution failures, all pass in isolation. PR #33 staging-env work, unrelated.)*
- [x] **`docs/SECURITY_AUDIT_V2.md` checklist** items 1–5 reviewed (env-var presence, smoke test plan). *(Session 132: items 1–3 verified in Vercel — CRON_SECRET on Prod+Preview, SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_* on Prod only, STRIPE_WEBHOOK_SECRET on all envs. Items 4–5 are post-deploy smoke tests, deferred to §G/§H.)*
- [x] **Walk the app cold.** Browse SailBook in an incognito window as anon → student (register flow) → admin. Ten minutes. Note anything ugly. *(Session 132: turned up two real issues — public-course pages had no contact path for "I don't see a date I want" → fixed in PR #35; admin login didn't work after flipping `profiles.is_admin = true` because middleware reads `auth.users.raw_user_meta_data` → §B.3 instructions corrected on this branch.)*
- [x] **Andy walk-through.** Show Andy the dashboard, courses list, manual-enroll flow, refund flow. Get his "ready" or "wait one more day." *(Session 135: closed — same scope as H.1 Andy briefing; tracking on that line.)*
- [x] **Backup the dev DB** (if there's anything in it worth keeping). `supabase db dump --local > backup-pre-launch.sql`. *(Session 132: skipped — local DB is fixtures only; `supabase/seed.sql` is the source of truth. Session 135: closed.)*
- [x] **Tag the launch commit.** `git tag v2.0.0-rc1` on the merge commit you intend to deploy. Push the tag. *(Session 132: tagged on main HEAD after PRs #34, #35, #37 merged.)*

### B. Supabase Production Project

- [x] **Project exists** at supabase.com. Note the project ref (`xxxxx.supabase.co`). *(Session 132)*
- [x] **`supabase db push`** applies all migrations cleanly. Verify with `supabase migration list` — last migration matches local. *(Session 132: prod data wiped via SQL truncate, all 34 migrations re-pushed clean. Note: `--project-ref` flag is ignored; use `supabase link --project-ref <ref>` first, then run plain commands.)*
- [x] **Seed real data.** This is NOT `supabase/seed.sql` (that's test fixtures). Create the real Andy admin account via Supabase Dashboard → Authentication → Users → Add user. **In the User Metadata field at create time, paste `{"is_admin": true, "is_student": false}`** — the `on_auth_user_created` trigger reads that JSON and writes the matching `profiles` row, so you don't need a separate SQL update. Same pattern for real instructors at launch (use `{"is_instructor": true, "is_student": false}`). If a user was already created without metadata, fix it by updating BOTH places: `UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'::jsonb WHERE email = '…';` AND `UPDATE profiles SET is_admin = true WHERE id = (SELECT id FROM auth.users WHERE email = '…');` then have them sign out and back in (role flag lives in the JWT). *(Session 132: Eric's admin seeded; Andy account deferred until staging green-lights.)*
- [x] **Course types loaded.** Either manually via Andy in the admin UI post-launch, OR pre-load via SQL (preferred so course catalog isn't empty on day 1). At minimum: ASA 101, ASA 103, Open Sailing, any others Andy is offering. *(Session 132: ran `supabase/seeds/2026_season_courses.sql` via Supabase SQL Editor — 6 ASA course types + ASA 101 weekend courses for May–Oct 2026.)*
- [x] **Auth panel: enable email confirmations.** Dashboard → Authentication → Providers → Email → "Confirm email" ON. (`config.toml` does NOT sync this.) *(Session 132)*
- [x] **Auth panel: custom SMTP (Resend).** Dashboard → Authentication → SMTP Settings: host `smtp.resend.com`, port `587`, user `resend`, pass = Resend API key, sender `info@sailbook.live`, sender name `SailBook`. Send the dashboard test email and verify delivery. *(Session 132: dashboard "Send test email" button no longer exists; verified instead by real signup — From/sender both correct.)*
- [x] **Auth panel: confirmation email template.** Dashboard → Authentication → Email Templates → "Confirm signup". Subject: "Confirm your SailBook account". Body matches `supabase/templates/confirmation.html`. The `{{ .ConfirmationURL }}` token must be preserved verbatim. *(Session 132: all 6 templates pasted in — confirmation, recovery, magic_link, email_change, invite, reauthentication.)*
- [x] **Auth panel: password policy.** Dashboard → Authentication → Policies: minimum length 12, requirements `lower_upper_letters_digits` (matches `supabase/config.toml`). *(Session 132)*
- [x] **Auth panel: Site URL + Redirect URLs.** Dashboard → Authentication → URL Configuration: Site URL = `https://sailbook.live`, Redirect URLs include `https://sailbook.live/auth/callback`. *(Session 132: verified by fresh signup — confirmation link now resolves correctly to sailbook.live, redirect to /student/dashboard works.)*
- [x] **Auth panel: Google OAuth.** Dashboard → Authentication → Providers → Google: enable, paste Client ID + Secret. In Google Cloud Console: add `https://<prod-ref>.supabase.co/auth/v1/callback` to Authorized redirect URIs and `https://sailbook.live` to Authorized JavaScript origins. *(Session 132: prod sailbook.live works. Note: `dev-sailbook.vercel.app` Google flow still redirects to localhost — staging/dev env Supabase Site URL not configured. Tracked separately, not a launch blocker.)*
- [x] **Database backups confirmed.** Dashboard → Database → Backups: point-in-time recovery is enabled (Pro plan only — verify the project tier). If on Free tier, accept the daily-snapshot-only risk and document it. *(Session 132: prod is on Free tier — NO backups at all (Free doesn't include daily snapshots either). Risk accepted for launch. Upgrade to Pro tracked as post-launch action below.)*

### C. Stripe Live Mode

- [~] **All §C items deferred** *(Session 132: Eric does not have LTSC's Stripe live keys — Andy needs to provide them. Until then, prod cannot accept payments. Enrollment + checkout flows will fail at the Stripe step. Mitigations: keep prod in this state for marketing/info viewing only, OR add a "payments coming soon — email to register" banner. Revisit when Andy supplies keys.)*

### D. Notification Providers

- [x] **Twilio.** Account is on a paid plan (not trial — trial caps to verified-only numbers). Buy a US local number if not already done. Note the Account SID, Auth Token, and From number. *(Session 135: closed — SMS deferred to post-V2 via `SMS_ENABLED` kill-switch. Twilio account exists with toll-free number, paid plan; revisit when A2P clears.)*
- [x] **Twilio: A2P 10DLC registration.** Deferred to post-V2 — V2 ships email-only. *(Session 135: closed as a Phase 9 checkbox — A2P friction blocks indefinitely. `SMS_ENABLED` env-var kill-switch (default false in prod) gates all SMS sends; UI hides SMS toggles + consent text. CI keeps the SMS path test-covered. Re-enable by flipping the env var when A2P clears. Earlier: Session 133 Twilio toll-free rejected Error 30513; consent text on /register + /student/account from PR #40.)*
- [x] **Resend.** Domain `sailbook.live` verified (DNS records added: SPF, DKIM, optionally DMARC). Send a test email from the Resend dashboard to confirm. *(Session 132. Two paths use Resend: Supabase Auth via SMTP (set in §B.6) AND app notifications via HTTP API. App-notification path requires `RESEND_API_KEY` and `NOTIFICATIONS_ENABLED=true` env vars on Vercel Production — both added.)*
- [ ] **Resend paid plan.** Free is 100/day, 3,000/mo — insufficient now that SMS is deferred and email is the only notification channel. Upgrade to Pro ($20/mo, 50k/mo) before real student volume. *(Session 135: queued — required before public launch traffic ramps.)*
- [x] **`info@sailbook.live`** is a real address that forwards to Andy. Otherwise users replying to confirmation emails go nowhere. *(Session 132: forwards to Eric for now; Andy added when he's onboarded.)*

### E. Vercel Project

- [x] **Project linked** to the GitHub repo. Production branch = `main`. Deploys auto on merge. *(Session 132)*
- [x] **Custom domain `sailbook.live`** added to project. SSL cert provisioned (automatic via Vercel/Let's Encrypt). *(Session 132: apex set as primary, www → apex 308 redirect.)*
- [x] **DNS records** at the registrar: A record for apex `sailbook.live` → Vercel IP, CNAME for `www.sailbook.live` → `cname.vercel-dns.com`. Verify via `dig sailbook.live` resolves to Vercel. *(Session 132: Cloudflare DNS-only / grey-cloud, not proxied.)*
- [x] **Plan tier:** Hobby is free but rejects sub-daily cron schedules. The `expire-holds` cron needs at least every-15-min cadence to keep payment holds tight — this requires Pro ($20/mo). Decision: upgrade to Pro, OR move `expire-holds` to a pg_cron job inside Supabase (no Vercel dependency for that one). Prod requires one or the other. *(Session 132: on Pro tier; current cron cadence is daily, sub-daily available if needed later.)*
- [x] **Cron jobs configured** in `vercel.json` (or Vercel Dashboard → Settings → Cron Jobs): *(Session 132: 3 daily crons in vercel.json — expire-holds 5am ET, low-enrollment 9am ET, session-reminders 10am ET.)*
  - `/api/cron/expire-holds` — every 15 min (or whatever the configured `hold_minutes` margin allows)
  - `/api/cron/session-reminders` — daily at ~07:00 local (Andy's tz: America/New_York)
  - `/api/cron/low-enrollment` — daily at ~08:00 local
- [x] **Environment variables** (Vercel Dashboard → Settings → Environment Variables, scope = Production): *(Session 132: all set except Twilio (deferred pending A2P) and STRIPE_* using sk_test_*/whsec_* sandbox keys until LTSC live keys arrive.)*
  - `NEXT_PUBLIC_SUPABASE_URL` = prod Supabase URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = prod anon key
  - `SUPABASE_SERVICE_ROLE_KEY` = prod service role key (NEVER on `NEXT_PUBLIC_*`)
  - `NEXT_PUBLIC_SITE_URL` = `https://sailbook.live`
  - `STRIPE_SECRET_KEY` = `sk_live_*`
  - `STRIPE_WEBHOOK_SECRET` = `whsec_*` from production webhook
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
  - `RESEND_API_KEY`
  - `NOTIFICATIONS_ENABLED` = `true`
  - `CRON_SECRET` = a long random string (generate with `openssl rand -hex 32`); must match the `Authorization: Bearer` header Vercel Cron sends
  - `NEXT_PUBLIC_DEV_MODE` = unset (or `false`) — controls dev login helper visibility
  - Sanity: `NODE_ENV` and `VERCEL_ENV` are set automatically by Vercel; do NOT override.
- [x] **Trigger production deploy** — push to main or click "Redeploy" on the latest deployment in the dashboard. Watch the build log for errors. First prod build often surfaces issues that local dev hides (case-sensitive imports on Linux, missing peer deps, etc.). *(Session 132: many redeploys done over the course of config troubleshooting; latest build green.)*

### F. Deploy-Day Smoke Tests (run in this order on the live URL)

- [x] **`https://sailbook.live` loads** the public landing/courses page without errors. *(Session 134: 200 confirmed via curl)*
- [x] **Anon → public catalog → course detail → "Register & Pay"** prompts login. Click "Register" → fill form → check the inbox arrives → confirmation link works → lands on the original course page. *(Session 135: walked end-to-end on staging `dev-sailbook.vercel.app`. Confirmation email landed, redirect to original course page worked. Required syncing custom SMTP toggle + Resend creds on staging Supabase first — see J.5.)*
- [~] **Stripe checkout end-to-end with a real card** ($1 course or use Andy's actual card). After payment: enrollment shows as confirmed, payment row inserted, confirmation email arrives. *(Session 134: deferred — waiting on Andy's live Stripe keys)*
- [~] **Refund the test charge** via admin UI. Verify Stripe dashboard shows the refund. *(Session 134: deferred — depends on live Stripe keys)*
- [x] **Cancel + restore enrollment** flow exercised end-to-end. *(Session 135: walked on staging — student cancel → admin Process Refund dialog → Refund & Cancel → status=cancelled → Restore button restores to confirmed. Gap noted: Restore re-flips the enrollment but the refund is irreversible in Stripe; restored student shows confirmed-but-unpaid with no in-app re-bill prompt. Accepted for V2 — Andy handles re-billing offline.)*
- [x] **SMS** (if A2P approved) — student preferences set to SMS, trigger any notification (e.g., admin enrolls them manually with notify=on), SMS arrives within 30 sec. *(Session 135: closed as a Phase 9 checkbox — SMS path gated off via `SMS_ENABLED`. Re-run this smoke when A2P clears and the env flips.)*
- [x] **Cron live-fire test.** From a terminal: `curl -H "Authorization: Bearer $CRON_SECRET" https://sailbook.live/api/cron/expire-holds` returns `{"expired": N}`. Repeat for `session-reminders` and `low-enrollment`. Watch Vercel Dashboard → Settings → Cron Jobs for the next scheduled tick to confirm Vercel is hitting them too. *(Session 135: verified passively via Vercel Dashboard → Settings → Cron Jobs run history — successful executions on prod and staging. Skipped the temp-CRON_SECRET juggle since cron history shows green ticks.)*
- [x] **Without the auth header** the same routes return 401. (`curl https://sailbook.live/api/cron/expire-holds`) *(Session 134: confirmed — all 3 cron routes return 401)*
- [x] **Test API routes blocked.** `curl https://sailbook.live/api/test/enroll` returns 403 (devOnly belt-and-suspenders). *(Session 134: confirmed)*
- [ ] **Mobile.** Open the live URL on Andy's actual phone. Tap through the admin dashboard, instructor dashboard, student calendar. Anything ugly gets logged for Phase X follow-up; anything broken is a hotfix candidate.

### G. Operational Setup

- [x] **Vercel deploy notifications** wired to Andy's email (Vercel Dashboard → Settings → Notifications) so failed deploys don't go silent. *(Session 135: closed — Eric receives them; sufficient for V2. Add Andy via team invite later if needed.)*
- [~] **Supabase project notifications** for hitting plan limits (rows, bandwidth) configured. *(Session 134: deferred — upgrading to Pro tier post-launch; Pro has proper alerting)*
- [x] **Stripe email alerts** for refunds + disputes go to Andy. *(Session 135: closed — Andy will configure on his Stripe account directly once he provides live keys; not a launch-gate.)*
- [x] **Status page bookmarks** for Andy: status.vercel.com, status.supabase.com, status.stripe.com, status.twilio.com, status.resend.com. When something breaks, check these first. *(Session 134: sent to Andy)*
- [x] **Logging access.** Vercel Dashboard → Deployments → [latest] → Runtime Logs is the production log surface. Andy doesn't need this; Eric should know where it is. *(Session 134: noted)*
- [x] **Error monitoring (V3 backlog).** No Sentry-style integration yet. For V2 launch, Vercel Function Logs + Supabase logs cover the surface. Add proper error reporting in V3 if/when traffic warrants. *(Session 134: confirmed V3 backlog)*

### H. Communications

- [ ] **Andy is briefed** on: how to add a course, how to enroll a student manually, how to issue a refund, how to deactivate an instructor, how the cancellation request flow works, how to read the dashboard tiles. 30-minute sit-down.
- [x] **Andy has the credentials** he needs: his admin login, Stripe dashboard access (as team member, not the API key), Resend dashboard, Twilio dashboard (or just Andy's account, his choice). *(Session 135: closed — handled directly with Andy outside this checklist.)*
- [x] **Existing students notified** (if migrating from old system). If not — you're starting fresh, then no notification needed; new students discover via Andy's existing channels (LTSC, word of mouth, the public course catalog). *(Session 135: closed — fresh start, no migration. Andy's existing channels handle discovery.)*
- [x] **Eric is reachable** for the first 24-48 hours post-launch. Phone, Slack, whatever. Andy needs a hotline for "the button isn't working." *(Session 135: closed — Andy has Eric's contact info; standing arrangement.)*

### I. Rollback Plan *(deferred — Session 132: Eric decided not to formalize for V2 launch. Ad-hoc only.)*

- [x] **Revert path documented.** If the deploy goes sideways: Vercel Dashboard → Deployments → previous build → "Promote to Production" rolls back the app in <60 sec. The DB does NOT roll back; only the app code does. *(Session 135: closed — ad-hoc only per Session 132; documented inline above.)*
- [x] **Migration rollback.** If a migration breaks prod, the answer is NOT `git revert` — it's a new forward-only migration that fixes the issue. Have a forward-fix template ready. *(Session 135: closed — forward-fix posture established; ad-hoc.)*
- [x] **Maintenance mode.** Not implemented. If we need to take the app down for an hour: simplest is to swap Vercel domain to a static "back soon" page, OR set a feature flag in the homepage. Decide which approach + write the procedure now, before you need it at 2am. *(Session 135: closed — accepted risk for V2; ad-hoc if needed.)*
- [x] **"Oh shit" contact list.** Vercel support, Supabase support (Pro tier only), Stripe support — phone numbers / chat URLs saved somewhere Andy and Eric can both find. *(Session 135: closed — accepted risk for V2; provider status pages already bookmarked in G.4.)*

### J. Post-Launch (first 7 days)

- [x] **Monitor daily** — check Vercel Function Logs for errors, Supabase Database → Query Performance for slow queries, Stripe for failed payments. *(Session 135: closed — ongoing operational habit, no longer a launch task.)*
- [x] **Capture every Andy bug report** as a GitHub issue tagged `launch-week`. Triage: hotfix vs Phase 9.5. *(Session 135: closed — process established; no open bugs as of session close.)*
- [x] **Upgrade prod Supabase to Pro tier** — current Free tier has NO database backups. One unrecoverable misconfiguration or accidental delete = data loss. $25/mo for Pro buys daily backups + 7-day point-in-time recovery + the Vercel cron decision flexibility. *(Session 135: confirmed on Pro; daily backups + PITR active. Email rate limit verified at 30/hr — sufficient for LTSC's volume.)*
- [x] **Staging Google OAuth** — fixed alongside J.5 (staging auth config sync). *(Session 135: root cause was unconfigured custom SMTP + missing redirect URL on staging Supabase. Once §B.4–B.9 were brought to parity with prod, OAuth establishes session correctly. Both password and Google auth now work on `dev-sailbook.vercel.app`.)*
- [x] **Staging Supabase auth config parity with prod (J.5)** — staging Supabase was missing dashboard-only config that doesn't ride with migrations/config.toml: custom SMTP toggle, email templates, Site URL/redirect URLs, password policy, Google OAuth. *(Session 135: walked §B.4–B.9 of this plan against staging dashboard. Custom SMTP enabled → email rate limit moved off the 2/hr built-in cap. F.2 then succeeded on staging.)*
- [x] **First V3 priority pass** (the slow week post-launch): D1–D7 from security audit, 5.11/6.18/6.28 from V2 cuts, plus whatever the V3 backlog at the bottom of this file holds. *(Session 135: closed as a Phase 9 checkbox — V3 planning runs as its own phase, not a launch task.)*

### K. V2 Final Retrospective

- [x] After the dust settles (~7 days post-launch), write the final V2 retro in `docs/RETROSPECTIVES.md`. Cover: V2 in aggregate (started Apr 11, shipped May 4 / 5), velocity per phase reconciled, what broke / didn't break in launch week, lessons for V3 cadence. *(Session 135: closed as a Phase 9 checkbox — when written, the retro lives in RETROSPECTIVES.md, not here.)*

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
- TimeSelect compact mode at narrow widths — at <432px the hour Select's chevron starts overlapping AM/PM text inside the Edit / Makeup forms (which sit inside the SessionCardItem `border + p-3` wrapper, ~14px less inner width than AddSessionForm at the bottom of the Sessions card). Two paths: (1) tighten the shadcn `SelectTrigger` chevron padding via a TimeSelect-scoped class, or (2) replace the hour shadcn Select with a number-spinner-only component for time fields. ~2 pts. Noted in session 122 — acceptable for V2 launch.
- Admin enroll student selector — replace shadcn `Select` in `AdminEnrollStudentPanel` with a typeahead/Combobox (cmdk). Current `{last_name}, {first_name} — email` SelectItem format overflows the trigger width when a student is selected, and the dropdown gets unwieldy as the student list grows. A typeahead lets the admin type a name fragment and disambiguates collisions ("John Smith") via email without the trigger having to render the full label. ~3 pts. Noted in session 122 — overrun acceptable for V2 launch.

**From 6.12 security audit (2026-05-03) — see `docs/SECURITY_AUDIT_V2.md` for details:**
- (D1) `requireAdmin()` helper applied across ~15 admin/instructor server actions (courses, sessions, attendance, instructors, course-types). Defense-in-depth — RLS already blocks unauthorized writes; this turns silent fails into explicit "Unauthorized" errors. ~3 pts.
- (D2) `npm audit fix --force` — 1 high + 6 moderate vulns (postcss XSS, uuid bounds, svix/resend chain). Breaking — bumps resend to 6.x. Do post-launch. ~2 pts.
- (D3) Security headers in `next.config.ts` — CSP, HSTS, X-Frame-Options, Referrer-Policy, X-Content-Type-Options. ~2 pts.
- (D4) Standardize JWT role-flag cast in RLS policies (`'true'::text` vs `::boolean = TRUE`). Cosmetic. ~1 pt.
- (D5) Rate limiting on Stripe webhook + auth callback. Stripe enforces upstream; Supabase auth has anti-spam. Acceptable as-is. ~3 pts if added.
- (D6) Notification unsubscribe links — when added, sign with HMAC and scope to user.
- (D7) Waitlist `created_at` enforcement at RLS layer (currently mitigated by server action). ~1 pt.

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

**Cut from V2 in session 130 (2026-05-03 launch-week pass):**
- (5.11) Bulk price update — multi-select on `/admin/courses` + apply a new price to all selected. 8 pts. Single-edit is tolerable for the season opener; bulk needed before mid-season campaigns.
- (6.18) CI + iOS testing — GitHub Actions Playwright on PRs + iPhone WebKit project. 5 pts. Local Playwright + manual phone test is the V2 process. Promote when Andy edits or after a 2nd iOS-only regression.
- (6.28) Setup Staging Environment — dedicated staging Supabase project. TBD pts. Vercel preview deploys cover the V2 "see it before merge" need; dedicated staging matters once we have real student data to protect.

---

## Summary

| Phase | Pts | Projected Hours (at 0.38 hr/pt) | Ejection Point Value |
|-------|-----|--------------------------------|---------------------|
| 0 — Infrastructure | 70 | ~27 hrs | Dev environment ready |
| 1 — V1 Fixes | 58 | ~22 hrs | V1 is solid |
| 2 — Payments | 40 | ~15 hrs | App makes money |
| 3 — Notifications + Auth | 48 | ~18 hrs | Users stay informed, auth hardened, security audited |
| 4 — Identity | 42 | ~10 hrs | Onboarding is clean (4.7 cut to V3) |
| 5 — Pricing | 31 | ~10 hrs | Flexible pricing, waitlist, prereqs (5.1/5.3/5.5/5.6/5.11 cut to V3) |
| 6 — Polish | 58 | ~22 hrs | Professional, accessible, navigable, security verified (6.0/6.6/6.11/6.16/6.18/6.28 cut to V3) |
| 7 — Remote Dev Env ✅ | 18 | ~7 hrs | Stable dev box, edit anywhere |
| 8 — Skills | 40–60 | ~15–23 hrs | Learning management |
| **Total (0–6)** | **347** | **~123 hrs** | (session 130: −8 for 5.11 cut, −5 for 6.18 cut, +6 reconciliation in Phase 6 Summary row) |

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

Folded into Phase 9 (Deployment & Launch). See above.
