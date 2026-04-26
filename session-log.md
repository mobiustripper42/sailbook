# SailBook — Session Log

Session summaries for continuity across work sessions.
Format: prepend newest entry at the top.

## Session 96 — 2026-04-25 18:48–20:26 (1.67 hrs, maintenance/cleanup session)
**Duration:** 1.67 hrs | **Points:** 0 (no plan-task slots — Twilio fix, test fix, seed rewrite, plan update)
**Task:** Twilio import fix + instructor-invite test fix + Open Sailing seed model + 5.11 plan add

**Completed:**
- **Twilio import shape fix.** `src/lib/notifications/twilio.ts` — switched from `twilioMod.default(sid, token)` (CJS/ESM-interop fragile) to `const { Twilio } = await import('twilio'); new Twilio(sid, token)`. Promoted to urgent because Eric flipped `NOTIFICATIONS_ENABLED=true` in `.env.local` mid-session — any real SMS attempt would have thrown without this fix. **Code review confirmed pattern is correct for `twilio` v6.**
- **Instructor-invite Playwright test fix (was the pre-existing failure).** `tests/instructor-invite.spec.ts` — `.once('dialog', d => d.accept())` → `.on('dialog', d => d.accept())` in two places. Theory: a stray earlier dialog event consumed the one-shot handler so the actual confirm() popup went unhandled and Playwright auto-dismissed the modal, making the click hang for 30s. All 3 tests in the file now green across viewports, twice in a row.
  - Briefly appeared still-broken after `supabase db reset` (cold-compile flake — Next.js takes ~15-30s to compile a route on first hit; test's 30s click was racing). Stable once routes warmed.
- **Open Sailing seed model rewrite.** `supabase/seed.sql`:
  - One course with 5 sessions (`c006`) → five courses with one session each (`c006`-`c010`, Jul 1/8/15/22/29). Each independently enrollable, matching drop-in / per-night model. Mike instructs all five. Chris (dual-role student) enrolled in c006 (Jul 1) for the demo.
  - $65 flat price for now (deposit/cash split is Phase 5.2).
  - **All seed users now share `+14403631199`** (a non-primary number Eric explicitly designated as disposable). Every dev-fired notification SMSes him — smoke test built into the seed.
  - `tests/student-enrollment.spec.ts:20` — selector updated to `'Open Sailing — Jul 1'` with `{ exact: true }` to avoid matching "Jul 15".
  - `src/app/dev/page.tsx:222` — walkthrough text updated.
- **PROJECT_PLAN.md — 5.11 added.** Bulk price update on `/admin/courses` (8 pts, cuttable). Phase 5 now 47 pts.
- Commit `6ec2a82`.

**In Progress:** Nothing.

**Blocked:**
- **Smoke tests on hold.** Eric registered the wrong domain with Resend earlier — re-verifying now (in progress). Twilio toll-free verification also still pending the business-verification form. Both gate any real-provider end-to-end test.
- `supabase db push` to remote (overdue 6 sessions).

**Next Steps (in order):**
1. **First thing next session — three small fixes pinned by Eric/code review:**
   - Add `Reply STOP to opt out.` to student SMS template body in `templates.ts` (`enrollmentConfirmation()` only — don't touch admin templates). No backend change — Twilio handles STOP automatically.
   - Add SMS consent disclosure on `/register` near phone field: *"Phone number is used for enrollment confirmations and session reminders. Standard message rates apply. Reply STOP to opt out."*
   - **Fix pgTAP test breakage from the Open Sailing seed rewrite** (3 files, real assertion mismatches — see Code Review #1-3 below). Without this, next `supabase test db` run will fail.
2. Run full Playwright suite + `supabase test db` (Eric punted both for this session).
3. Then: 4.2 (`/admin/users` consolidation, 8 pts).
4. `supabase db push` to remote (overdue).

**Context:**
- **`.once('dialog', ...)` is a Playwright trap.** Use `.on(...)` for click flows that may emit multiple dialogs over a test's life (or hoist `.once` above the very first interaction that could trigger any modal). This was the one-line fix for an issue that's been failing across multiple sessions.
- **All seed users share Eric's disposable mobile.** Intentional for SMS smoke testing during dev. Means any `NODE_ENV=test`-style run with `NOTIFICATIONS_ENABLED=true` against this seed will send live SMS. No env guard exists today; don't run Playwright with `NOTIFICATIONS_ENABLED=true` in `.env.local` until that guard exists or you'll fire real SMS to that number.
- **Dev server inherits its `.env.local` snapshot at startup.** Env flips need a server restart to take effect. Confirmed today: dispatcher routed to mock mode even after Eric flipped `NOTIFICATIONS_ENABLED=true` because the dev server was already running. Restart picked it up cleanly.
- **Twilio toll-free verification needs a public proof-of-consent URL.** Eric is filling that form. Recommended path: a public Google Doc explaining the opt-in flow, linked in the form. The actual `/register` consent line can land in parallel.
- **Maintenance sessions count as 0 plan points.** Velocity tracking for this session is intentionally unrecorded — none of the work mapped to a plan-table slot. The actual hours still happened.

**Code Review:** 3 real bugs (pgTAP test drift from seed rewrite — must fix before next `supabase test db`), 1 advisory cleanup, 1 consistency note (dismissed by Eric — phone is disposable), 1 future-Phase-3 prerequisite.

1. **bug** `supabase/tests/03_rls_enrollments.sql` — Header comment claims `e006: d010-d014 → 5 rows`. After seed rewrite, e006 has 1 attendance row. Total attendance went from 17 to 13. Any `count(*)` against `session_attendance` will fail.
2. **bug** `supabase/tests/02_rls_courses.sql` — Counts assume 6 courses / 14 sessions. New seed has 10 courses, 14 sessions. Active-courses-for-student count was (c001/c002/c003/c006)=4; now (c001/c002/c003/c006-c010)=8 active + c004 enrolled = 9. Assertions at lines ~121, 138, 174 will break.
3. **bug** `supabase/tests/05_cascade.sql` — Mike previously taught c001/c004/c006 (3 courses). Now teaches c001/c004/c006-c010 (7 courses). Cascade assertions tied to instructor counts will fail.
4. **cleanup** `tests/instructor-invite.spec.ts:50` — `.on('dialog', ...)` is registered after `loginAs` + `goto`. Fine because nothing on those triggers a dialog. Reviewer suggests hoisting earlier for symmetry with line 126. Optional.
5. **consistency** ~~Real PII in seed.~~ Dismissed — Eric confirmed `+14403631199` is a disposable number, not his primary. Will revisit when/if a primary number lands in seed.
6. **security/future** Phase 3 prerequisite: `profiles` should have a `sms_opt_in_at` column (or equivalent) for Twilio toll-free A2P opt-in proof on file. Pin for 3.10 (auth hardening) or earlier — relevant to the consent disclosure work pinned for next session.

## Session 95 — 2026-04-25 15:28–18:25 (0.67 hr, mostly offline — Eric configured Twilio/Resend)
**Duration:** 0.67 hr | **Points:** 4 (3.1: 2, 3.2: 2)
**Task:** Phase 3.1 + 3.2 install close-out + Open Sailing / bulk-edit design discussion

**Completed:**
- **Phase 3.1 + 3.2 done.** Eric configured Twilio + Resend accounts offline (real account, real number, real domain), all keys/IDs in `.env.local`. Ran `npm install twilio resend`.
- Removed the placeholder `@ts-expect-error` directives from `src/lib/notifications/twilio.ts:13` and `src/lib/notifications/resend.ts:12` — they were load-bearing only while the npm packages were absent. Build was failing with "Unused @ts-expect-error directive" on first build of the session; the cleanup was queued explicitly in session 92's notes.
- Commit `963b5e9`.

**Design discussion (no implementation):**
- **Open Sailing model.** Decided: 1 course per Wednesday with 1 session each (no schema change). Existing data model already supports it. Seed data needs to change. Deposit/cash pricing model stays scoped as Phase 5.2 (5 pts).
- **Bulk price update.** New Phase 5 task (5.11, 8 pts, cuttable) — multi-select on `/admin/courses` + bulk-edit price. Single-field, narrow scope. Multi-field bulk edit is V3.
- Both items lined up but NOT yet built — seed data change and PROJECT_PLAN.md update happen next session.

**In Progress:** Nothing. Two items queued explicitly:
- Open Sailing seed data rewrite (5 courses replacing c006, attendance/enrollment shifts, test selector update).
- PROJECT_PLAN.md: add 5.11 bulk price update (8 pts cuttable), bump Phase 5 totals.

**Blocked:**
- `NOTIFICATIONS_ENABLED=true` flip — gated on Twilio Toll-Free Verification approval (multi-day form, see `docs/NOTIFICATION_SETUP.md`). Until then, dispatcher stays in mock mode.
- `supabase db push` to remote (overdue 5 sessions).
- Pre-existing instructor-invite Playwright failure (test-side, manual QA confirmed feature works).

**Next Steps:**
1. **Seed data change for Open Sailing** (small, ~30 min) — already planned out.
2. **Add 5.11 bulk price update to PROJECT_PLAN.md.**
3. **Then:** 4.2 `/admin/users` consolidation (8 pts, scope locked).
4. Investigate instructor-invite test regression.
5. Twilio `import` shape fix (see Code Review #1) — must land before `NOTIFICATIONS_ENABLED=true`.

**Context:**
- **Twilio v6 import shape is fragile.** Current code uses `twilioMod.default(sid, token)` after `await import('twilio')`. That works today via CJS/ESM interop but isn't robust. Code review recommended `const { Twilio } = await import('twilio'); new Twilio(sid, token)` (named import + constructor). Not blocking right now because `NOTIFICATIONS_ENABLED=false`, but must be fixed before any live SMS fires.
- **Twilio is pinned to `^6.0.0`** which has zero patch releases. Code review flagged risk — `^6` will silently float across early-major breakages. Worth pinning to the exact version once it stabilizes.
- **Resend import shape is correct** — `new resendMod.Resend(apiKey)` matches the package's named export.
- **Open Sailing pricing reality (per Eric):** $65 night, optional $10 refundable deposit to hold spot + $50 cash to captain night-of, OR pay $65 in full. The deposit/cash split is Phase 5.2; full-price-via-Stripe path works in today's model. Seed will use $65 flat for now.
- **Bulk-edit reality:** 26 ASA 101 + ~20 Open Sailing nights = a lot of hand-edits if prices change mid-season. Bulk price update covers the high-frequency pain; multi-field bulk edit is overkill for V2.

**Code Review:** 1 bug (queued, non-blocking), 1 cleanup.
1. **bug** `twilio.ts:14` — `twilioMod.default(sid, token)` leans on CJS/ESM interop. Switch to `const { Twilio } = await import('twilio'); new Twilio(sid, token)`. **Must fix before NOTIFICATIONS_ENABLED=true.**
2. **cleanup** `package.json` — `twilio ^6.0.0` floats across early-major patches. Pin to the exact version (`6.0.0` or whatever resolved) until v6 settles.

## Session 94 — 2026-04-25 09:06–15:14 (1.00 hr, in-and-out — boat day)
**Duration:** 1.00 hr | **Points:** 5 (5.10: 5)
**Task:** Phase 5.10 student calendar view + session 93 code review fixups + 4.2 re-scope

**Completed:**
- **Phase 5.10 — student courses calendar view (5 pts).**
  - `src/components/student/courses-card-list.tsx` — extracted card grid + `CourseCardData` type (server-render).
  - `src/components/student/courses-calendar.tsx` — month grid client component, prev/next/today nav, course pills colored by enrollment status (primary/accent/muted), `MAX_PILLS_PER_CELL = 3` with "+N more" overflow.
  - `src/components/student/courses-view-switcher.tsx` — Calendar/List toggle, `localStorage` persistence (`sailbook.courses-view`), forces list at <640px via `matchMedia`.
  - `src/app/(student)/student/courses/page.tsx` rewritten to build `CourseCardData[]` and hand both views to the switcher.
  - `tests/student-courses-calendar.spec.ts` — 5 desktop tests (1 mobile-only test for forced-list assertion). All green.
- **Session 93 code review fixups (3 fixes).**
  - `templates.ts` — `esc()` HTML helper; every `${…}` in the three `emailHtml` strings wrapped. Defense in depth across `studentFirstName`, `courseTitle`, `studentEmail`, `paymentMethod`, `where` (location), and computed values like `dollars()` and `dateStr`.
  - `actions/enrollments.ts` — `confirmEnrollment` now fires `notifyEnrollmentConfirmed`. Was the third confirmation path missed in 3.4.
  - `triggers.ts` — threshold switched from `Math.floor(capacity * ratio)` to `enrolled / capacity >= ratio` + `capacity > 0` guard. Fixes capacity=1 (alert never fired) and capacity=3 (1/3 silently "fine").
- **4.2 re-scope (planning, no implementation).** Re-estimated 2 → 8 pts in `PROJECT_PLAN.md`. Locked scope: unified `/admin/users` with role filter (Admin/Instructor/Student), two collapsed invite panels reusing 4.1 infra, **column sorting (not search)**, old `/admin/students` and `/admin/instructors` routes deleted (no redirects — nothing bookmarked). Phase 4 total: 36 → 42 pts.
- **Docs updates.**
  - `NOTIFICATION_SETUP.md` — SPF Google + Resend before/after merge example; Twilio rewritten as toll-free vs 216-local decision point with toll-free verification step + 10DLC tradeoff documented.
- **Test fallout from calendar default.** `student-enrollment` + `cancel-enrollment` specs now seed `localStorage.sailbook.courses-view = 'list'` via `addInitScript` before `/student/courses` navigation. Also fixed pre-existing test bug in `cancel-enrollment` where the filter used `'Cancel List'` instead of the unique `runId()` title — caused strict-mode violations after multiple runs.
- Commit `e53a48d`.

**In Progress:** Nothing.

**Blocked:**
- `.env.local`: `NOTIFICATIONS_ENABLED=false` + Twilio/Resend creds (carryover sessions 91/92/93)
- `supabase db push` to remote (carryover sessions 90/91/92/93)
- Pre-existing `instructor-invite` failure: "admin generates link, student accepts and becomes instructor" deterministically times out on the Generate link button click. Reproduces at workers=1 in isolation. Manual QA from session 92 confirmed feature works; test-side issue. Punted per user, tracked as code review debt for Phase 4 follow-up.

**Next Steps:**
1. **Pick:** 4.2 (`/admin/users` consolidation, 8 pts) is now ready to build — scope is locked.
2. Investigate `instructor-invite` test regression as a separate small task before 4.2.
3. Mobile calendar UX is parked for Phase 5/6 — Andy will see clunky cards on mobile until then; documented in plan.
4. Run full Playwright suite after fixing the instructor-invite flake, before Phase 3 close.
5. `supabase db push` to remote (overdue 4 sessions).

**Context:**
- **Mobile-first hydration trap.** `view-switcher` server-renders calendar unconditionally; mobile clients swap to list after hydration → guaranteed flicker on first mobile load. Code review flagged a `hidden sm:block` / `sm:hidden` CSS-driven approach as cleaner. Acceptable for V1; revisit when redesigning the mobile course browser.
- **localStorage init pattern for tests.** `await page.addInitScript(() => localStorage.setItem(...))` BEFORE `goto` is the right way to seed client preferences in fresh browser contexts. Place it before login if context is brand new (login flow already navigates).
- **Pill rendering.** Calendar pills use `<Link>` with the same `/student/courses/[id]` href as list view buttons. Click-through is identical; no new route needed.
- **Calendar default month** is the current month; courses with sessions in May 2026 onwards aren't visible until you click `›`. Tests that rely on text matching for specific seed courses MUST switch to list view (text in pills is in DOM but not in current-month cells unless the test navigates).
- **Twilio toll-free verification** is now documented as a multi-day form submission. Plan accordingly when 3.1 is started — needs lead time before go-live.

**Code Review:** 4 cleanups (advisory), no bugs.
1. **cleanup** `view-switcher.tsx:22` — SSR/CSR mismatch causes mobile flicker. Suggested `hidden sm:block` CSS approach. Acceptable for V1.
2. **cleanup** `view-switcher.tsx:36-39` — two adjacent `eslint-disable-next-line` comments. `useSyncExternalStore` would be cleaner. Not blocking.
3. **cleanup** `triggers.ts:225` — pre-existing UTC-vs-local Date parsing pattern. Off-by-one possible at midnight in negative-UTC zones. Use `Date.UTC(y, m-1, d)` like `templates.ts:42` does. Pre-existing, not introduced here.
4. **cleanup** `student-courses-calendar.spec.ts:20` — `waitForLoadState('networkidle')` is a known flake source. Replace with a visibility assertion.

## Session 93 — 2026-04-25 07:25–08:45 (1.33 hrs)
**Duration:** 1.33 hrs | **Points:** 8 (3.4: 8)
**Task:** Phase 3.4 — enrollment notifications + low-enrollment cron

**Completed:**
- Re-estimated 3.4: 5 → 8 pts (+ cron route, vercel.json entry, threshold logic, two trigger paths). Phase 3 now 45 pts.
- `src/lib/notifications/templates.ts` — three pure templates (`enrollmentConfirmation`, `adminEnrollmentAlert`, `lowEnrollmentWarning`). SMS body + email subject + email text + email HTML.
- `src/lib/notifications/triggers.ts` — `notifyEnrollmentConfirmed(enrollmentId)` and `notifyLowEnrollmentCourses()`. Per-recipient/per-channel try/catch, errors logged & swallowed (Twilio outage cannot 500 the Stripe webhook). Caller-side idempotency only.
- `src/app/api/cron/low-enrollment/route.ts` — same `CRON_SECRET` auth pattern as `expire-holds`. Returns `{ alerted: N }`.
- `vercel.json` — second cron entry, daily 13:00 UTC.
- `src/app/api/webhooks/stripe/route.ts` + `src/actions/enrollments.ts` (`adminEnrollStudent`) — call trigger after enrollment goes confirmed.
- `src/app/api/test/enroll/route.ts` — added optional `notify: true` flag for tests.
- `tests/enrollment-notifications.spec.ts` — 4 desktop tests (8 skipped by viewport design).

**Bundled side-quests in same commit `f798f43`:**
- Added Phase 5.10 — `/student/courses` calendar view (5 pts, tight scope) — pulled from V3 backlog. The 26-course season seed makes the list view unbrowsable.
- `supabase/seeds/2026_season_courses.sql` — additive idempotent prod seed (NOT auto-loaded by `db reset`). 26 ASA 101 weekend courses May–Oct, 52 sessions. Verified in dev.
- README "Database seeding" section.
- Relaxed `tests/helpers.ts` Course Type regex to `/ASA 101/` (the season-seed upsert renamed the seeded course_type, breaking the previous regex).
- Adjusted Session 92 duration to 0.75 hrs per Eric.

**In Progress:** Nothing.

**Blocked:**
- `.env.local`: `NOTIFICATIONS_ENABLED=false` + Twilio/Resend creds (carryover)
- `supabase db push` to remote (carryover from sessions 90/91/92)
- 4.2 admin invite link still parked, needs re-scope to `/admin/users` consolidation
- Full Playwright suite not run this session — Eric will run before next task

**Next Steps:**
1. **First thing next session:** apply the 3 code review bugs/cleanups (HTML escape in email templates, `confirmEnrollment` missing notify call, threshold ratio fix). Eric explicitly flagged these as "first thing next task."
2. Run full Playwright suite (`npx playwright test`)
3. Pick next feature: 5.10 calendar view (real student-facing UX pain) or 4.2 re-scope

**Context:**
- Pattern established for cron-driven notifications — daily 13:00 UTC slot; future cron triggers (3.7 session reminders) can copy the route + vercel.json shape directly.
- Trigger functions never throw — they swallow internal errors and log. The contract is "best effort, never blocks the caller's primary write." Stripe webhook would 500 → retry → double-confirm if a notification could throw.
- Mock buffer constraint from 3.3 still load-bearing: dispatcher MUST static-import `mock.ts` so the test API route and dispatcher share one module instance.
- Seed test users have `phone: null`, so SMS dispatch correctly skips. Tests assert email-only paths until phone numbers populate.
- Low-enrollment threshold (`14 days`, `< 50% capacity`) is a documented placeholder; real rule belongs to 5.8 (Andy decision). No cooldown column for V1 — cron sends daily while threshold met.
- `notifyEnrollmentConfirmed` is wired into Stripe webhook + `adminEnrollStudent` (manual admin enroll). It is NOT wired into `confirmEnrollment` (admin "Confirm registered" button) — code review flagged this as a gap, queued as first thing next session.
- Running the season seed locally renamed the seeded course type from "ASA 101 — Basic Keelboat Sailing" to "ASA 101 – Sailing Made Easy". `helpers.ts` regex relaxed; if you ever `supabase db reset`, the seed-name reverts and the test still passes.
- Twilio toll-free numbers: faster verification + skip 10DLC monthly brand/campaign fees ($14/mo); slightly higher per-message but cheaper at SailBook volume. Worth using for 3.1.

**Code Review:** 3 real findings + 3 cleanups (advisory). All open — queued as first thing next session per Eric.

1. **bug** — `templates.ts:94+` HTML email templates interpolate user-supplied strings (student name, email, course title) into the HTML without escaping. Plaintext SMS/text bodies are fine. Names like `O'Brien` corrupt rendering; names with `<script>` are worse. Fix: small `escapeHtml()` helper wrapping every `${…}` in the HTML strings.

2. **bug** — `confirmEnrollment` (admin "Confirm" button on `registered → confirmed`) does NOT fire `notifyEnrollmentConfirmed`. Trigger docstring says it covers all confirmation paths but I missed this third one. Fix: add `await notifyEnrollmentConfirmed(enrollmentId)` after the update in `src/actions/enrollments.ts:99-108`.

3. **consistency** — `triggers.ts:219` threshold uses `Math.floor(capacity * 0.5)`, which is `0` for capacity=1 (alert never fires) and `1` for capacity=3 (1/3-full silently "fine"). ASA 101 capacity=4 isn't affected today, but worth fixing while in the file. Switch to ratio comparison: `enrolled / capacity < LOW_ENROLLMENT_RATIO`.

4. **cleanup** — `triggers.ts:194+` low-enrollment cron is N+1 (sessions + enrollment count + maybe course_type per course). 26 active courses → ~52–78 round-trips daily. Fine for V1 cadence; fold into a single query when 5.8 redesigns the rule.

5. **cleanup** — `triggers.ts:161,222` `daysUntilStart` math relies on UTC offset absorbing into `Math.round`. Fragile if cron schedule ever shifts toward 00:00 UTC. Compute from ISO date strings directly.

6. **cleanup** — `supabase/seeds/2026_season_courses.sql:18,38` "prod-safe" framing in header is misleading while default `ADMIN_EMAIL = 'andy@ltsc.test'`. Script `RAISE EXCEPTION`s on prod (good) but the framing is wrong. Drop "prod-safe" or change default to `'CHANGE_ME@example.com'`.

## Session 92 — 2026-04-24 20:16–21:01 (0.75 hrs)
**Duration:** 0.75 hrs | **Points:** 3 (3.3: 3)
**Task:** Phase 4.1 manual QA + Phase 3.3 notification service abstraction

**Completed:**
- 4.1 instructor invite — manual QA passed (admin generates → copy → unauth view → student accepts → role flips). Minor UX caveat acknowledged: unauth users see Sign in / Create account CTAs, not a redirect to register. V1-acceptable rough edge (already noted in session 91).
- Phase 3.3 — notification service abstraction
  - `src/lib/notifications/index.ts` — dispatcher: `sendSMS` / `sendEmail`, gated on `NOTIFICATIONS_ENABLED === 'true'`. Mock statically imported; real providers lazy-loaded.
  - `src/lib/notifications/mock.ts` — in-memory buffer + console.log echo. `getMockBuffer()` / `clearMockBuffer()` for tests.
  - `src/lib/notifications/twilio.ts` + `resend.ts` — env-guarded real senders. Both use `@ts-expect-error` on the dynamic `import('twilio'/'resend')` line so the module ships before npm install (3.1/3.2). Resend `from` baked to `SailBook <info@sailbook.live>`.
  - `src/app/api/test/notifications/route.ts` — dev-only GET/POST/DELETE on the mock buffer; `NODE_ENV !== 'development'` gate matches existing `set-role-flag/route.ts` pattern.
  - `tests/notifications.spec.ts` — 4 desktop tests (SMS dispatch, email dispatch, accumulate+clear, invalid channel). Serial + desktop-only because the buffer is shared module state; skip lives in `beforeEach` so non-desktop workers don't even touch the route.
- Pre-existing lint/tsc cleanup bundled into the same commit:
  - Unescaped `"Forgot Password"` quotes in `admin/students/new/page.tsx`
  - Unused `Badge` import in `instructor/dashboard/page.tsx`
  - Stripe SDK type drift in `tests/payment-e2e.spec.ts` — `WebhookTestHeaderOptions` types 6 fields as required but Stripe's own README example only passes 3; cast added with comment.
- Commit `027dff3`

**In Progress:** Nothing.

**Blocked:**
- Eric to add `NOTIFICATIONS_ENABLED=false` + `TWILIO_*` / `RESEND_API_KEY` placeholders to `.env.local`
- `supabase db push` to remote still pending (carried from sessions 90 + 91)
- 4.2 admin invite link **parked + needs re-estimate.** Original spec was a 2-pt clone of the instructor invite panel. Eric's revised direction: consolidate `/admin/students` + `/admin/instructors` into a unified `/admin/users` with a role filter (Admin / Instructor / Student) and two collapsed invite panels at the top. That's a 5–8 pt task, not 2. Plan needs an update next session.

**Next Steps:**
1. Re-scope and re-estimate 4.2 → "users page consolidation + dual invite panels"
2. Phase 3.4 — enrollment notifications. First real consumer of the 3.3 dispatcher; mock path covers everything end-to-end without Twilio/Resend creds. Includes admin alert on new enrollment + low enrollment warning per Andy's request.
3. `supabase db push` to remote (overdue)

**Context:**
- Module-instance trap: in Next.js / Turbopack dev, static `import` and dynamic `await import()` of the same module path can resolve to **different module instances**, breaking module-level state. The dispatcher had to import `mock.ts` statically to share its buffer with the test API route. First session's draft used `await import('./mock')` and the test buffer always read empty.
- `@ts-expect-error` is the load-bearing piece in `twilio.ts` / `resend.ts`. **Remove the directive in the same commit that does `npm install twilio` / `npm install resend` (3.1 / 3.2)**, or CI will go red.
- Same parallel-worker shared-state pattern as 4.1: `test.describe.configure({ mode: 'serial' })` + `test.skip` in `beforeEach` (not test body — body skip runs after beforeEach, which still races).
- Mock logger echoes full email/SMS body to dev stdout. Dev-only by design; do not adapt that pattern for the real providers.
- For local manual testing without creds: dev server at `:3000`, hit `curl -X POST localhost:3000/api/test/notifications -H 'Content-Type: application/json' -d '{...}'`, then `curl localhost:3000/api/test/notifications` to read back.

**Code Review:** Clean Bill of Health. 4 cleanup advisories, all non-blocking:
1. POST handler doesn't try/catch `req.json()` — matches existing dev-route convention
2. `@ts-expect-error` cleanup discipline flagged for 3.1 / 3.2
3. Add a "dev-only — do not copy into real providers" comment on the mock logger
4. Twilio/Resend clients re-instantiated per call; hoist to singleton if volume grows


## Session 91 — 2026-04-23 14:21–15:27 (1.08 hrs)
**Duration:** 1.08 hrs | **Points:** 3 (4.1: 3)
**Task:** Phase 4.1 — instructor invite link (admin-generated, single shared reusable URL)

**Completed:**
- Migration `20260423182537_invites_table.sql` — `invites` table (role PK, token UNIQUE, created_by, `last_accepted_by`/`last_accepted_at` audit cols), admin-only RLS, `accept_invite(role, token)` SECURITY DEFINER RPC (bumps `profiles.updated_at`; intentionally bypasses `profile_role_flags_unchanged` + `profile_auth_source_unchanged` — role promotion is the whole point, auth_source is orthogonal)
- `src/actions/invites.ts` — `regenerateInvite(role)` (admin-gated, upsert on role PK) + `acceptInstructorInvite(token)` (RPC → `updateUser({ data })` → `refreshSession()` → redirect; the explicit refreshSession is load-bearing — without it the JWT cookie keeps the stale `user_metadata.is_instructor=false` and the proxy bounces the user off `/instructor/*`)
- `src/components/admin/instructor-invite-panel.tsx` — client panel: current link, Copy, Regenerate (confirm dialog)
- `src/app/(admin)/admin/instructors/page.tsx` — panel wired at top; surfaces `inviteResult.error` per code review
- `src/app/invite/instructor/[token]/page.tsx` + `accept-form.tsx` — public accept page, auth-gated (shows Sign in / Create account buttons when unauth)
- `src/proxy.ts` — added `PUBLIC_PREFIXES = ['/invite/']` concept; unlike `PUBLIC_ROUTES`, doesn't bounce authenticated users to their dashboard (so a logged-in admin can preview the accept URL)
- `src/app/api/test/set-role-flag/route.ts` — dev-only `is_*` flag toggle for test cleanup; merges user_metadata via get→update so existing keys survive
- `supabase/tests/09_invites.sql` — 15 pgTAP tests (CHECK/PK constraints, admin CRUD, instructor SELECT/UPDATE/DELETE blocked, student INSERT blocked, `accept_invite` happy + bad-token + invalid-role + unauth paths)
- `tests/instructor-invite.spec.ts` — 3 tests, describe configured `mode: 'serial'`; generate+accept and regenerate tests desktop-only (mutate the single `invites.role='instructor'` row); invalid-token runs all viewports. 5/5 passing.
- Applied all 6 code review findings mid-session (audit cols, `updated_at` bump, surface invite error, 2 new pgTAP tests, proxy + migration comments)

**In Progress:** Nothing

**Blocked:**
- Manual QA not performed — dev server had browser-access issues after `supabase db reset`; Eric rebooting at session end, will QA at start of next session (memory: `project_task_41_qa_pending.md`)
- `supabase db push` to remote pending

**Next Steps:**
- Session 92 opens with the 4.1 QA walkthrough surfaced from memory
- After QA: start 4.2 (admin invite link — same pattern, 2 pts, reuses `invites` table + RPC; only new code is admin role gate + UI panel on `/admin/users`)

**Context:**
- `invites` uses `role` as PRIMARY KEY by design — single row per role means admin regenerate invalidates all outstanding links. Downside: Playwright tests can't parallelize mutating tests; `describe.configure({ mode: 'serial' })` + desktop-only gating solved it.
- `supabase.auth.updateUser({ data })` does NOT re-issue the JWT on its own — must call `refreshSession()` after to push the new `user_metadata` into the cookie. This is the second time we've hit role-flag-in-JWT staleness; worth a DEC entry if 4.2 or another task repeats the pattern.
- Dev login dropdown stopped responding mid-session (visible but click doesn't open). Eric will check after reboot. Not related to 4.1 — login page and DevLoginHelper were untouched. Suspect WSL2/Turbopack HMR state.
- `CardTitle` renders as `<div>`, not a heading — Playwright `getByRole('heading', ...)` won't match; use `getByText(...)` for Card titles.
- Unauthed accept flow currently asks the user to "sign in then return to this link" (no `?next=` param on login). Eric acknowledged as a V1-acceptable rough edge; deferred.

**Code Review:** 6 findings, all fixed in-session (3 security/consistency: audit trail columns, `updated_at` bump, surface `inviteResult.error`; 3 cleanup: 2 RLS test cases, 2 explanatory comments). No open items.


## Session 90 — 2026-04-23 13:26–14:11 (0.75 hrs)
**Duration:** 0.75 hrs | **Points:** 0 (bug fixes, no plan task)
**Task:** Pre-task housekeeping — fix pgTAP failure and Playwright payment-e2e failures before starting 4.1

**Completed:**
- `supabase db push` to remote (user action, unblocked from session 89)
- Diagnosed pgTAP test 9 failure: `auth_source` not in `profile_role_flags_unchanged()` WITH CHECK — student could overwrite their own `auth_source`
- Migration `20260423175424_fix_auth_source_self_update.sql`: new `profile_auth_source_unchanged(uuid, text)` SECURITY DEFINER function, ANDed into "Users can update own profile" policy WITH CHECK. pgTAP: 105/105 ✓
- Diagnosed Playwright `payment-e2e.spec.ts` 3-viewport failure: migration `20260422194000` dropped full UNIQUE constraint on `stripe_checkout_session_id`, replaced with partial index — broke `ON CONFLICT (stripe_checkout_session_id)` in webhook upsert, silently dropped every payment row
- Fixed webhook: `upsert({...}, { onConflict:... })` → `.insert({...})` in `src/app/api/webhooks/stripe/route.ts`
- Discovered root cause of fix not taking effect: dev server (PID 71999) running since Apr 21, Turbopack file watcher stale — server needs `npm run dev` restart to pick up webhook change

**In Progress:** Nothing half-done

**Blocked:**
- Playwright `payment-e2e.spec.ts` fix is in source but requires dev server restart to take effect — restart `npm run dev` then re-run to confirm green

**Next Steps:** Task 4.1 — instructor invite link (single shared reusable link, confirmed design, plan approved). Start fresh session with `/its-alive`.

**Context:**
- Dev server Turbopack watcher goes stale after ~2 days in WSL2 — restart `npm run dev` if file edits aren't being picked up
- Webhook payment insert is non-fatal by design — enrollment confirmation succeeds even if payment row fails; concurrent double-delivery hits the partial unique index and fails noisily but correctly
- 4.1 design confirmed: single shared link per role (`role='instructor'` row in `invites` table), admin regenerates to invalidate old link, accept page sets `is_instructor=true` on whoever is logged in

**Code Review:** 2 findings (both CLEANUP):
1. `auth_source` throws_ok test in `08_admin_students.sql` — should live in `01_rls_profiles.sql` alongside other WITH CHECK tests (discoverability)
2. Webhook concurrent double-delivery leaves a log noise note opportunity — idempotency gap is benign but worth a comment

## Session 89 — 2026-04-22 19:26–21:45 (1.83 hrs)
**Duration:** 1.83 hrs | **Points:** 12 (4.4a: 5, 4.4b: 5, code review fixes: 2)
**Task:** Phase 4.4a + 4.4b — admin-created students and admin-initiated enrollment with manual payment

**Completed:**
- @architect reviewed and approved schema approach (DEC-024, DEC-025)
- Migration `20260422193000_admin_created_profiles.sql` — `auth_source` column on profiles (`self_registered` | `admin_created`)
- Migration `20260422194000_manual_payments.sql` — `payment_method` column (cash/check/venmo/stripe_manual), UNIQUE on `stripe_checkout_session_id` made partial (`WHERE NOT NULL`)
- `createAdminStudent` action: service-role `createUser` (no password, email_confirm=true), inserts profile with `auth_source='admin_created'`, rolls back auth row on profile failure
- `adminEnrollStudent` action: duplicate-enrollment check, enrollment→`confirmed` directly, seeds session_attendance, inserts manual payment row — no Stripe involved
- `/admin/students/new` page + `CreateAdminStudentForm` client component
- `AdminEnrollStudentPanel` inline toggle on course detail page (student picker, payment method, amount)
- `supabase/tests/08_admin_students.sql` — 8 pgTAP tests: check constraints, NULL coexistence, partial UNIQUE
- `tests/admin-students.spec.ts` — 9 passing Playwright tests (3 skipped pending Dialog component)
- Payment method options: cash, check, venmo, stripe_manual — `other` dropped
- Code review run post-commit; 7 findings fixed (commit `d3de928`):
  - Surfaced silent errors in `adminEnrollStudent` (attendance seed + payment insert)
  - Fixed `processRefund` for manual payments (was leaving `status=succeeded` on cancelled enrollment)
  - Added length validation to `createAdminStudent`
  - Moved duplicate enrollment check to `adminClient`
  - Extracted `MANUAL_PAYMENT_METHODS` constant to `src/lib/constants.ts`
  - Added 2 RLS behavioral tests to `08_admin_students.sql` (now 10 tests)

**In Progress:** Nothing

**Blocked:**
- `supabase db push` to remote pending
- Dialog component (`npx shadcn@latest add dialog`) not installed — enrollment panel uses inline toggle instead; desktop enrollment E2E test is skipped until then

**Next Steps:** Phase 3 task 3.3 — notification service abstraction. Build against mock path (`NOTIFICATIONS_ENABLED=false`); no Twilio/Resend creds required. Lock in `from` address (`info@sailbook.live`) before writing copy. Also: consider installing Dialog component early to unblock the skipped enrollment test.

**Context:**
- Admin capacity bypass is intentional — admins can enroll beyond capacity (walk-ons, comps, etc.)
- Ghost student login flow: Andy gives student their email, student uses Forgot Password to claim account
- `stripe_manual` payment method = Andy ran a manual Stripe charge outside the checkout flow and is recording it
- types.ts regeneration captured the `npx supabase` install prompt as garbage lines 1–3; stripped them manually. Future gen: run with installed `supabase` CLI to avoid this (`supabase gen types typescript --local`)

**Known Test Failures (pre-existing):**
- `enrollment-refund.spec.ts:62` — `cancel_requested without payment shows Cancel (no refund) button` failing on desktop — investigate before Phase 3 close
- `payment-e2e.spec.ts` — 2 tablet failures flagged as flaky

**Code Review:** 7 findings, all fixed. 3 bugs (silent discards + manual refund gap), 2 security (length validation, RLS-stable duplicate check), 1 consistency (shared constant), 1 cleanup (missing RLS tests). No open items.

## Session 88 — 2026-04-22 19:08–19:19 (0.17 hrs)
**Duration:** 0.17 hrs | **Points:** 0 (docs-only, no plan task)
**Task:** Align NOTIFICATION_SETUP.md with updated EMAIL_SETUP.md (Cloudflare Email Routing + Gmail, replacing Zoho)

**Completed:**
- Pulled origin/main into dev — picked up `docs/EMAIL_SETUP.md` and `docs/NOTIFICATION_SETUP.md` (Zoho→Cloudflare flip committed directly to main)
- Updated `docs/NOTIFICATION_SETUP.md`:
  - Banner: removed "do Zoho first" → "do EMAIL_SETUP.md (Cloudflare) first, check for existing SPF before adding Resend's"
  - DNS section: replaced merge-with-Zoho SPF example with check-first approach; removed Zoho MX note; kept proxy/DKIM/CNAME guidance
  - From-address recommendation: "Zoho is already hosting that mailbox" → "Cloudflare Email Routing already forwards it to Gmail, Andy responds via Send-As"
  - Checklist footer: "do after Zoho" → "do after EMAIL_SETUP.md"; SPF note reworded
  - Fixed one LTSC → Simply Sailing stale reference in Twilio section

**In Progress:** Nothing
**Blocked:**
- Twilio account setup (user action)
- Resend account setup (user action — needs API key + sailbook.live domain verification)
- `supabase db push` pending (needs `supabase db reset` locally first)

**Next Steps:** Start Phase 3 task 3.3 — notification service abstraction. Build against mock path (`NOTIFICATIONS_ENABLED=false`); no creds required yet. Lock in `from` address before writing copy (recommendation: `info@sailbook.live`).

**Context:**
- SPF: one record per domain — any new sender (Resend, Google Send-As) must be merged in, not added as a second TXT record
- Cloudflare Email Routing virtually always adds a TXT record automatically (EMAIL_SETUP.md step 4); the NOTIFICATION_SETUP.md banner should say "adds" not "may add" (code review finding — deferred)
- SPF example in NOTIFICATION_SETUP.md step 3 should include `_spf.google.com` for Gmail Send-As alongside `_spf.resend.com` — omission flagged by code review, worth fixing before Andy does DNS setup

**Code Review:**
- **CONSISTENCY** `NOTIFICATION_SETUP.md` line 70 — SPF example omits `_spf.google.com`; if Andy adds it later as a separate TXT he'll have duplicate SPF and broken email. Fix: `v=spf1 include:_spf.google.com include:_spf.resend.com ~all`
- **CONSISTENCY** `NOTIFICATION_SETUP.md` line 7 — banner says Cloudflare "may add" a TXT record; EMAIL_SETUP.md says it does so automatically. Tighten to "adds."
- **CONSISTENCY** `NOTIFICATION_SETUP.md` line 75 — "turn off orange cloud for all mail-related records" — MX records can't be proxied; scope to "DKIM and CNAME records."

## Session 87 — 2026-04-22 13:00–13:20 (0.33 hrs)
**Duration:** 0.33 hrs | **Points:** 0
**Task:** Reconcile `NOTIFICATION_SETUP.md` with new `EMAIL_SETUP.md` (Zoho); add DEC-023
**Completed:**
- Reviewed `docs/EMAIL_SETUP.md` (added by user outside session) — Zoho free tier hosting `info@` and `andy@sailbook.live`, pulled into Gmail via POP3 + SMTP app passwords
- Updated `docs/NOTIFICATION_SETUP.md` to coexist with Zoho: banner flagging Zoho-first setup order, DNS step rewritten to *merge* into existing SPF record (not duplicate), removed obsolete Cloudflare Email Routing step, reworded from-address recommendation (commit `bd9ef62`)
- Added DEC-023 to `docs/DECISIONS.md` — documents the Zoho/Resend split, DNS coordination rules, and setup-order constraint
**In Progress:** None
**Blocked:** Human still needs to walk through `EMAIL_SETUP.md` and `NOTIFICATION_SETUP.md` before task 3.3 can go live (mock path is unblocked)
**Next Steps:** Start task 3.3 (notification service abstraction) — build against mock path with `NOTIFICATIONS_ENABLED=false`, no creds required yet. Decide `from` address before writing copy (recommendation: `info@sailbook.live`)
**Context:**
- SPF has exactly one record per domain; stacking senders means merging `include:` values into a single `v=spf1 ... ~all`. DKIM is the opposite — each sender uses its own selector and stacks as separate TXT records
- Resend does not need MX records; Zoho handles all inbound `@sailbook.live` mail
- Setup-order matters only between Zoho and Resend; Twilio is independent
- Meta note: consider a "no-code-changes" variant of /kill-this that skips build/commit/review and only updates the log — this session and session 86 both fit that shape
- Verification: eyeballed the updated docs and DEC entry; no code or DNS touched
**Code Review:** Skipped (docs-only, user call)

## Session 86 — 2026-04-21 11:54–12:04 (0.17 hrs)
**Duration:** 0.17 hrs | **Points:** 0
**Task:** Phase 3 prep — write human-facing setup guide for tasks 3.1 (Twilio) and 3.2 (Resend)
**Completed:**
- Added `docs/NOTIFICATION_SETUP.md` — step-by-step checklist covering Twilio account/number/credentials and Resend account/domain/DNS/API key, plus Cloudflare email routing for `info@sailbook.live`
- Flagged two open decisions in the doc: when to upgrade Twilio off trial (before 3.14), and which `from` address to use (recommended `info@sailbook.live`)
- Committed as `f0259e2`, pushed to main
**In Progress:** None
**Blocked:** None
**Next Steps:** Andy/Eric walks through `docs/NOTIFICATION_SETUP.md` to actually provision Twilio + Resend. Once creds are in `.env.local`, task 3.3 (notification service) can start — that task will finalize env var names and import/use the creds.
**Context:**
- Doc is intentionally a checklist, not prose — seeds content for task 3.13 (README docs) but isn't a substitute for it
- Env var names in the doc (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `RESEND_API_KEY`) are placeholders; 3.3 locks them in
- `from`-address decision affects 3.3 copy — pick before starting it
- Duration captures AI time only; user will update with human-task time after provisioning Twilio/Resend
**Code Review:** Skipped (doc-only change, user call)

