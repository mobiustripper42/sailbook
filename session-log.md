# SailBook — Session Log

Session summaries for continuity across work sessions.
Format: prepend newest entry at the top.

## Session 122 — 2026-05-02 12:55 [open]

## Session 121 — 2026-05-02 03:45–11:07 (1.33 hrs, 6 hrs overnight subtracted)
**Duration:** 1.33 hrs | **Points:** 0 (test debt — unscoped, no plan task)
**Task:** Test fixes — full Playwright suite green after 6.13 + 5.7

**Completed:**
- **Triaged 83-failure full suite** down to **0 failed / 444 passed**. PR #13, merged.
  - Root cause: 6.13 swapped `<input type="time">` for shadcn Select dropdowns inside a `TimeSelect` wrapper; 14 test call-sites still targeted the old selector, hanging `.fill()` for 30s and timing out beforeAll hooks across the suite.
  - New `selectTime(page, name, 'HH:MM')` helper in `tests/helpers.ts` — locates the TimeSelect's hidden input by name, walks up to the wrapper, drives the two combobox triggers.
  - 14 stale call-sites replaced across `tests/{helpers,instructor-views,open-sailing,admin-course-crud,dashboard-instructor-count,student-enrollment,instructor-cascade}.spec.ts`. Course-form uses `session_start_${index}`/`session_end_${index}`; standalone forms use `start_time`/`end_time`.
  - `tests/admin-course-crud.spec.ts:15` fills the now-required Public URL Slug field added in 6.19.
  - 3 "Course Full" assertions updated to "Join waitlist" — UX changed in 5.7. Sites: `student-enrollment:125`, `checkout:44`, `enrollment-hold:76`.
  - `tests/time-select.spec.ts` skips on mobile — both tests assert on `hidden md:table-cell` columns. Tests were validated desktop-only in s120 but never gated.

**In Progress:** Nothing.

**Blocked:** Twilio Toll-Free Verification pending (carryover from s102).

**Next Steps:**
1. Per code review: add a click-through assertion in `checkout.spec.ts` that "Join waitlist" actually navigates to the waitlist flow (not checkout) — closes the gap left by trading `toBeDisabled()` for a presence check. Defensive `expect(buttons).toHaveCount(2)` in `selectTime` also worth folding in.
2. Pick next Phase 6 task — strongest candidates remain **6.24** (course detail mobile rewrite, 5 pts) or **6.14** (consolidate profile edits, 2 pts).

**Context:**
- **`tests/makeup-assignment-notice.spec.ts:18` flake confirmed**: failed in the parallel suite, passed 3/3 in isolation. Documented Turbopack mock-buffer race from s119 — server-action notification triggers don't bridge into the API-route module graph under contention. Not a real bug; safe to retry on transient failure.
- **The full Playwright suite must be run after any UI form change** — targeted spec runs miss cross-cutting selector regressions like 6.13. Time-picker passed in s120 because only `time-select.spec.ts` was run; the full suite would have caught the 75-test cascade immediately.
- TimeSelect hidden-input names: `start_time`/`end_time` for `add-session-form` and inline `session-row`; `session_start_${index}`/`session_end_${index}` for the multi-session `course-form`.
- 7.33 hr wall clock minus 6 hrs overnight = 1.33 hrs hands-on. Background Playwright runs (~35 min total) ran while away.
- PR #13: https://github.com/mobiustripper42/sailbook/pull/13

**Code Review:** Two non-blocking findings carried forward in PR body: (1) waitlist assertions traded a behavioral guarantee for a presence check, (2) `selectTime` walk-up via `.locator('..')` is fragile to wrapper changes — count assertion would fail loudly. Plus optional polish on hour-range validation and a mobile-only TimeSelect render check.

## Session 120 — 2026-05-02 02:23–03:39 (1.25 hrs)
**Duration:** 1.25 hrs | **Points:** 3 (6.13)
**Task:** 6.13 — Date/time picker redesign

**Completed:**
- **6.13 — Time picker redesign** (3 pts). PR #12.
  - New `src/components/admin/time-select.tsx` — two shadcn Select dropdowns (hour in 12h AM/PM, minute in 15-min intervals). `flex-1 min-w-0` on hour trigger + `w-[72px] shrink-0` on minute lets it squeeze into any column width. Hidden input emits snapped `HH:MM` for form submission.
  - Wired into all four session forms: `add-session-form.tsx`, `makeup-session-form.tsx`, `course-form.tsx`, `session-row.tsx`. Forms switched to `grid-cols-2 sm:grid-cols-3` with Date `col-span-2 sm:col-span-1` (Date full-width on mobile, Start/End side-by-side below).
  - `session-row.tsx` gains controlled `editStartTime`/`editEndTime` state (was uncontrolled `defaultValue`).
  - `course-form.tsx` duplicate hidden inputs for start/end removed — `TimeSelect` owns those names directly.
  - Sessions table wrapped in `overflow-x-auto` on `(admin)/admin/courses/[id]/page.tsx` so it scrolls horizontally inside the card instead of cutting off the page.
  - 2 desktop Playwright tests green.
- **CR fixes same session**: moved component from `components/ui/` to `components/admin/`; hidden input emits snapped value (no display/submit desync); removed `required` prop (browser-ignored on hidden inputs); guarded empty value → NaN; removed redundant `useState` init.
- **6.24 added to plan** — course detail page mobile rewrite. Triggered by 6.13 work: below 1024px the page has multiple structural problems (header squish, table forces overflow, inline edit row cramped) that need a mobile-first redesign, not retrofit. Deferred from this branch.

**In Progress:** Nothing.

**Blocked:** Twilio Toll-Free Verification pending (carryover from s102).

**Next Steps:**
1. Merge PR #12 (Eric is doing this).
2. Pick next Phase 6 task. Strongest candidates: **6.24** (course detail mobile rewrite, 5 pts, medium — natural follow-on to today) or **6.14** (consolidate profile edit screens, 2 pts, medium).
3. Phase 5 close (5.9) still waiting — only open Phase 5 task.

**Context:**
- Iterated three times on the time-picker breakpoint strategy before settling on "always use the dropdowns." Tried `sm` switch to native, `lg` switch to native, `md` switch to native — none worked because viewport width can't tell desktop browser at 375px from a real phone, and the desktop `<input type="time">` UI is what we were trying to escape. The dropdowns shrink fine via `min-w-0`; native fallback was a wrong axis.
- Course detail page header (`flex justify-between` with title + 4 action buttons) is pre-existing and squishes the title at narrow widths. Not touched in this session — folded into 6.24.
- Test flake pattern: accumulated DB rows from earlier test runs cause strict-mode violations on `getByText('8:30am – 4:00pm')`. Fix is `.first()` or assert on a unique field (e.g., `Dock ${runId()}`).
- Test flake pattern 2: clicking "first ASA 101" in `/admin/courses` can land on a course whose first session is cancelled (no Edit option in dropdown). Use `getByRole('row').filter({ has: getByRole('cell', { name: 'scheduled' }) })` to find an editable row instead.
- PR #12: https://github.com/mobiustripper42/sailbook/pull/12

**Code Review:** All CR findings fixed same session (component placement, hidden-input sync, required prop, NaN guard, redundant state init). One advisory item deferred (course-form session_date hidden input, pre-existing).

## Session 119 — 2026-05-01 21:53–2026-05-02 02:03 (4.17 hrs)
**Duration:** 4.17 hrs | **Points:** 8 (5.7)
**Task:** 5.7 — Waitlist (full course → join → notify on opening)

**Completed:**
- **5.7 — Waitlist** (8 pts). PR #10, merged.
  - Migration `20260501220908_waitlist_entries.sql`: `waitlist_entries` table with RLS (admin all; student SELECT/INSERT/DELETE own; instructor blocked), UNIQUE (course_id, student_id), `(course_id, created_at)` FIFO index, `get_waitlist_position(p_course_id)` SECURITY DEFINER RPC.
  - `src/actions/waitlist.ts` — `joinWaitlist` (full + not-already-enrolled checks), `leaveWaitlist`.
  - `notifyWaitlistSpotOpened` trigger in `src/lib/notifications/triggers.ts` (notify-all, stamps `notified_at`); `waitlistSpotOpened` template.
  - Wiring: `cancelEnrollment` fires the trigger with a **prior-status guard** (only `confirmed` or `cancel_requested` → `cancelled` blasts the waitlist; no-op cancels stay silent). `confirmEnrollment`, `adminEnrollStudent`, and Stripe webhook auto-delete the waitlist row.
  - Student UI: `WaitlistButton` integrated in `(student)/student/courses/[id]/page.tsx`. Cleaned up unused `disabled`/`disabledReason` props on `EnrollButton`. List-view "Course Full" disabled button replaced with clickable "Join waitlist" outline link to the detail page (`courses-card-list.tsx`).
  - Admin UI: `AdminWaitlistCard` embedded under Enrollments on `(admin)/admin/courses/[id]/page.tsx`.
  - 14 pgTAP tests (160 total green); 4 Playwright tests across the lifecycle.
- **CR fixes mid-session**:
  - `cb52b86` — initial implementation.
  - `c2f7132` — `cancelEnrollment` prior-status guard (CR).
  - `f2a476b` — list-view "Course Full" → "Join waitlist" link.
- **Worktree env bootstrap** (one-time): `npm install`, copied `.env.local` from main worktree, copied `npx supabase *` permission allow into `.claude/settings.local.json` (the worktree settings only had MCP enables — that's why `supabase db reset` was blocked).

**In Progress:** Nothing.

**Blocked:** Twilio Toll-Free Verification pending (carryover from s102).

**Next Steps:**
1. `supabase db push` to apply waitlist migration to prod.
2. Pick up **6.22** (form field preservation, 5 pts) or **6.23** (?next= preservation, 2 pts). Both still open from session 117.
3. Phase 5 ejection: only **5.9** (end-of-phase close) remains in Phase 5 — schedule when you're ready to retro.

**Context:**
- Notify-all (race-to-enroll) was a deliberate scope choice over FIFO+timer. Admin "Last notified" column is informational, not a queue cursor.
- Mock notification buffer doesn't bridge server-action ↔ API-route module graphs in Turbopack dev. `enrollment-notifications.spec.ts` works because its trigger fires from an API route. Future server-action-driven notification tests should assert via DB observable state (this spec uses the admin "Last notified" cell), not the `/api/test/notifications` GET.
- Per-worktree gotchas now documented: `.env.local`, `node_modules`, and the `npx supabase *` allow do NOT propagate from the main checkout. Permanent fix is to move that allow rule from `settings.local.json` to the committed `settings.json`. Filed mentally as a /sync-config candidate.
- Two dev servers can squat on different ports if one is left over from a previous failed start (next will fall back to 3001 silently). When in doubt: `pkill -f "next-server"` then verify with `ss -tlnp | grep 300`.
- PR #10: https://github.com/mobiustripper42/sailbook/pull/10

**Code Review:** 1 bug fixed mid-session (cancelEnrollment guard); 2 cleanup, 2 advisory deferred per PR notes. Plus 1 user-spotted UX bug (full-course CTA on list view) fixed mid-session.

## Session 118 — 2026-05-01 16:57–21:31 (4.6 hrs)
**Duration:** 4.6 hrs | **Points:** 7 (6.23 = 2, 6.22 = 5)
**Task:** 6.23 — ?next= forwarding through auth links; 6.22 — form field preservation on server action error
**Completed:**
- 6.23: login "Register" link + register "Sign in" link forward `?next=`; open-redirect blocked via `safeNextPath`; 4 Playwright tests (`tests/next-param-registration.spec.ts`) — PR #9
- 6.22: converted all admin + student + auth edit forms from uncontrolled to controlled inputs (12 components total); switched register-form from `useActionState` action binding to `onSubmit` + `e.preventDefault()` to prevent React 19 from calling `form.reset()` on native `<select>`; 2 Playwright tests (`tests/form-field-preservation.spec.ts`) — PR #8
- Applied CR findings on both branches before opening PRs
**In Progress:** nothing
**Blocked:** nothing
**Next Steps:** Pick next Phase 6 task. 5.7 (waitlist, 8 pts, high priority) or 6.13 (time picker redesign, 3 pts, "almost unusable") are the strongest candidates.
**Context:**
- React 19 calls `form.reset()` after every form action invocation (success or error). `defaultValue`/`defaultChecked` = permanent reset on error. For native `<select>`, even controlled `value` prop doesn't fully survive `form.reset()` — must use `onSubmit` + `e.preventDefault()` to stop it.
- `session-row.tsx` excluded (uses `onSubmit` + `preventDefault` already). `course-form` capacity excluded (`key={selectedTypeId}` is an intentional reset).
- shadcn Select: must call `setIsDirty(true)` explicitly inside `onValueChange` — native change event doesn't bubble to the parent form's `onChange`.
- Playwright: assert link hrefs via `toHaveAttribute` (polls through Suspense hydration); clicking and checking `page.url()` runs synchronously and misses Next.js client-side nav.
- Merge order fumble: #9 (6.23) merged before #8 (6.22); #8 clobbered the ?next= Register link in login/page.tsx. Needed `git checkout main && git pull` to see the corrected state.
- PR test plans must be step-by-step scenarios (URL → action → what to verify), not just outcome checklists. Already in CLAUDE.md and /kill-this skill — compliance failure, not a missing rule.
**Code Review:** CR findings applied on both branches (encodeURIComponent inconsistency on 6.23; missed add-session-form date/location + both notification pref forms + auth form passwords on 6.22).

## Session 117 — 2026-05-01 16:21–16:41 (0.33 hrs)
**Duration:** 0.33 hrs | **Points:** 7 (6.21 = 2, 6.20 = 5)
**Task:** 6.21 sticky sidebar + 6.20 admin/instructor calendar views

**Completed:**
- **6.19 CR fixes** (no pts). `src/app/(public)/courses/[slug]/page.tsx`:
  sort `futureSessions` before `[0]`/`[last]`; drop unused `member_price`/`capacity`.
- **6.21 — Sticky sidebar** (2 pts). `sticky top-0 h-screen overflow-y-auto` on
  `aside` in all three role layouts (`(admin)`, `(instructor)`, `(student)`).
- **6.20 — Admin + instructor calendar views** (5 pts). PR #7, merged.
  - `src/components/shared/sessions-calendar.tsx` — month-grid calendar, `SessionEvent` type.
  - `src/components/shared/sessions-list.tsx` — list fallback (forced on mobile <640px).
  - `src/components/shared/sessions-view-switcher.tsx` — calendar/list toggle, `sailbook.sessions-view` key (shared admin + instructor by design).
  - `src/components/admin/admin-calendar-view.tsx` — shadcn Select filters for Course Type + Instructor.
  - `src/app/(admin)/admin/calendar/page.tsx` — is_admin guard, error check, `RawCourse`/`RawSessionRow` types.
  - `src/app/(instructor)/instructor/calendar/page.tsx` — is_instructor guard, error checks, DEC-007 two-query merge (course-default sessions + session-level overrides, deduplicated).
  - Calendar link in all 4 nav files (admin + instructor, desktop + mobile).
  - 6 Playwright tests green. All code review findings fixed before end of session.

**In Progress:** Nothing.

**Blocked:** Twilio Toll-Free Verification pending (carryover from s102).

**Next Steps:**
1. Next task: **6.23** (preserve `?next=` through registration, 2 pts)
   or **6.22** (form field preservation on server action error, 5 pts).

**Context:**
- Instructor calendar uses two queries + Set dedup for DEC-007 — don't collapse into one.
- Shared `sailbook.sessions-view` storage key is intentional — admin + instructor share the calendar/list preference.

**Code Review:** Clean — all findings fixed before end of session.

## Session 116 — 2026-05-01 13:05–15:55 (2.85 hrs)
**Duration:** 2.85 hrs | **Points:** 5 (6.19)
**Task:** 6.19 — Public course browse pages for LTSC inbound links

**Completed:**
- **6.19 — Public course browse** (5 pts). PR #6, merged.
  - Migration: `slug TEXT UNIQUE NOT NULL` on `course_types`, backfilled from
    `short_code` lowercase (`ASA101` → `asa101`). Anon SELECT policies on
    `course_types` (active), `courses` (active), `sessions` (active courses only).
  - `src/app/(public)/layout.tsx` — minimal header (logo + Log in / Create account).
  - `src/app/(public)/courses/[slug]/page.tsx` — unauthenticated course type page.
    Lists upcoming sections with date range, time, location, price, "Enroll →"
    button → `/login?next=/student/courses/[id]`.
  - `src/app/dev/ltsc/page.tsx` — mock LTSC product-category page (dev/preview only).
    Shows all active course types with "Select options" buttons → SailBook public pages.
  - `src/proxy.ts` — `/courses/` and `/dev/` added to `PUBLIC_PREFIXES`.
  - `src/components/admin/course-type-form.tsx` + `src/actions/course-types.ts` —
    slug field added; auto-sanitized on save.
  - pgTAP: 3 new anon SELECT tests (146 total, all green).
  - Playwright: 7 new tests (LTSC mock, public page, 404, enroll link, E2E
    inbound flow — all green). Verified via live run.
- **Session log + plan recovered** from merge collision: sessions 115/116 entries
  added, tasks 6.21/6.22 restored to PROJECT_PLAN.md, 6.19 marked done.
- **Task 6.23 added** — preserve `?next=` through registration (medium, 2 pts).
- **s115 test fixes bundled** into same commit: open-sailing slug uniqueness,
  student-enrollment `addInitScript` order, unsaved-changes mobile skip,
  session-row `grid-cols-1 sm:grid-cols-3`.

**In Progress:** Nothing.

**Blocked:** Twilio Toll-Free Verification pending (carryover from s102).

**Next Steps:**
1. Fix CR bug: `futureSessions` in `src/app/(public)/courses/[slug]/page.tsx:58`
   needs `.sort((a,b) => a.date.localeCompare(b.date))` before `[0]`/`[last]`
   date-range display and card sort order.
2. `supabase db push` — apply slug migration to prod.
3. Next task: **6.20** (admin/instructor calendar, 5 pts) or **6.21** (sticky
   sidebar, 2 pts, fast win). Both high priority, deadline May 4.

**Context:**
- LTSC links to use: `https://sailbook.live/courses/asa101`, `/asa103`, `/dinghy`,
  `/open`. Admin can edit slugs via Course Types → Edit.
- `/dev/ltsc` is accessible on Vercel preview deployments (low-severity — harmless
  mock, but visible to anyone with the preview URL).
- `futureSessions` sort bug: cards currently sort correctly only if Supabase returns
  sessions in date order (usually true, not guaranteed).

**Code Review:** 1 bug, 2 cleanup, 3 consistency/advisory.
- **(bug)** `public/courses/[slug]/page.tsx:58` — `futureSessions` array not sorted
  before `[0]`/`[last]` used for date range + card sort. Fix next session.
- **(cleanup)** Same file: `member_price` + `capacity` selected but never rendered.
- **(cleanup)** Same file: inline type cast on sessions array — use `Tables<'sessions'>`.
- **(consistency)** `generateMetadata` issues a second DB round-trip for the same row.
- **(consistency)** `/dev` in `PUBLIC_ROUTES` + carved-out exception at line 60 is subtle.
- **(advisory)** `/dev/ltsc` visible on Vercel preview URLs — low severity, harmless.

## Session 115 — 2026-05-01 13:11–13:XX [abandoned]
**Duration:** ~TBD | **Points:** unplanned bug fixes (0 pts)
**Task:** Test suite failures — diagnose and fix 8 failures from full Playwright run

**Completed:**
- **open-sailing.spec.ts:68 (all viewports)** — Session 114 added a required, unique
  `slug` field to the course-type form. Test didn't fill it (browser validation blocked
  submit). Also used fixed `DROPTEST` short_code which collides on re-runs due to UNIQUE
  constraint. Fix: use `runId()` for both short_code and slug.

- **student-enrollment.spec.ts:16 (mobile/tablet)** — `addInitScript` was registered
  after `loginAs`'s first navigation (`page.goto('/login')`), so it wasn't guaranteed to
  fire on `/student/courses`. Fix: move `addInitScript` before `loginAs` in `beforeEach`.

- **unsaved-changes.spec.ts:72/89/106 (mobile)** — The shadcn `<Table>` wraps in
  `overflow-x-auto`, making it a scroll container. Playwright's scroll-into-view for the
  Cancel button repositions the thead to the same viewport y-coordinate, causing a false
  pointer-events intercept. The inline edit form is a desktop-first table UI. Fix: add
  `test.skip(({ viewport }) => width < 640)` to the session inline edit describe block.

- **instructor-notes.spec.ts:94 (desktop)** — Passes in isolation every time.
  Intermittent test-order interference in full suite. No change made.

**Files changed:**
- `tests/open-sailing.spec.ts` — runId() for short_code + slug, unique assertion
- `tests/student-enrollment.spec.ts` — addInitScript moved before loginAs
- `tests/unsaved-changes.spec.ts` — mobile skip on session inline edit describe
- `src/components/admin/session-row.tsx` — `grid-cols-3` → `grid-cols-1 sm:grid-cols-3`
  (mobile layout improvement; Cancel button was also visually cramped at 375px)
- `docs/PROJECT_PLAN.md` — 6.20 implementation plan appended to task notes; 6.20 pts set to 5

**In Progress:** Nothing.
**Blocked:** Twilio Toll-Free Verification pending (carryover from s102).

**Next Steps:**
1. 6.20 admin/instructor calendar views (plan saved in PROJECT_PLAN.md 6.20 notes)
2. 5.7 waitlist (after any open migrations from s114 land)
3. `supabase db push` — apply s114 slug migration to prod

**Context:**
- Session 114 is on branch `task/6.19-public-course-browse` with slug migration uncommitted.
  The open-sailing test fix (slug field) depends on that migration landing — already fixed.
- `instructor-notes.spec.ts:94` is a known intermittent; if it shows up consistently,
  look for a test that mutates pw_student's `instructor_notes` field without cleaning up.

## Session 114 — 2026-05-01 13:05 [abandoned]

## Session 113 — 2026-05-01 03:22–11:29 (8.1 hrs)
**Duration:** 8.1 hrs | **Points:** 1 bug fix (unplanned) + 5.2 (5 pts)
**Task:** BUG — Admin-created students OAuth redirect loop + PKCE reset-password fix; 5.2 Open Sailing drop-in landed on main via same PR

**Completed:**
- **BUG: Admin-created student OAuth infinite redirect loop.**
  - Root cause: Supabase overwrites `raw_user_meta_data` with the OAuth
    provider payload when linking a new identity to an existing `auth.users`
    row, wiping `is_admin`/`is_instructor`/`is_student` flags. `proxy.ts`
    reads those flags from the JWT (no DB lookup per request — intentional).
    Missing flags → role guard redirects `/student/*` → loop.
  - Fix: `BEFORE UPDATE OF raw_user_meta_data` trigger
    (`handle_user_meta_update`) re-stamps flags from `public.profiles` when
    any flag is missing. Merge order preserves OAuth keys (name, picture, etc.).
  - Backfill in same migration re-stamps existing affected rows.
  - 8 pgTAP tests in `supabase/tests/11_oauth_role_flags.sql` — all green.
  - Manual verification step added to `tests/auth-oauth.spec.ts`.

- **BUG: Forgot-password page stuck on "Verifying…" with PKCE flow.**
  - Root cause: `reset-password/page.tsx` waited for `PASSWORD_RECOVERY` event
    (implicit flow only). Local Supabase and new cloud projects use PKCE —
    reset links arrive as `?code=...`. Browser client (`detectSessionInUrl:
    true`) auto-exchanges the code, first firing `SIGNED_OUT` (prior session
    cleared) then `SIGNED_IN`. Old code treated `SIGNED_OUT` as "link expired".
  - Fix: detect `hasPkceCode` from URL; listen for `SIGNED_IN` on PKCE path;
    only treat `SIGNED_OUT` as expired when no code was present. No explicit
    `exchangeCodeForSession` call (avoids double-exchange race with SDK).
  - Verified end-to-end: admin adds student → student uses forgot-password →
    Mailpit email → reset link → password set → `/student/dashboard`.

- **5.2 — Open Sailing drop-in enrollment model.**
  - Committed on the BUG branch (`ba27e6d`) and landed on main via PR #4
    alongside the bug fix. No separate 5.2 PR.

**In Progress:** Nothing.

**Blocked:** Twilio Toll-Free Verification still pending (carryover from s102).

**Next Steps:**
1. `supabase db push` — apply the OAuth trigger migration to production before
   any admin-created student tries Google sign-in.
2. Verify production Supabase Auth flow type (Auth → URL Configuration) — if
   PKCE, the reset-password PKCE fix is also needed there (already on main).
3. Fix pre-existing `student-enrollment.spec.ts:16` strict-mode failure
   (calendar pills — addInitScript not forcing list view).
4. Continue with next Phase 5 task (5.7 waitlist or 5.4 prereq flagging).

**Context:**
- `f1000000-*` UUID range now used by 5.2 seed data (pw_admin, pw_instructor,
  pw_student, pw_student2). Use `f9000000-*` or higher for new pgTAP test users.
- PKCE is now the default for local Supabase and new cloud projects. Auth emails
  (password reset, magic link) go through Mailpit locally — not Resend. Resend
  is for app notifications only (session cancellations etc.).

## Session 112 — 2026-05-01 00:40–02:54 (2.25 hrs)
**Duration:** 2.25 hrs | **Points:** 3 (6.1)
**Task:** 6.1 — Admin mobile responsiveness pass + CR cleanup from s111

**Completed:**
- **CR cleanup — 4 advisory items from s111 code review.**
  - Extracted `EnrollmentQueueCard` component to
    `src/components/admin/enrollment-queue-card.tsx`; removed near-duplicate
    `CancellationRequests` + `PendingEnrollments` inline functions.
    Dashboard shrinks from 373 → 288 lines.
  - Sort-order comment added to the `cancel_requested` query.
  - `test.skip(project !== 'desktop')` guard added to
    `tests/dashboard-cancel-requests.spec.ts`.
  - `as unknown as` casts left as tech debt.

- **6.1 — Admin mobile responsiveness pass (3 pts).**
  - `hidden sm:table-cell` / `hidden md:table-cell` applied to secondary
    columns across: courses list (Instructor, Sessions, Price), course-types
    list (Cert Body, Max Students, Min Hours), users list (Email), course
    detail sessions table (Time, Location, Instructor), course detail
    enrollments table (Email, Payment, Enrolled), dashboard upcoming sessions
    (Instructor). Each table retains 3 key columns + actions at 375px.
  - `src/components/admin/session-row.tsx` cells match header visibility.
  - 2 new mobile-only Playwright tests in `tests/admin-mobile.spec.ts`.
  - Full-suite follow-up: 5 mobile test failures found and fixed — mobile
    skip guards added to `enrollment-refund.spec.ts` (3 tests using nth()
    locators on hidden payment/status columns), `payment-e2e.spec.ts` (2
    tests — one directly, one serial-flow cascade), and
    `admin-course-crud.spec.ts` (Location column assertion). Pre-existing
    failures not caused by this session: `student-enrollment.spec.ts:16`
    (strict-mode violation on calendar pills) and
    `session-cancellation-notice.spec.ts:86` (intermittent flake, passed
    on re-run).
  - Verified live on Eric's phone. Build clean, lint clean.

**In Progress:** Nothing.

**Blocked:** Twilio Toll-Free Verification still pending (carryover from s102).

**Unreviewed-by-Eric tasks (running tally):**
- 4.6 — Instructor session notes (s107)
- 4.10 — ui-reviewer agent recreation (s107)
- 6.2 — Instructor mobile pass (s109)
- 4.2 partial — sortable users + invite panels (verbally confirmed s111, not tapped)
- 6.1 — Admin mobile pass (s112; verified on Eric's phone ✓)

**Next Steps:**
1. **Scoping sit: 5.2 Open Sailing + 6.19 LTSC public pages.** Do poker
   estimates before any build work. Eric has deferred this two sessions running.
2. Fix pre-existing `student-enrollment.spec.ts:16` strict-mode failure
   (calendar pills — addInitScript not forcing list view).
3. **Cut a task branch** (`git checkout -b task/X.Y-...`) before any coding
   next session — PR was skipped this session because work stayed on main.

**Context:**
- `toQueueRows()` in dashboard/page.tsx typed against `pendingEnrollments`
  but called with both queues — silent on shape divergence. Code review flagged.
- `EnrollmentQueueCard` uses raw `<table>` (matches `UpcomingSessions` sibling)
  rather than shadcn `<Table>`. Pre-existing inconsistency, low urgency.
- "Showing 10 of N pending" footer copy wrong for cancellation requests. Low priority.
- `student-enrollment.spec.ts:16` [mobile/desktop]: strict-mode violation —
  `getByText('ASA 101 - Evening Series (May)')` resolves to 4 calendar pills.
  Pre-existing, not caused by s112.
- **PR missed this session** — work committed directly to main. Task branch
  must be cut right after plan approval next session.

**Code Review:** 4 advisory items, 0 bugs, 0 security issues.
- (consistency) `toQueueRows` type implies pending-only, called with both queues.
- (consistency) `EnrollmentQueueCard` uses raw `<table>` instead of shadcn `<Table>`.
- (cleanup) "Showing 10 of N pending" copy wrong for cancellation requests.
- (cleanup) Mobile-only test skips use inline `test.skip` — consistent but not centralized.

## Session 111 — 2026-04-30 21:31–22:34 (1.1 hrs)
**Duration:** 1.1 hrs | **Points:** 3 (6.15)
**Task:** Phase 6.15 — Admin pending-cancellation widget

**Completed:**
- **4.2 sign-off confirmed.** Eric verified sort + invite panels working. Dropped 4.2 from the unreviewed list.
- **6.15 — Admin dashboard pending-cancellation widget (3 pts).**
  - Two new queries added to `getDashboardData()` Promise.all in
    `src/app/(admin)/admin/dashboard/page.tsx`: `cancelRequests` (top 10
    `cancel_requested` enrollments, newest-first, with student + course joins)
    and `cancelCount` (count-only).
  - New `CancellationRequests` component mirrors `PendingEnrollments` exactly —
    card with `"Cancellation Requests (N)"` title, student/course/enrolled-date
    table, "Showing 10 of N" footer. Each course name links to
    `/admin/courses/${course.id}`.
  - Sort order: newest-first (vs oldest-first for PendingEnrollments) — most
    recently requested cancellations land at the top.
  - New `tests/dashboard-cancel-requests.spec.ts`: seeds a uniquely-titled
    course + enrollment, flips it to cancel_requested, asserts card renders
    with count and correct course link. 1 desktop test, 5.1s.
  - tsc clean, lint clean, production build clean. Smoke-tested in live app — widget renders correctly; "Cancel (no refund)" path confirmed for students without Stripe payment records.

**In Progress:** Nothing.

**Blocked:** Twilio Toll-Free Verification still pending (carryover from 102).

**Unreviewed-by-Eric tasks (running tally):**
- 4.6 — Instructor session notes (s107)
- 4.10 — ui-reviewer agent recreation (s107)
- 6.2 — Instructor mobile pass (s109)
- 4.2 partial — sortable users + invite panels (s109; Eric verbally confirmed working this session but not via PR tap)

**Next Steps:**
1. **Scoping sit: 5.2 Open Sailing + 6.19 LTSC public pages.** Both need a
   poker estimate before work starts. Eric flagged these as the next scoping
   priority. Consider doing both in one planning sit before the next build session.
2. **6.1 — Admin mobile responsiveness pass (3 pts).** Next high-priority build
   task after 6.15.
3. **Code review cleanups to carry forward (4 items, none blocking):**
   - `CancellationRequests` + `PendingEnrollments` are near-duplicate — extract
     shared `EnrollmentQueueCard` component; will also bring dashboard file back
     under 200 lines (currently ~373).
   - `tests/dashboard-cancel-requests.spec.ts` needs
     `test.skip(test.info().project.name !== 'desktop')` guard to prevent
     triple-run in serial mode across mobile/tablet/desktop workers.
   - Sort-order divergence between the two widgets warrants a one-line comment
     explaining why cancellations are newest-first.
   - `as unknown as` cast pattern on nested Supabase selects is tech debt (same
     smell in both components); tracked for when type regeneration lands.

**Context:**
- **Cancellations widget is newest-first by design.** Admin wants to see what
  just arrived, not what's been sitting. PendingEnrollments stays oldest-first
  as a FIFO confirmation queue. The difference is intentional.
- **Dashboard is now 373 lines**, exceeding the 200-line convention. The
  two enrollment-queue cards are the bulk of the excess. Extraction into
  `components/dashboard/enrollment-queue-card.tsx` is the right fix but was
  out of scope for a 3-pt task.
- **Test locator pattern for dashboard cards:** use
  `page.locator('[data-slot="card"]').filter({ hasText: /Title Regex/ })`
  to scope row assertions to a specific card, avoiding false matches across
  the page's multiple tables.
- **Oldest-to-newest test isolation:** the cancel-requests test uses a uniquely-
  titled course (via `runId()`) and newest-first query ordering so prior test
  runs' leftover cancel_requested rows don't crowd out the assertion target.
- **Students without Stripe payment records** hit the "Cancel (no refund)" button path — no Stripe API call. Expected for cash/check/venmo/admin-enrolled students.

**Code Review:** 4 advisory items, 0 bugs, 0 security issues.
- (consistency) Sort order divergence from PendingEnrollments — add a comment.
- (consistency) CancellationRequests + PendingEnrollments are exact duplicates → extract shared component; also fixes the 200-line violation.
- (cleanup) Test missing `test.skip(project !== 'desktop')` guard — will triple-run with undefined behavior on mobile/tablet workers.
- (cleanup) `as unknown as` casts on nested Supabase selects — tech debt, not urgent.

## Session 110 — 2026-04-30 12:28–20:58 (4.00 hrs; subtract 4.5 hrs away from desk from 8.50 hr wall clock)
**Duration:** 4.00 hrs | **Points:** 5 (4.2b)
**Task:** Phase 4.2b — consolidate /admin/users + invite routes (Option A). First session under the new PR-per-task workflow.

**Completed:**
- **Sign-off tracking established.** Eric flagged that he's accumulating tasks he hasn't personally reviewed (4.6, 4.10, 6.2, 4.2 partial — all from sessions 107–109). PR-per-task workflow will absorb this naturally; until each one ships through a PR Eric has tapped, /its-alive briefings + /its-dead summaries carry the unreviewed list.
- **Pinned for later:** scoping for **5.2 Open Sailing** (per-session enrollment, current 5-pt estimate looks light — likely 8–13) and **6.19 LTSC public course pages** (URL shape, anon RLS, layout chrome) — both still need a dedicated sitting.
- **4.2b — consolidate /admin/users + invite routes (5 pts; Option A).**
  - **Scope discovery:** session 109's plan said "delete 6 routes, update 16 refs" but `/admin/users` was not a complete replacement. Three real gaps: no `/admin/users/[id]` detail page; no `/admin/users/new`; `UserEditForm` missing student-only fields (`experience_level`, `asa_number`, `is_member`). Surfaced three options to Eric (A: minimal — keep student detail/edit/new under `/admin/students/*`, link from users-list. B: full consolidation 6–8 pts. C: punt). Eric picked **A**.
  - **Deleted (5 files):** `src/app/(admin)/admin/students/page.tsx`, `src/app/(admin)/admin/instructors/page.tsx`, `src/app/(admin)/admin/instructors/[id]/edit/page.tsx`, `src/app/invite/admin/[token]/page.tsx`, `src/app/invite/instructor/[token]/page.tsx`.
  - **Created (1 file):** `src/app/invite/[role]/[token]/page.tsx` with a `ROLE_COPY` map, `notFound()` on invalid role. Existing URLs (`/invite/admin/X`, `/invite/instructor/X`) still resolve under the dynamic route.
  - **Routing model:** `/admin/users` rows now branch by role. Student rows expose **View** → `/admin/students/[id]` and **Edit** → `/admin/students/[id]/edit` (full `ProfileEditForm` with experience / ASA / member). Non-student rows route Edit → `/admin/users/[id]/edit` (`UserEditForm` — basic + roles). Instructor rows additionally render the existing `InstructorActions` Deactivate/Activate buttons inline (preserves DEC-019 confirm dialog).
  - **Other source edits:** "Add Student" button on `/admin/users` → `/admin/students/new`. Admin nav + mobile drawer dropped Instructors/Students entries (Users only). Breadcrumbs on the surviving `/admin/students/*` pages now point at `/admin/users` (label "Users"). `ProfileEditForm` `returnPath` flipped to `/admin/users`. `createAdminStudent` redirects to `/admin/users`. `revalidatePath('/admin/instructors')` calls dropped across `actions/{instructors,invites,profiles}.ts`.
  - **Tests (7 files updated):** `admin-students`, `asa-number`, `instructor-cascade`, `instructor-invite`, `member-pricing`, `student-history`, `unsaved-changes`. Invite-flow tests now expand the `<details>` collapsibles before regenerating. `unsaved-changes` user-edit tests target the **PW Instructor** row so they hit `UserEditForm` (student rows route to `ProfileEditForm`).
  - tsc clean (after `rm -rf .next` to clear Next type cache referencing deleted routes). Lint clean. Production build clean — `/invite/[role]/[token]` shows in route manifest.
  - Full Playwright suite: 405/405 passing after 1 fix + 1 flake confirm. Initial run had 5 failures: 4 in `unsaved-changes` (real — student row routed to `/admin/students/[id]/edit`, fixed by targeting the PW Instructor row), 1 in `session-cancellation-notice "notify flag off"` (cross-file isolation flake — passed on retry; carryover from 106).
  - PR #2 opened (`task/4.2b-route-deletion` → `main`), Eric reviewed on mobile and merged.
  - Final main commit: `e2fc3fe`.
- **PR workflow gap caught.** I jumped from `/kill-this` directly to `/its-dead`, skipping the push-branch + open-PR steps. Eric flagged it ("I thought we were getting a PR for this"). Pushed branch + opened PR via `gh pr create` mid-`/its-dead`, then resumed the close after Eric merged. The `/kill-this` skill body does NOT include push or `gh pr create` even though CLAUDE.md describes it that way — gap to fix in the skill (or in CLAUDE.md).
- Local dev-server snafu mid-session: a wedged `next-server` (PID 3842864) was already on port 3000 (accepted TCP, never responded). Killed it; new `npm run dev` came up clean. `ss -tlnp | grep :3000` is faster than `lsof` for "what's actually listening."
- Hetzner git config still missing — reused `mobiustripper42 / mobius5kcrypto@gmail.com` one-off flags for the commit (sessions 103/105/107/108/109/110 now). Phase 7 dev-tooling task is the long-term fix.

**In Progress:** Nothing.

**Blocked:** Twilio Toll-Free Verification still pending (carryover from 102).

**Unreviewed-by-Eric tasks (running tally; supersedes-as-PR-workflow-lands):**
- 4.6 — Instructor session notes (s107)
- 4.10 — ui-reviewer agent recreation (s107)
- 6.2 — Instructor mobile pass (s109)
- 4.2 partial — sortable users + invite panels (s109)
- ~~4.2b~~ — reviewed via PR #2 mobile-merge this session ✓

**Next Steps:**
1. **Fix the `/kill-this` skill** so it actually pushes branch + opens PR (currently inconsistent with CLAUDE.md description). 1 pt of skill maintenance. Worth doing before the next task starts.
2. **6.15 — admin pending-cancellation widget (3 pts).** Already scoped: mirror the existing pending-enrollment alert on `/admin/dashboard`, surface `cancel_requested` enrollments as count + linked list. Hook into the dashboard `Promise.all` query batch (same pattern as low-enrollment in 5.8). Playwright desktop test seeding a `cancel_requested` enrollment. No RLS changes expected. Eric explicitly approved this as the next task.
3. **Pinned scoping (separate sitting):** 5.2 Open Sailing pts re-poker; 6.19 LTSC public course pages — URL shape, anon SELECT RLS, layout chrome.
4. **4.2b code review cleanups (4 advisory, none blocking):**
   - `src/actions/profiles.ts:48,139` — two stale `revalidatePath('/admin/students')` calls (parent path no longer renders; nested children won't be picked up by parent-path revalidate). Drop or replace with per-id revalidation.
   - `src/components/admin/users-list.tsx` — grew from ~178 → 223 lines, over the 200-line CLAUDE.md guideline. Extract `<UserRowActions user={u} />` next time the file gets touched.
   - `src/components/admin/users-list.tsx:182` — `InstructorActions` rendered when `is_instructor=true` but its toggle is global on `profiles.is_active`. For admin+instructor users, "Deactivate" copy is ambiguous. Future: gate on `is_instructor && !is_admin`, or rename to "Deactivate user" inside a per-row menu.
   - `src/app/invite/[role]/[token]/page.tsx` — no `loading.tsx`/`error.tsx`. Consistent with what was deleted; flagging only because the consolidation was a chance to add them.
5. **Carryovers from sessions 106–109 still open** (not addressed this session): pgTAP testing-cadence question for `/kill-this`; manual smoke of 3.10 + 3.11; SMS smoke-test investigation; cross-file Playwright isolation hardening (the `notify flag off` flake is a live example); DEC-015 cleanup; `useTransientSuccess` hook extraction (5+ forms); 5.8 follow-ups (`low_enrollment.ts` error-path silently returns []; N+1; instructor-session page gate duplicates SQL helper logic); session-notes empty/whitespace clears silently; 4 small pgTAP gaps in `10_session_notes_rpc.sql`.

**Context:**
- **Option A is the explicit design now.** `/admin/users` is the single users entry point, but `/admin/students/{[id], [id]/edit, new}` are still alive on purpose — they own student-specific fields the unified `UserEditForm` doesn't carry. The users-list branches the Edit destination by `is_student`. Do NOT delete the surviving `/admin/students/*` routes without first merging `ProfileEditForm` student fields into `UserEditForm` (that's the deferred Option B work, not in V2).
- **Session 109's "delete 6 routes, update 16 refs" plan was wrong.** It assumed `/admin/users` was a complete replacement; it was not. `/admin/users/[id]/edit` (UserEditForm) and `/admin/students/[id]/edit` (ProfileEditForm) are different forms with different fields. Anyone reading 109's "next steps" should mentally substitute the Option A scope from this session.
- **InstructorActions on the users list ≠ instructor-only.** The component flips `profiles.is_active` (generic). For pure-instructor users it's named correctly; for admin+instructor users the "Deactivate" copy is ambiguous (code review #3). Acceptable for now; revisit when adding any per-row action menu.
- **`<details>` collapsible interaction in tests:** locator pattern is `page.locator('details').filter({ hasText: 'Instructor invites' }).locator('summary').click()`. `getByRole('group')` does NOT work — `<details>` doesn't have a default ARIA role. First time this project asserts on `<details>`; pattern now established.
- **PR-per-task is now the workflow.** This session was the first run under it. The complete loop is: `/kill-this` (commit + **push + PR**) → mobile review → `/ship-it` (merge) → `/its-dead` (log on main). Skipping the push/PR step lands you on a feature branch with a local commit, which `/its-dead` then tries to push along with the session log into the same branch — polluting the PR diff. The `/kill-this` skill needs the explicit push + `gh pr create` steps.
- **Sign-off tracking is now part of the session ritual.** Until PR-on-mobile is fully the review unit, every /its-alive and /its-dead summary lists tasks Eric hasn't personally walked. If a task IS reviewed, drop it from the list explicitly. Don't let it accumulate silently — that's how 4.6 and 4.10 ended up two sessions stale.
- **Wedged dev server symptom:** port 3000 accepts TCP but never responds (curl hangs to timeout). `ss -tlnp | grep :3000` shows the listener PID; if stale `next-server`, kill -9 and restart. Faster than `lsof`.

**Code Review:** 4 advisory items, 0 blocking, 0 security concerns. (@code-review against `692e4c4`.) Findings logged in Next Steps #4.

## Session 109 — 2026-04-30 02:44–11:00 (1.75 hrs; subtract 6.5 hrs sleep from 8.27 hr wall clock)
**Duration:** 1.75 hrs | **Points:** 8 (6.2: 2, 4.2 partial: 6)
**Task:** Project-plan priority reorder + Phase 6.2 instructor mobile pass + Phase 4.2 partial (column sorting + invite panels on /admin/users + JWT bug verification).

**Started with a snafu:** prior /its-alive in this session hit a "don't ask mode" Edit denial mid-flight while reordering PROJECT_PLAN.md. Picked up from there.

**Completed:**
- **Project-plan priority reorder (V2 last-blast).** Eric set per-task priorities across Phases 4/5/6. Reordered each phase table: completed rows grouped at top; unfinished rows below in priority order (very high → high → medium → low → "high but last" → close). IDs frozen — no commit/log refs broken. Cuts to V3 Ideas (preserved with original IDs in a "Cut from V2 in session 109" sub-list): **4.7** (instructor profile expansion), **5.1** (member pricing), **5.3** (discount codes), **5.5** (admin qualification grant), **5.6** (duplicate enrollment warning), **6.0** (LTSC theme tune), **6.6** (duplicate course), **6.11** (public landing page), **6.16** (show refund amount). Total cut: **23 pts**.
- **Two new V2 tasks added** (Eric's call this session): **6.19** Public course browse + detail pages for LTSC inbound links — pts TBD, scoping tomorrow morning. **6.20** Admin + instructor calendar views (promoted from V3 Ideas) — pts TBD, "must ship before V2 release."
- **Phase totals updated.** Phase 4: 45 → 42; Phase 5: 50 → 39; Phase 6: 52 + TBD for 6.19/6.20. Summary table reconciled (was drifting from section sums for Phase 1, 2, 4, 5, 6 by varying amounts; old Total 298 was off; fixed to actual sum 349 with an inline "Reconciled in session 109" note). Velocity Tracking phase rows + total similarly updated. Eric explicitly said totals would be re-reconciled at end of V2.
- **Cuttable Tasks section** trimmed to remaining V2 candidates (6.7, 6.9, 5.11, 6.1, 6.10).
- **6.2 — Instructor mobile responsiveness pass (2 pts).**
  - Audit revealed 6.2 was confused with 1.20 (mobile drawer infra, already shipped). Real 6.2 = audit-and-fix. Three pages walked.
  - **Fix 1:** `src/app/(instructor)/instructor/dashboard/page.tsx:84` — stat cards `grid-cols-3` → `grid-cols-2 lg:grid-cols-3` (mirrors admin pattern shipped in 5.8).
  - **Fix 2:** `src/app/(instructor)/instructor/sessions/[id]/page.tsx` — Email column TableHead + TableCell now `hidden sm:table-cell` so 375px shows Name + Phone + Attendance only. Phone kept (instructors call students from the field); Email is secondary.
  - `/instructor/students/[id]` clean — no tables/grids, reuses StudentHistoryList.
  - 2 mobile-only Playwright tests appended to `tests/instructor-views.spec.ts` (stat-card geometry assertion + Email-column hide). Full file 14/14 green, 19 skipped by design.
- **4.2 partial — column sorting + invite panels + JWT bug (~6 pts).**
  - **Recon surprise 1:** the JWT bug carryover ("invited instructors bounced from /instructor/dashboard until JWT refresh") was already fixed in the original 4.1 commit `c69b048`. `acceptInstructorInvite` already does `updateUser({data: …}) + refreshSession`. Comment block at lines 53-57 explains why. Carryover note in session 106 was stale before it was logged.
  - **Recon surprise 2:** `/admin/users` skeleton existed but invite panels weren't there, only an `InstructorInvitePanel` was on `/admin/instructors`. Re-scoping discovery: the invite acceptance flow only existed for instructor — admin path needed creation. Bumped 4.2-partial estimate from 4-5 → 6 pts.
  - **Action layer:** `acceptInstructorInvite(token)` → generic `acceptInvite(role, token)`. Same updateUser + refreshSession sequence; metadata key + redirect target switch on role.
  - **Panel:** `instructor-invite-panel.tsx` → `invite-panel.tsx` parameterized on role via a `ROLE_LABELS` map (title/description/pathPrefix). testid is now `invite-url-${role}`.
  - **Shared form:** `src/components/invite/accept-invite-form.tsx` (new). Old per-route `accept-form.tsx` deleted.
  - **Admin acceptance route:** `src/app/invite/admin/[token]/page.tsx` mirrors instructor.
  - **`/admin/users` page:** fetches both invites in parallel, renders two `<details>` collapsibles ("Admin invites" / "Instructor invites") wrapping InvitePanel. Native `<details>` instead of pulling in radix-collapsible.
  - **Sorting:** `users-list.tsx` adds sort state (Name/Email/Status × asc/desc), `SortableHead` subcomponent, `aria-sort` on the `<th>` (NOT the button — original placement on button tripped jsx-a11y/role-supports-aria-props), ↑/↓/↕ glyphs, click-to-toggle direction.
  - **Tests:** pgTAP `09_invites.sql` plan 15 → 17 (+2 cases for `accept_invite('admin')`). Suite **133/133** (was 131; aligns with session 108 baseline). Playwright `tests/admin-users.spec.ts` (new), 4 desktop tests covering sort + panel collapse/expand, all green. `instructor-invite.spec.ts` testid updated to `invite-url-instructor`.
- Build clean. Lint clean. tsc clean. Full Playwright suite green (Eric ran).
- Hetzner git config still missing — used the same one-off `mobiustripper42 / mobius5kcrypto@gmail.com` flags as sessions 103/105/107/108. Phase 7 dev-tooling task is still the right place for the long-term fix.
- **Local pgTAP drift caught:** initial `supabase test db` failed across 4 unrelated files due to lingering local DB state from earlier runs. `supabase db reset` cleared it; suite went 133/133. Worth remembering — pgTAP isn't sandbox-clean across days.
- Commit `9bf52bd`.

**In Progress:** Nothing.

**Blocked:** Twilio Toll-Free Verification still pending (carryover from session 102).

**Next Steps:**
1. **Tomorrow morning scoping session (Eric):** poker for **5.2 Open Sailing** (current "5 pts" estimate looks light — likely 8, possibly 13; data-model question on per-session enrollment may want @architect input) and **6.19 LTSC public course pages** (open questions: URL shape — UUID vs slug vs both; RLS for anon SELECT; layout chrome).
2. **4.2b — old route deletion (deferred from this session, ~3-4 pts).** Delete `/admin/students/{,[id],[id]/edit,new}` (4 routes) + `/admin/instructors/{,[id]/edit}` (2 routes). Update references in ~9 source files (admin nav, mobile drawer, sub-routes, missed-sessions) + ~7 test files. Code review #1 + #2 suggest folding two cleanups into 4.2b: (a) consolidate `/invite/admin/[token]` + `/invite/instructor/[token]` into `/invite/[role]/[token]` with a ROLE_COPY map (~40 duplicated lines); (b) extract a tiny `<DisclosurePanel title=…>` component if a third `<details>` use lands.
3. **6.2 deferred follow-up:** roster table at <640px considered a fix already (Email hidden) — but if Eric finds the table still cramped, the next move is hiding Phone too on the very narrowest widths. Not flagged this session.
4. **Code review cleanups from this session (4 advisory, none blocking):**
   - `invite-panel.tsx:52` `setTimeout` for copy success has no cleanup — same shape exists in `src/app/dev/copy-button.tsx:14`. One-line fix when convenient (ref + cleanup effect, or mounted-ref guard). Pre-existing, not introduced this session.
   - Consolidate two near-identical invite route pages into one dynamic `/invite/[role]/[token]` (queue with 4.2b).
   - Extract DisclosurePanel for the `<details>` pattern (queue with 4.2b).
   - `tests/admin-users.spec.ts` — every test starts with `test.skip(test.info().project.name !== 'desktop')`; could move to describe-level skip or beforeEach. Consistent with `instructor-views.spec.ts` so cosmetic.
5. **Carryovers from session 108 still open:**
   - Eric's close-review of session 107's work — 4.10 + 4.6.
   - `revalidatePath` in `updateSessionNotes` doesn't invalidate the admin attendance page.
   - Empty/whitespace-only save silently clears notes; success copy still says "Notes saved."
   - 4 small pgTAP gaps in `10_session_notes_rpc.sql` (unauthenticated, missing session, whitespace-clear, exact-2000-char boundary).
   - `useTransientSuccess` hook extraction — 5 forms duplicate the pattern.
   - 5.8 follow-up cleanups (low_enrollment.ts error-path silently returns [], N+1 query pattern, etc.).
6. **Carryovers from session 106:**
   - pgTAP testing-cadence question for `/kill-this`.
   - Manual smoke of 3.10 + 3.11.
   - SMS smoke-test investigation, cross-file Playwright isolation hardening, DEC-015 cleanup.

**Context:**
- **Project plan reorder = IDs are frozen, row positions are not.** Phase 4/5/6 tables now group completed rows at top, unfinished rows below in priority order. Cut tasks live in V3 Ideas with original ID in parens. Anyone reading the file linearly should NOT expect numerical ID order anymore — read by section position, not by ID.
- **Summary total reconciled mid-session.** Was 298, drifted from section sums; now 349 (matches actual). Inline note flags this. Eric chose to defer further reconciliation to end of V2.
- **6.19 (public course pages for LTSC) is a launch-gating task.** LTSC keeps WordPress as the marketing front; their per-product pages link "Register" buttons into SailBook. SailBook currently drops anonymous visitors at `/login` so any LTSC inbound is broken. Decision (Eric): option (b) — make `/courses/...` publicly viewable with auth deferred to enrollment CTA. Not (a) — building marketing-grade pages in SailBook. Major V2-scope addition.
- **6.20 (admin + instructor calendar views) is V2 now.** Promoted from V3 in this session. Reuse the 5.10 student calendar component shell. Pts TBD.
- **The JWT bug carryover was stale.** Already fixed in 4.1 (`c69b048`, lines 57-63 of invites.ts). Don't trust carryover notes blindly — verify against current code before scheduling work. The comment block in invites.ts explains the WHY perfectly; that's the kind of in-code documentation that survives context loss between sessions.
- **`acceptInvite(role, token)` is safe even though `role` is now caller-supplied.** The SECURITY DEFINER RPC at `20260423182537_invites_table.sql:31-71` validates `p_role IN ('instructor', 'admin')` server-side AND gates promotion on a token match for that exact role. A student can't escalate to admin without holding the admin token. The action-layer `InviteRole` type is just convenience.
- **Native `<details>` is the project's first disclosure-pattern use.** Chose it over `@radix-ui/collapsible` to avoid the dep — DEC-style "don't pull a dep for one use." Two un-extracted instances on `/admin/users` are fine; if a third lands, extract `<DisclosurePanel>` (code review #2).
- **`aria-sort` belongs on `<th>`, not on the inner `<button>`.** First lint pass put it on the button → `jsx-a11y/role-supports-aria-props` warning. Moved to `<TableHead>` which renders as `<th>` (the actual columnheader element). Worth remembering for any future sortable tables.
- **pgTAP local drift bites.** Local `supabase test db` failed across 4 unrelated files at first run due to lingering state from prior days. `supabase db reset` cleared it. /kill-this skill could plausibly add a "did you reset recently?" prompt — flag for Eric's pgTAP-cadence mulling.
- **Playwright Chrome MCP doesn't work on Hetzner box** — wants `/opt/google/chrome/chrome` which isn't installed. Pivoted to code-level audit for 6.2; worked fine. Same workaround if any future browser-via-MCP work is needed.

**Code Review:** 4 advisory items, 0 blocking, 0 security concerns. (@code-review against `9bf52bd`.)
1. **cleanup** `invite/admin/[token]/page.tsx` + `invite/instructor/[token]/page.tsx` — 90% byte-identical, consolidate into `invite/[role]/[token]/page.tsx` with ROLE_COPY map. Queue with 4.2b.
2. **cleanup** `/admin/users/page.tsx:39-58` — first `<details>` use; two near-identical instances. Extract `<DisclosurePanel>` if a third instance lands.
3. **cleanup** `invite-panel.tsx:52` — `setTimeout` for copy success has no unmount cleanup. Pre-existing pattern (also in `dev/copy-button.tsx:14`).
4. **cleanup** `tests/admin-users.spec.ts` — every test repeats `test.skip(... !== 'desktop')`; could move to describe-level. Consistent with prior style; cosmetic only.

**Verified clean:** RPC role validation server-side (admin-escalation prevented at SQL); DEC-015 shape on `acceptInvite` return; no new RLS surface; mobile layout matches admin pattern; `/invite/` already in PUBLIC_PREFIXES proxy allowlist.

## Session 108 — 2026-04-29 23:38–2026-04-30 01:38 (2.00 hrs)
**Duration:** 2.00 hrs | **Points:** 7 (4.11: 2, 5.8: 5)
**Task:** Phase 4 cleanup (4.11) + Phase 5 kickoff (5.8). Both bundled in commit `862357b`.

**Completed:**
- **4.11 — Substitute-instructor page bug + DEC-007 pgTAP coverage (2 pts).**
  - `src/app/(instructor)/instructor/sessions/[id]/page.tsx` — page authorization at line 66 was redirecting any instructor who wasn't the course-level owner. The `update_session_notes` RPC authorizes both course-level AND session-level instructors per DEC-007, so substitutes assigned only at the session level were redirected before reaching a form they were already RPC-authorized to use. Fix: add `instructor_id` to the session select; gate becomes `course.instructor_id !== user.id && session.instructor_id !== user.id`.
  - `supabase/tests/10_session_notes_rpc.sql` — added 3 cases (plan 8 → 11) for the DEC-007 override path: session-level-only instructor writes; column actually changed; course-level instructor still authorized when override exists.
- **5.8 — Low-enrollment thresholds on course_types (5 pts; re-scoped 2 → 5).**
  - **Re-scope reason:** scoping discovery — the existing 3.4 cron alert was using hardcoded `LOW_ENROLLMENT_RATIO = 0.5` and `LOW_ENROLLMENT_DAYS_OUT = 14`. 5.8 needed to replace both, not just add a dashboard tile.
  - `supabase/migrations/20260430004850_add_low_enrollment_thresholds.sql` — `course_types.minimum_enrollment` (int, nullable, NULL = opt out) + `course_types.low_enrollment_lead_days` (int NOT NULL DEFAULT 14). Non-negative CHECK constraints on both.
  - `src/lib/low-enrollment.ts` (new) — shared `findLowEnrollmentCourses(client, now)` helper. Single source of truth for both the daily admin cron alert AND the new admin dashboard tile.
  - `src/lib/notifications/triggers.ts` — `notifyLowEnrollmentCourses` now calls the helper; constants deleted. Threshold semantics changed from ratio (≥ 0.5 of capacity) to absolute (`enrolled < minimum_enrollment`).
  - `src/components/admin/course-type-form.tsx` + `src/actions/course-types.ts` — both fields with helper text. Extracted `readThresholds(formData)` so create + update share the parse path.
  - `src/app/(admin)/admin/dashboard/page.tsx` — new `LowEnrollmentCard` tile next to `InstructorCard`. Stat row now `grid-cols-2 lg:grid-cols-3`. Helper invoked in parallel with the existing dashboard queries (`Promise.all`).
  - `tests/admin-low-enrollment.spec.ts` (new) — 2 desktop tests: (a) default seed shows ✓ "Enrollment Healthy" (all `minimum_enrollment` are NULL); (b) setting ASA 101's minimum to 99 flips the tile to "⚠ Low Enrollment" (with `finally` cleanup so the seed state isn't polluted).
- pgTAP **131/131** (was 128 — added 3 for DEC-007 override).
- tsc clean. Lint clean. Build clean.
- Full Playwright suite green (Eric ran `npx playwright test`).
- Type regen: `npx supabase gen types typescript --local 2>/dev/null > src/lib/supabase/types.ts` — same `2>/dev/null` workaround for the CLI's "new version available" stderr leak that session 107 documented.
- Hetzner git config still missing — used the same one-off `mobiustripper42 / mobius5kcrypto@gmail.com` flags as sessions 103/105/107. Phase 7 dev-tooling task is the right place for the long-term fix.
- Plan updated: Phase 4 total 43 → 45 (+2 for 4.11), Phase 5 total 47 → 50 (+3 for 5.8 re-scope).
- Commit `862357b` (4.11 + 5.8 bundled).

**In Progress:** Nothing.

**Blocked:** Twilio Toll-Free Verification still pending (carryover from session 102).

**Next Steps:**
1. **Phase 5 priority order Eric set this session: 5.8 → 5.11 → 5.7.** With 5.8 done, **5.11 (bulk price update, 8 pts)** is next, followed by **5.7 (waitlist, 8 pts)**. 5.7 is unblocked now that Phase 3 notifications shipped.
2. **5.8 follow-up cleanups from code review** (advisory, no blockers):
   - `src/lib/low-enrollment.ts:38-41` — error path returns `[]`, dashboard then renders "Enrollment Healthy" (false negative). Same risk on cron path. Consider returning a discriminated union or letting the dashboard surface "Unable to compute" so a broken query isn't invisible.
   - `src/lib/low-enrollment.ts:46-72` — N+1 query pattern (1 course list + 2 per-course). Fine at single-school scale; revisit if active courses exceed ~50.
   - `src/actions/course-types.ts:11-13` — `Number(minRaw)` returns `NaN` for malformed input, falls through to a generic Postgres CHECK error. `<input type="number">` makes this unlikely; the CHECK catches it. Acceptable today.
   - `tests/admin-low-enrollment.spec.ts:31-37` — `finally` cleanup is good but if cleanup itself fails, seed pollutes. A dedicated test-only course type would be more robust. Desktop-only guard mitigates today.
   - `supabase/tests/10_session_notes_rpc.sql:146-148` — add a comment noting that the DEC-007 override fixture (`UPDATE sessions.instructor_id = pw_instructor`) persists for the remainder of the file. Anyone inserting new cases below would inherit it.
   - `src/app/(instructor)/instructor/sessions/[id]/page.tsx:67` — page gate duplicates `get_instructor_session_ids` logic. Add a one-liner pointing at the SQL helper so future edits stay in sync.
3. **Carryovers from session 107 still open:**
   - Eric's close-review of session 107's work — 4.10 + 4.6. Still flagged; not addressed this session.
   - `revalidatePath` in `updateSessionNotes` doesn't invalidate the admin attendance page.
   - Empty/whitespace-only save silently clears notes; success copy still says "Notes saved."
   - 4 small pgTAP gaps in `10_session_notes_rpc.sql`: unauthenticated, missing session, whitespace-clear, exact-2000-char boundary.
   - `useTransientSuccess` hook extraction — now 5 forms duplicate the pattern.
4. **Carryovers from session 106:**
   - Pre-existing 4.x bug: invited instructors bounced from `/instructor/dashboard` until JWT refresh (`accept_invite` writes role flag to `public.profiles` but not `auth.users.raw_user_meta_data`). Natural fit during 4.2.
   - pgTAP testing-cadence question for `/kill-this`.
   - Manual smoke of 3.10 + 3.11.
   - SMS smoke-test investigation, cross-file Playwright isolation hardening, DEC-015 cleanup.

**Context:**
- **`findLowEnrollmentCourses` is the single read path** for both the daily admin cron alert (`notifyLowEnrollmentCourses`) and the admin dashboard tile. If this function changes, both surfaces shift together — that's the design. Don't split them. The helper takes an optional `now: Date` for testability; in production both call sites use the default.
- **Threshold semantics is absolute, not ratio.** A course flags when `enrolled < course_types.minimum_enrollment`, period. Capacity is no longer part of the math. `minimum_enrollment IS NULL` opts the entire course type out of low-enrollment surfacing — both alert and tile.
- **Dashboard query pattern.** `findLowEnrollmentCourses` is N+1 inside, but it's launched in parallel with the existing dashboard `Promise.all` (kicked off before, awaited after). Fine at single-school scale.
- **`getByText('Low Enrollment', { exact: true })` does NOT match the warning state of the tile** because the CardTitle renders `<span aria-hidden="true">⚠</span>` as a sibling text node — the parent's text content is "⚠Low Enrollment" with no whitespace between. Drop `exact: true` or use a different locator. Same shape as `InstructorCard`. Cost me a debugging detour this session.
- **DEC-007 has two enforcement surfaces now.** `update_session_notes` RPC and the instructor-session page both check `course-level OR session-level`. They must stay in sync. `get_instructor_session_ids` is the SQL helper that encodes both. Anywhere else in the instructor surface that does its own ownership check is suspect.

**Code Review:** 7 advisory items, no bugs, no security concerns. (@code-review against `862357b`.)
1. **consistency** `instructor/sessions/[id]/page.tsx:67` — page gate duplicates SQL helper logic; add cross-reference comment.
2. **cleanup** `low-enrollment.ts:46-72` — N+1 query pattern; flag for >50-course scale.
3. **cleanup** `low-enrollment.ts:75` — `capacity` included in returned shape but not used by helper itself (consumer-facing).
4. **cleanup** `actions/course-types.ts:11-13` — `Number()` returns NaN on malformed input; relies on CHECK constraint to catch.
5. **cleanup** `low-enrollment.ts:38-41` — error path returns `[]`, false-negative on dashboard.
6. **consistency** `tests/admin-low-enrollment.spec.ts:31-37` — `finally` cleanup risk if cleanup itself fails; dedicated test course type would be more robust.
7. **cleanup** `supabase/tests/10_session_notes_rpc.sql:146-148` — override fixture persists for remainder of file; add a comment.

## Session 107 — 2026-04-29 16:53–22:20 (2.42 hrs; subtract 3 hrs interruptions from 5.45 hr wall clock)
**Duration:** 2.42 hrs | **Points:** 4 (4.10: 1, 4.6: 3)
**Task:** Phase 4 kickoff — 4.10 (recreate ui-reviewer agent) + 4.6 (instructor session notes / IN-5).

**⚠ ERIC ASKED ME TO HOLD HIM TO THIS:** all of session 107's work needs a close human review later. Don't let this entry get archived without that pass. The code review (below) found one real bug worth attending to before launch.

**Completed:**
- **4.10 — `.claude/agents/ui-reviewer.md` recreated (1 pt).** 12-point checklist with pass/fix-soon/blocker scoring. Brand rules pulled directly from BRAND.md (Mira/Sky/Mist, Nunito Sans, xs radius, dark-mode-default, mobile@375px). Modeled on `architect.md` / `code-review.md` structure. **Committed to `.claude/agents/` in the repo this time** so it survives box moves (the prior version lived only in `~/.claude/agents/` and was wiped in the Phase 7 dev-box migration).
- **4.6 — Instructor notes on sessions / IN-5 (3 pts).**
  - `supabase/migrations/20260429170000_session_notes_rpc.sql` — new SECURITY DEFINER RPC `update_session_notes(p_session_id uuid, p_notes text) returns text`. Returns NULL on success, error string on failure. Authorizes admin via JWT user_metadata, OR assigned instructor via `get_instructor_session_ids` (covers both course-level and session-level / DEC-007 override). 2000-char cap. `nullif(trim(p_notes), '')` so empty/whitespace clears the column.
  - **Why an RPC, not a column-scoped UPDATE policy:** instructors have SELECT-only on sessions per baseline RLS. Rather than open UPDATE more broadly, route writes through a SECURITY DEFINER RPC that touches only the `notes` column. Same pattern as `update_my_profile` / `profile_role_flags_unchanged`.
  - `src/actions/sessions.ts` — new `updateSessionNotes` action. DEC-015 form shape (returns `string | null`). Returns the RPC's text return as the inline error.
  - `src/components/instructor/session-notes-form.tsx` — controlled textarea, 2000-char counter ("N characters remaining"), useActionState, transient-success effect using the established `prevPending` ref → `hasSubmitted` → `showSuccess` pattern (canonical version: `change-password-form.tsx`).
  - `src/app/(instructor)/instructor/sessions/[id]/page.tsx` — added `notes` to the session select; rendered a Card with the form below the Roster card.
  - `supabase/tests/10_session_notes_rpc.sql` — 8 pgTAP cases: admin write, owning instructor write, other instructor blocked, student blocked, length cap.
  - `tests/instructor-views.spec.ts` — 3 new desktop-only tests appended: write+reload, counter decrement, admin reads notes on attendance page.
- **Type regen friction noted.** `npx supabase gen types --local` writes the CLI's "new version available" stderr message into stdout when redirected, polluting `types.ts`. Workaround: redirect stderr to /dev/null. Not memory-worthy on its own (CLI bug, will go away with an upgrade) but flagging here.
- **Dev server restart needed mid-session** to clear cached old code (same Hetzner-box symptom session 105 documented). After restart the new page rendered correctly.
- **Hetzner git config still missing.** Used the same one-off `mobiustripper42 / mobius5kcrypto@gmail.com` flags as session 103 / 105. Phase 7 dev-tooling task is still the right place for the long-term fix.
- pgTAP **128/128** green (was 120/120 — added 8 cases). Lint clean. tsc clean. Build clean.
- Targeted Playwright: `instructor-views.spec.ts` 12/12 desktop (15 mobile/tablet skipped by design).
- **Full Playwright suite NOT run this session** (Eric's call) — should be re-run before 4.9 close, same shape as session 105 → 106 carryover.
- Commit `f2962bf` (4.10 + 4.6 bundled).

**In Progress:** Nothing.

**Blocked:** Twilio Toll-Free Verification still pending (carryover from session 102).

**Next Steps:**
1. **Eric must close-review session 107's work.** All of 4.10 + 4.6 — the agent definition AND the RPC + form. He flagged this explicitly during the session. **Do not let this drop.**
2. **Fix the DEC-007 substitute-instructor page bug** flagged in code review #1. `src/app/(instructor)/instructor/sessions/[id]/page.tsx:66` does `if (course.instructor_id !== user.id) redirect(...)`, which contradicts the RPC's session-level override authorization. A substitute instructor assigned only at the session level can write notes via the RPC but can't reach the form to do so — they're redirected first. Fix: replace the line with a check against `get_instructor_session_ids(user.id)` or `course.instructor_id === user.id || session.instructor_id === user.id`. Small change. Should land before launch since substitute-instructor is a real Andy workflow.
3. **Add pgTAP coverage for the session-level override path** (code review #2). Every "owning instructor" case in `10_session_notes_rpc.sql` uses Mike, who owns at the course level. Need a case where `sessions.instructor_id` is set to someone who is NOT `courses.instructor_id`, asserting that user can write. Untested DEC-007 branch will silently regress otherwise.
4. **Phase 4 remaining tasks:** 4.2 (admin/users consolidation, 8 pts), 4.3 (student profile expansion, 5 pts), 4.7 (instructor profile expansion — Eric still thinking through scope, hold off), 4.9 (phase close, 5 pts).
5. **Carryovers from session 106 still open:**
   - Pre-existing 4.x bug: invited instructors bounced from `/instructor/dashboard` until JWT refresh (`accept_invite` writes role flag to `public.profiles` but not `auth.users.raw_user_meta_data`). Natural fit during 4.2.
   - pgTAP testing-cadence question for `/kill-this` — Eric is still mulling the right shape.
   - Manual smoke of 3.10 + 3.11 still deferred.
   - SMS smoke-test investigation, cross-file Playwright isolation hardening, DEC-015 cleanup, `useTransientSuccess` hook extraction (now **5 forms** duplicate it — code review #6 calls this out specifically; with #5 it's hook-extraction time).
6. **Cleanups from this session's code review (advisory):**
   - `revalidatePath` in `updateSessionNotes` only invalidates the instructor view; admin attendance page may show stale notes until natural revalidation. Add `revalidatePath('/admin/courses/[id]/sessions/[sessionId]/attendance', 'page')` or accept staleness.
   - Empty/whitespace-only save silently clears notes; form still shows "Notes saved." Either drop `trim` or trim client-side. Edge case but loses data.
   - 4 small pgTAP coverage gaps: unauthenticated, missing session, whitespace-clear behavior, exact-2000-char boundary.

**Context:**
- **The RPC is the only write path for instructors on sessions.** Baseline RLS gives instructors SELECT only. Future "instructor edits session" features (date/time/location/etc.) face the same choice: open UPDATE with a column-scoped policy, or add another RPC. The latter has been the consistent SailBook pattern. Don't open UPDATE without thinking it through.
- **`get_instructor_session_ids` is the right authorization helper for instructor-on-session checks** (covers both course-level and session-level / DEC-007 override). The page at `instructor/sessions/[id]/page.tsx:66` does NOT use it — it bypasses with a direct `course.instructor_id` check. That's the bug in next-step #2. Anywhere else in the instructor surface that does its own ownership check rather than calling the helper is suspect.
- **Transient-success pattern is now in 5 forms** (register-form, student-account-form, change-password-form, notification-preferences-section + this one). Code review flagged it as the threshold. `src/lib/hooks/use-transient-success.ts` is the right next move — small, low-risk, kills duplication.
- **`npx supabase gen types --local`'s stderr leaks into types.ts** when piped without `2>/dev/null`. The CLI's "new version available" notice corrupts the file. Use `npx supabase gen types typescript --local 2>/dev/null > src/lib/supabase/types.ts`.
- **CardTitle renders as `<div>`, not a heading element.** `getByRole('heading', { name: '...' })` won't match it reliably. The existing Roster test happens to pass anyway (mechanism unclear — possibly Playwright's accessible-name heuristics on `font-heading` class). For new tests, use `getByText('...', { exact: true })` instead — that's what worked here.
- **Dev server on Hetzner caches old route handlers.** Same as session 105's `/auth/callback` symptom. After significant page changes, restart the dev server before browser-testing or Playwright will see the old code.

**Code Review:** 7 advisory items, 1 real bug. (@code-review against `f2962bf`.)
1. **bug** `src/app/(instructor)/instructor/sessions/[id]/page.tsx:66` — page redirects substitute instructors who own at session level only (DEC-007). Page check contradicts RPC authorization. Fix in next-step #2.
2. **security** `supabase/tests/10_session_notes_rpc.sql` — no coverage for session-level instructor override path. Untested DEC-007 branch.
3. **cleanup** `10_session_notes_rpc.sql` — 4 missing edge cases: unauthenticated, missing session, whitespace-clear, exact-2000-char boundary.
4. **consistency** `20260429170000_session_notes_rpc.sql:44` — `nullif(trim(p_notes), '')` silently clears notes on whitespace-only input; form still shows "Notes saved." Same risk against the makeup-session literal in `createMakeupSession`.
5. **cleanup** `src/actions/sessions.ts:209` — `revalidatePath` only invalidates the instructor view, not the admin attendance page.
6. **cleanup** `src/components/instructor/session-notes-form.tsx:23-31` — fifth duplication of the transient-success pattern. Hook extraction time.
7. **cleanup** `tests/instructor-views.spec.ts:201-265` — new tests are desktop-only; new Card not verified at 375px.
8. **ui-reviewer.md** — frontmatter and structure match the other agents. Clean.

## Session 106 — 2026-04-29 15:45–16:45 (1.00 hr)
**Duration:** 1.00 hr | **Points:** 5 (3.14: 5)
**Task:** Phase 3.14 — End-of-phase close. All 4 polish items, UI reviewer pass, retro, lint cleanup, suite + code review. Plus a regression catch in pgTAP that had silently shipped two commits ago.

**Completed:**
- **Full Playwright suite** at session start: 404/612 passed, 207 skipped (by design), 1 cross-file flake (`tests/cancel-enrollment.spec.ts:5` — passes in isolation, same pattern as the carryover test-isolation hardening task).
- **pgTAP suite**: 120/120 green after a regression fix. `08_admin_students.sql` tests 1, 3, 9 had been failing since 3.11 (the `handle_new_user` trigger) but pgTAP wasn't run during 3.11 / 3.13 / 3.14 — slipped through. Trigger inserts a baseline profile before the test's explicit INSERT could land. Fixed by switching the test to UPSERT, mirroring the production `createStudent` flow. Eric caught this when running `supabase test db` near end of session.
- **Code review of `e212ee1`** (deferred from session 105 — Anthropic quota wall) — re-ran cleanly, 9 advisory items. One bug: helper text claimed password complexity that server didn't enforce. Tied directly into polish item (c).
- **Polish (a) — `noValidate` on auth forms.** All 5: login, register, forgot, reset, change-password. Removes the unstyleable HTML5 popover; server errors land in the destructive paragraph.
- **Polish (b) — preserve form values on validation failure.** Register form converted to controlled inputs (firstName, lastName, email, phone, experienceLevel, instructorNotes — all `useState`). Password intentionally uncontrolled.
- **Polish (c) — friendly password-policy error copy + server-side complexity check.** New `src/lib/auth/password-rules.ts`:
  - `PASSWORD_MIN_LENGTH = 12`, `PASSWORD_RULES_HELP` (extracted from 3 duplicated forms).
  - `validatePassword(password)` mirrors the Supabase policy server-side (length + lower/upper/digit regex). Returns null or a friendly error.
  - `friendlyPasswordError(supabaseMessage)` translates Supabase's verbose policy errors ("Password should contain at least one character of each: abcdefghijklmnopqrstuvwxyz...") into our copy. Falls back to the original on no match.
  - Wired into `register`, `updatePassword` (recovery), `changePassword` — all three. Closes the helper-text-vs-server mismatch the code review flagged.
- **Polish (d) — register UX review** covered by (a)+(b)+(c).
- **UI reviewer stand-in** (general-purpose agent — `~/.claude/agents/ui-reviewer.md` was lost in Phase 7 migration, never committed to git). 3 fix-soon items applied:
  - Register `<select>` + `<textarea>` `rounded-md` → `rounded-xs` (matches xs theme radius). `<textarea>` swapped for shadcn `<Textarea>`.
  - Reset-password "Link expired" CTA: `variant="ghost"` → default (primary CTA hierarchy consistency).
  - Phone helper text trimmed: 3 sentences → 1.
- **Lint cleanup (3 pre-existing warnings).** `courses-view-switcher.tsx` — moved `eslint-disable-next-line` from `setHydrated` (false-positive suppression) to `setView` (the actual triggering call). `admin-students.spec.ts` — dropped unused `browserName` and `browser` parameters from a skipped test. **Lint now actually clean.**
- **Phase 3 retrospective written** in `docs/RETROSPECTIVES.md`. 48 pts / 18.0 hrs / **0.38 hrs/pt** — on V1 baseline, slower than Phase 2 due to many small tasks plus 3.11 OAuth scope-creep. Velocity table in PROJECT_PLAN.md updated. Forecast for V2: behind plan unless velocity recovers to Phase 2 pace; cuttable list (~22 pts) is a release valve.
- **4.10 added to plan** (1 pt) — recreate `.claude/agents/ui-reviewer.md` from BRAND.md + retro context. To be done before 4.9. Phase 4 total 42 → 43.
- Test comment fix at `tests/auth-email-verification.spec.ts:25-26` (stale "Supabase rejects" comment after the new server-side mirror) — caught in code review of `984f72a`.
- Build green. tsc clean. Lint clean. pgTAP 120/120. Auth Playwright stack 35/35 desktop after polish.
- Commits: `984f72a` (3.14 close — polish + retro + UI fixes + lint cleanup).

**In Progress:** Nothing.

**Blocked:** Twilio Toll-Free Verification still pending (carryover from session 102).

**Next Steps:**
1. **Phase 4 kickoff.** Pick from 4.2 (admin/users consolidation, 8 pts), 4.3 (student profile expansion, 5 pts), 4.6 (instructor notes on sessions, 3 pts), 4.7 (instructor profile expansion, 3 pts), or 4.10 (ui-reviewer recreation, 1 pt).
2. **4.10 recreate `.claude/agents/ui-reviewer.md`** before 4.9 close. Model on `architect.md` / `code-review.md`. Pull brand rules from BRAND.md (Mira/Sky/Mist, Nunito Sans, xs radius, dark-mode-default, mobile@375px). 12-point review checklist + scored output. The stand-in prompt I used in 3.14 is a workable starting point.
3. **Eric is thinking about how test cadence works in `/kill-this`.** pgTAP regression slipped through because only the full Playwright suite is gated, not pgTAP. Open question — Eric is mulling whether `supabase test db` should be added to /kill-this, or whether pgTAP becomes a phase-close gate, or some other shape. Don't act unilaterally.
4. **Pre-existing 4.x bug carryover from session 104:** invited instructors get bounced from `/instructor/dashboard` until JWT refresh — `accept_invite` writes role flag to public.profiles but not auth.users.raw_user_meta_data; proxy reads from JWT meta. Fix: have accept_invite also UPDATE auth.users.raw_user_meta_data + force a session refresh client-side. Natural fit during 4.2 admin/users work.
5. **Carryovers still open:** SMS smoke-test investigation (Twilio logs), cross-file Playwright test isolation hardening (~5–8 pts in Phase 6), DEC-015 cleanup of remaining `updateProfile` / `updateUserProfile`, `useTransientSuccess` hook extraction (now 4 forms).
6. **Manual smoke of 3.10 + 3.11** still deferred. Register a fresh email user (Mailpit confirmation), then a fresh Google OAuth user, verify both end up with proper profiles.

**Context:**
- **`validatePassword` is the single source of truth for our password policy.** Length + lower + upper + digit. Mirrors Supabase config.toml (`minimum_password_length = 12`, `password_requirements = lower_upper_letters_digits`). If config.toml changes, update this file too. Both the function and `friendlyPasswordError` have header comments calling out the duplication for future-you.
- **Defense-in-depth pattern for password validation:** client `minLength` (HTML5) → server `validatePassword` (our regex) → Supabase Auth (their enforcement). Three layers; client and server agree, Supabase as backstop. `friendlyPasswordError` translates Supabase's verbose copy to ours when Supabase actually trips.
- **The `@ui-reviewer` agent was never committed to git.** It lived only in `~/.claude/agents/` (user-level) and got wiped in the Phase 7 dev-box move. Same risk applies to anything else that lives in user-level agent / skill / memory dirs — the new SailBook skills survived because Eric explicitly moved them into `.claude/skills/` (per session 101). Anything still at user level is a single-machine accident waiting to happen. Worth a sweep of `~/.claude/agents/` for surviving SailBook-specific specs and committing them.
- **Phase 3 done, Phase 4 starts cleanly.** No mid-phase carryover this time — every 3.x task is checked. The pre-existing invited-instructor bug surfaced in 3.11 is filed as a 4.x carryover (next-step #4) but is genuinely Phase 4 territory (touches the invite flow).
- **Velocity reality check:** Phase 3 came in at 0.38 hrs/pt, on the V1 baseline. Forecast at this pace is ~47 hrs of remaining Phase 4–6 work in 16 days. At 8 hrs/week sustainable that's 5.8 weeks — over budget by ~3.5 weeks. Three options: cut tasks (cuttable list covers 22 pts), recover Phase-2 pace (0.22 hrs/pt → 27 hrs → fits), or extend the deadline. Re-baseline at Phase 4 close (per the retro's recommendation).
- **pgTAP testing-cadence gap.** The /kill-this skill gates `npm run build` and asks about full Playwright suite, but doesn't run pgTAP. Trigger and RLS-touching commits in 3.11 / 3.13 / 3.14 silently regressed `08_admin_students.sql` until Eric ran `supabase test db` manually. Eric is thinking about the right shape for this — flagged in next-steps #3.

**Code Review:** 8 advisory items, 0 blocking. (Findings via @code-review against `984f72a`, plus pgTAP regression caught manually.)
1. **bug** (fixed this session) `supabase/tests/08_admin_students.sql` — pgTAP regression introduced silently in 3.11 trigger work. Tests 1, 3, 9 failed because the new `handle_new_user` trigger inserts a baseline profile before the test's explicit INSERT could land. Fixed by switching the test's INSERT → UPSERT (mirrors production `createStudent` flow). pgTAP 120/120 now green.
2. **cleanup** (fixed this session) `tests/auth-email-verification.spec.ts:25-26` — stale comment "Server returns Supabase's policy error verbatim" no longer accurate. Updated to reflect the validatePassword mirror.
3. **cleanup** Mixed-shape returns across `actions.ts` are intentional per DEC-015 (form vs. button). Worth noting but no fix.
4. **cleanup** `password-rules.ts:40` regex coverage adequate for current policy (`lower_upper_letters_digits`). Future `_symbols` expansion will need a third branch. Future-self problem.
5. **cleanup** Magic string `'lower_upper_letters_digits'` in config.toml ↔ regex set in password-rules.ts can drift. Header comments document the link; leave for now.
6. **cleanup** Native `<select>` styling is browser lottery regardless of radius. Real fix is shadcn `<Select>`; flagged for future polish. Not urgent.
7. **cleanup** Hydration concern in register-form was unfounded — `useState('')` defaults match SSR HTML. Verified safe.
8. **cleanup** `noValidate` cascade — no tests rely on HTML5 validity assertions. Safe.

## Session 105 — 2026-04-29 04:37–12:35 (2.00 hrs active; long wall-clock window with parallel work)
**Duration:** 2.00 hrs | **Points:** 4 (3.13: 1, 3.15: 3)
**Task:** Phase 3.13 (Twilio/Resend README) + Phase 3.15 (logged-in password change) + session 104 carryovers (open-redirect Host fix, safeNextPath extraction). Parallel thread: mobile/Tailscale access fix.

**Completed:**
- **3.13 — Twilio/Resend README (1 pt).** `README.md` gains three sections: Twilio Setup (env vars, Toll-Free Verification gate explained as the carrier-path blocker that silently filters traffic until verified), Resend Setup (env var, sailbook.live domain verification flow, FROM_DEFAULT location in code, note that Supabase Auth emails go through SMTP not this code path), and a unified Notifications gating section (`NOTIFICATIONS_ENABLED`, mock buffer at `/api/test/notifications`, no-op behavior when keys are missing).
- **3.15 — Logged-in password change (3 pts).** New `/account/password` route, role-agnostic, accessible to any authenticated user.
  - `src/app/(auth)/actions.ts` — new `changePassword` action. DEC-015 shape (`Promise<string | null>`). Validates fields present, new === confirm, length ≥ 12. Re-authenticates via `signInWithPassword(user.email, current)` before calling `updateUser({ password: new })`. Forwards Supabase's password-policy error verbatim.
  - `src/components/auth/change-password-form.tsx` — three-field client form (current / new / confirm). Reuses the established transient-success effect pattern (DEC-015 + ref + pending → idle transition). Auto-clears all three fields via `formRef.reset()` on success transition.
  - `src/app/account/password/page.tsx` — server page, redirects unauthenticated to `/login?next=/account/password`. Computes role-aware "Back to dashboard" link from user_metadata.
  - "Change password" link added to all 3 desktop sidebars + 3 mobile drawers in the existing user/sign-out footer block.
  - `tests/auth-password-change.spec.ts` — 5 desktop tests: signed-out redirect, happy path (change → sign out → sign in with new), old-password-rejected-after-change, wrong current password, mismatched new+confirm.
- **3.12 carryovers (next-step #2 + #7 from session 104):**
  - `src/app/auth/callback/route.ts` — **Host header allow-list.** Only localhost / 127.0.0.1 (any port) and the canonical `NEXT_PUBLIC_SITE_URL` host are honored; spoofed Host falls back to `NEXT_PUBLIC_SITE_URL` instead of becoming an open-redirect surface. **NOTE:** dev server on this box has been observed to serve cached old `/auth/callback` code (same as session 104). The fix is on disk; will go live on next dev-server restart.
  - `src/lib/auth/safe-next.ts` — extracted `safeNextPath()` helper. Applied at all 6 redirect-guard sites (login/register actions, signInWithGoogle, login + register pages, callback). **Closes the backslash bypass** (/\evil.com → browser parses as //evil.com) flagged in session 103 code review #4.
- **Test fix:** `tests/payment-e2e.spec.ts:113` was hitting `NEXT_PUBLIC_SITE_URL` for the webhook POST, but on the Hetzner box that points at a laptop-side forwarded port (`:55934`) the test runner can't reach. Hard-coded `localhost:3000`. The 3 failures in the full-suite run earlier were all this same root cause across viewports.
- **Parallel thread (different session, bundled into the same commit):**
  - `next.config.ts` — added `sailbook-dev` + `100.118.147.49` to `allowedDevOrigins` and `serverActions.allowedOrigins`. Phone clicks were dead because hydration silently failed when Next blocked dev assets from the Tailscale origin. Native `<select>` worked because no React event handler. Diagnostic shortcut in memory now: native vs Radix A/B test on phone → if native works and Radix doesn't, check `next.config.ts` allowlists.
  - `src/app/layout.tsx` — viewport meta export added (was missing entirely; would have caused subtle Android touch-coordinate / scaling issues even after the allowlist fix).
  - `~/.tmux.conf` (off-repo, on Hetzner box) — `mouse on` + `history-limit 10000` so Termius two-finger swipe scrolls tmux scrollback.
  - `docs/HETZNER_DEV.md` — Mobile access (Termius + tmux) section, troubleshooting entry for the `allowedDevOrigins` hydration-failure symptom, `tailscale up` correction (no `--ssh` flag — that breaks Termius mobile auth).
  - `docs/PROJECT_PLAN.md` — new task **6.18 — CI + iOS testing (5 pts)**. Triggered by today's bug class: desktop tests didn't catch a phone-only failure. Phase 6 total 56 → 61 pts.
  - Memory: 3 new entries in `hetzner_box_quirks.md` — allowedDevOrigins requirement, Tailscale-SSH/Termius conflict, tmux config.
- **Targeted runs (all green this session):**
  - `auth-password-change.spec.ts`: 5/5 desktop
  - `auth.spec.ts` + `auth-oauth.spec.ts` + `auth-email-verification.spec.ts` + `codes.spec.ts`: 69/69
  - `payment-e2e.spec.ts` + `auth-oauth.spec.ts` + `auth-email-verification.spec.ts`: 33/33 (post-fix re-run)
- **Full suite at session start:** 388 passed / 3 failed (the payment-e2e bug, root-caused and fixed mid-session). **Not re-run after fix** — deferred to 3.14 phase close.
- Build green. tsc clean. Lint clean (3 pre-existing warnings, none from this work).
- Commit `e212ee1`. 22 files, +546 / -82.

**In Progress:** Nothing.

**Blocked:**
- Twilio Toll-Free Verification still pending (carryover from session 102).

**Next Steps:**
1. **Re-run full Playwright suite** — not done after the post-suite changes; should be the first thing in 3.14 phase close.
2. **Restart the dev server before browser-testing /auth/callback** — it has been serving cached old code on this box. The Host allow-list and safeNextPath changes land on next restart.
3. **Code review the 3.13/3.15/carryover commit (`e212ee1`).** /kill-this ran the @code-review agent against HEAD but it returned with an Anthropic-side quota message ("You're out of extra usage · resets 3:20pm UTC") and no findings surfaced. Re-run the review at session 106 start.
4. **3.14 — Phase 3 close (5 pts).** End-of-phase @ui-reviewer pass, lint clean (the 3 pre-existing warnings should be cleaned up), all tests green, all code review resolved, retrospective, archive session log. Polish backlog already in the plan row: noValidate on auth forms, preserve form values on validation failure, friendly password-policy error copy, register-flow UX review.
5. **Carryovers from session 104, still open:**
   - Manual smoke of email/password registration (~5 min)
   - Manual smoke of fresh Google OAuth (~5 min)
   - File pre-existing 4.x bug: invited instructors bounced from `/instructor/dashboard` until JWT refresh (`accept_invite` writes role flag to profiles, not auth metadata)
   - Role-flag spoof surface in `register()` (defense-in-depth, hardening task)
   - Code review cleanup: extract `PASSWORD_RULES_HELP` constant — duplicated yet again in `change-password-form.tsx` (3.10 code review #2 still open).
6. **Carryovers from session 102:** SMS smoke-test investigation, cross-file Playwright isolation hardening, DEC-015 cleanup of remaining `updateProfile` / `updateUserProfile`, `useTransientSuccess` hook extraction (now 4 forms duplicate it).

**Context:**
- **`changePassword` re-auth pattern.** `signInWithPassword(user.email, current)` is the verification step. On success it rotates the session — same user, fresh tokens — and we then call `updateUser({ password })` against that fresh session. Wrong current password fails the re-auth step and we return early before the password update. This is simpler and gives clearer error messages than flipping `secure_password_change = true` in `config.toml` (which gates `updateUser` on session age — UX-heavy).
- **`safeNextPath` rejects four shapes:** null/empty/non-string, no leading `/`, protocol-relative (`//evil.com`), and backslash-prefixed (`/\evil.com` — browsers parse `\` as `/`). The 5th case (URL-parsing-based same-origin check) is more robust but unnecessary at our threat model — all 4 prefix-string rejections are deterministic and fast.
- **`/auth/callback` Host allow-list logic.** `hostHeader === siteHost || /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(hostHeader)`. In production sailbook.live → Host matches siteHost → use Host (so `x-forwarded-proto` from Vercel/CloudFlare wins for https). In dev on Hetzner, Host is `localhost:3000` (Playwright) or `localhost:55934` (Eric's VS Code Remote-SSH tunnel) — both match the localhost regex. Anything else → fall back to `NEXT_PUBLIC_SITE_URL`.
- **Mobile diagnostic from parallel thread.** "Phone clicks dead but native HTML works" → check `next.config.ts` `allowedDevOrigins` first. The signature: hydration silently fails (no console error) when dev assets are blocked, leaving server-rendered HTML and native elements working but every React `onClick` dead. Burned an hour chasing Radix Select fixes before realizing this. Saved as memory.
- **8-hour wall-clock duration spans both threads.** Parallel session was working concurrently for much of this window; "8 hours of effort" overstates Eric's active dev time on this thread. 4 pts of plan-table tasks completed; the open-redirect + safeNextPath carryovers (~2 pts of real work) and the parallel-thread mobile fix (~3-5 pts of real work) are not in the plan table and don't tally. Velocity for this session will look bad as a result — flag for the retrospective at 3.14.
- **Repo git config still missing on Hetzner box.** Used the same one-off `mobiustripper42 / mobius5kcrypto@gmail.com` flags as session 103. Phase 7 dev-tooling script is the right place to fix this — open follow-up.

**Code Review:** Deferred to next session per Eric's call. The /kill-this @code-review agent run completed but returned an Anthropic-side quota message ("You're out of extra usage · resets 3:20pm UTC") with no findings; the actual review of `e212ee1` is queued as next-step #3.

## Session 104 — 2026-04-28 14:58 → 2026-04-29 04:05 (3.25 hrs across two sittings)
**Duration:** 3.25 hrs (sitting 1: 14:58–15:30 = 0.5 hrs · sitting 2: 01:25–04:05 = 2.75 hrs) | **Points:** 5 (3.12: 3, 3.11: 2 [scored 2 — see Estimation Note])
**Task:** Phase 3.12 Security audit + Phase 3.11 OAuth login (Google) + handle_new_user trigger

**⚠ TOP REMINDER FOR NEXT SESSION:**
1. **Eric did NOT run the full Playwright suite this session.** Run `npx playwright test` first thing. Some specs that touch /login or /register may have shifted with the Suspense + GoogleSignInButton refactor; only auth.spec.ts / codes.spec.ts / auth-email-verification.spec.ts / auth-oauth.spec.ts / password-reset.spec.ts / admin-students.spec.ts were verified.
2. **Open-redirect regression in /auth/callback (introduced this session).** Fix: validate Host header against an allow-list before using as redirect base, fall back to url.origin. ~1 pt.

**Completed:**
- **3.12 — Security audit (3 pts).** /security-review against Phase 3 surface (auth, notifications, test routes, RLS migration, cron, email template). Zero qualifying findings at >80% confidence. Excluded items: instructor_notes length cap, backslash in /auth/callback `next`, listUsers page truncation in dev-only test route, JSONB shape validation absence — noted but excluded by review rules.
- **3.11 — OAuth login (Google) — original estimate 2, effective scope 5.** Files:
  - `supabase/migrations/20260429020252_handle_new_user_trigger.sql` — SECURITY DEFINER trigger on auth.users insert. Reads first_name/last_name (email path) or full_name/name (Google path, splits on first space) or given_name/family_name (other OIDC providers). Inserts profile row, ON CONFLICT DO NOTHING. Also stamps role flag defaults (is_admin/is_instructor/is_student) into auth.users.raw_user_meta_data via `||` merge so proxy.ts reads them from the JWT.
  - `supabase/config.toml` — `[auth.external.google]` block, env-referenced credentials. site_url aligned to localhost (was 127.0.0.1). additional_redirect_urls globbed `http://localhost:*/auth/callback` and `127.0.0.1:*/auth/callback` so any VS Code Remote-SSH-forwarded port works.
  - `supabase/.env` (gitignored) — Google OAuth client ID + secret. Supabase CLI auto-loads; .env.local is Next.js-only and not read.
  - `src/app/(auth)/actions.ts` — register() now stuffs all profile fields into options.data (trigger handles the insert; service-role adminClient insert from 3.10 removed). New signInWithGoogle action with `next` open-redirect guard. login() also honors `next` for round-trips.
  - `src/components/auth/google-sign-in-button.tsx` — Client Component, useActionState wrapper around signInWithGoogle, brand-colored Google SVG, hidden `next` field.
  - `src/app/(auth)/login/page.tsx` + `register/page.tsx` + `register-form.tsx` — Continue with Google button + divider, hidden next field, useSearchParams for next param. Suspense boundaries on both pages for build-time bailout.
  - `src/app/auth/callback/route.ts` — redirects now use Host header (with x-forwarded-proto fallback) to round-trip correctly through VS Code Remote-SSH port forwarding (Eric's :55934 ≠ Hetzner's :3000). Open-redirect surface — see top reminder.
  - `src/app/invite/instructor/[token]/page.tsx` — Sign in / Create account links pass `?next=/invite/instructor/<token>` so OAuth users return to the invite page.
  - `src/actions/profiles.ts` — admin createStudent: `.insert` → `.upsert` (trigger fires first, this overwrites with rich data + auth_source='admin_created').
  - `supabase/seed.sql` — profile INSERT switched to ON CONFLICT (id) DO UPDATE for trigger compatibility.
  - `tests/auth-oauth.spec.ts` — 6 desktop tests: button rendering on /login + /register, instructor invite link shape, login ?next= hidden field, ?next= open-redirect rejection, handle_new_user trigger creates profile.
  - `tests/codes.spec.ts` — admin-student-edit test patched to use getByRole('button', { name: 'Sign in' }) instead of brittle `button[type="submit"]` (login page now has 2 submit buttons).
- **Pre-Launch Checklist** in PROJECT_PLAN.md gains a line for the production Google OAuth provider config (Dashboard + Google Cloud Console redirect URIs).
- **Memory:** `~/.claude/projects/-home-eric-sailbook/memory/hetzner_box_quirks.md` — `supabase stop` requires `--project-id sailbook`; VS Code Remote-SSH forwards Hetzner ports to random local ports, NEXT_PUBLIC_SITE_URL must match the browser-facing port.
- **Targeted runs (all green):**
  - `auth-oauth.spec.ts`: 6/6 desktop
  - `auth-email-verification.spec.ts`: 5/5 desktop
  - `auth.spec.ts`: 24/24 across 3 viewports
  - `codes.spec.ts`: 9/9 across 3 viewports (verified after seed-password ripple)
  - `password-reset.spec.ts`: 18/18 across 3 viewports
  - `admin-students.spec.ts`: 11+ verified pass
- Build green. tsc clean. Lint clean.
- Commits: `befedcd` (session 103 close-out), `9233595` (3.12), `8d4451f` (3.11).

**In Progress:** Nothing. Manual smoke of email/password registration via the new trigger path was NOT done this session (only OAuth was smoke-tested).

**Blocked:**
- Twilio Toll-Free Verification still pending (3.5/3.6/3.7 SMS prod smoke-test failure carryover from session 102).

**Next Steps:**
1. **Run full Playwright suite** (`npx playwright test`) — top reminder, see above.
2. **Fix the open-redirect surface in /auth/callback** — validate Host header against a small allow-list (NEXT_PUBLIC_SITE_URL host + localhost any port for dev) before using as redirect base, fall back to url.origin on mismatch. ~1 pt. Captured in code review #1.
3. **Manual smoke of email/password registration** — via the new trigger path (3.10's adminClient insert removed). Register a fresh email user, confirm via Mailpit, verify profile row + role flags. ~5 min.
4. **Manual smoke of fresh Google OAuth (post-trigger fix)** — db reset, sign in, verify name extraction populates first_name/last_name correctly on first try (today we patched the live profile manually).
5. **Pre-existing bug exposed by 3.11: invited instructors get bounced.** `accept_invite` RPC writes `is_instructor=true` to public.profiles but does NOT touch auth.users.raw_user_meta_data. The proxy reads from JWT metadata, so an invited instructor sees /instructor/dashboard bounce them back until token refresh (~1 hour). Fix: have accept_invite also UPDATE auth.users.raw_user_meta_data and prompt a session refresh client-side. File as a 4.x bug. Captured in code review #3.
6. **Pre-existing role-flag spoof surface (low risk, follow-up).** `register()` server action takes `is_admin` etc. from form data via options.data. Hand-crafted client could submit `is_admin: true`. Today the form doesn't expose those fields, but defense-in-depth: trigger or post-insert step should force `is_admin = is_instructor = false` for self-registered users. Captured in code review #2.
7. **Extract a shared `safeNextPath()` helper.** Open-redirect guard `nextRaw.startsWith('/') && !nextRaw.startsWith('//')` duplicated in 5 places (login/register actions, callback route, login/register pages). Code review #4. ~1 pt.
8. **Carryover next-steps from sessions 102–103:** SMS smoke-test investigation, cross-file Playwright test isolation, DEC-015 cleanup of remaining profile actions, useTransientSuccess hook extraction.
9. **3.13 — README docs for Twilio/Resend** (1 pt) or **3.14 — phase close** (5 pts).

**Estimation Note (standing disagreement):**
- 3.11 was scored 2 pts. Actual scope was closer to 5: trigger refactor that touched 4 auth paths, seed compat, config.toml provider block + env file resolution, host-header callback fix, Google name-key surprise (`name`/`full_name` vs `given_name`/`family_name`), proxy role-flag mismatch on OAuth users, VS Code Remote-SSH port-forwarding rabbit hole. Eric flagged he had an instinct to push back and didn't. **Lesson:** "OAuth login Google" looks like a config flip but is actually an end-to-end auth integration. Future estimates of provider integrations should default to 5+ unless the pattern is already established. Logging the 2 pts as scored (not retroactively bumped — tracking accuracy) but adding to standing disagreements.

**Context:**
- **`handle_new_user` trigger is now the single source of truth for profile creation.** All three auth paths (email/password signUp, Google OAuth, admin createStudent) flow through it. Email/password supplies first_name/last_name + phone/experience/instructor_notes via `signUp({ options: { data: ... } })`. Google supplies `full_name` / `name` (NOT given_name/family_name as I initially assumed) — split on first space. Admin createStudent sets minimal user_metadata, then upserts the rich profile (phone, asa_number, auth_source='admin_created') after the trigger inserts the baseline.
- **Trigger also stamps role-flag defaults into auth.users.raw_user_meta_data** so proxy.ts can read from the JWT. The `||` merge puts existing keys on top — email/password signUp's options.data wins, Google's empty case gets defaults filled in. PRE-EXISTING SPOOF: client-side options.data is trusted; should harden in a follow-up.
- **VS Code Remote-SSH forwards Hetzner ports to random local ports.** NEXT_PUBLIC_SITE_URL needs to match the browser-facing port, not Hetzner's :3000. The /auth/callback route now reads the Host header for the redirect base — works for both Eric's :55934 and Playwright's :3000. The catch: trusting Host is an open-redirect surface. Next session priority.
- **Supabase CLI reads from `supabase/.env`, NOT `.env.local`.** `.env.local` is Next.js-only. Existing `env(SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN)` references in config.toml were dormant — local Supabase doesn't actually use them. New `[auth.external.google]` references env vars that have to live in `supabase/.env` (gitignored).
- **`supabase stop` on this Hetzner box requires `--project-id sailbook`** — bare form is a no-op or errors. Saved to memory; tooling-script TODO to fix in dev-tooling automation.
- **Supabase auth panel does NOT sync from config.toml on remote.** [auth.external.google] block is local-dev only; production needs Dashboard config (already in Pre-Launch Checklist).
- **Hot-reload misfire on Hetzner.** During this session the dev server stopped picking up edits to /auth/callback after a few iterations — `touch`-ing the file forced re-compile. Eric may want to add a watch-mode sanity check or restart between iterations when state gets weird.
- **Mailpit replaces Inbucket as Supabase's local mailcatcher** at http://127.0.0.1:54324. Same role; URL is different from older docs.
- **Cookies + ports.** Supabase session cookies were set on the browser-facing host (:55934) during /auth/callback. Cross-port cookies on localhost are domain-wide (browsers treat localhost without port as one origin for cookie purposes). No bug here, just worth knowing if a future change moves to a non-localhost host.

**Code Review:** 8 advisory items, 0 blocking. (Findings via @code-review against 8d4451f.)
1. **bug** `auth/callback/route.ts:19-23` — Host header trust = open-redirect surface. Fix: allow-list. Captured as next-steps #2.
2. **security** Trigger `||` merge accepts client-supplied is_admin/is_instructor in user_metadata. Pre-existing in register() flow; should harden. Next-steps #6.
3. **bug (pre-existing)** Proxy reads role flags from JWT meta, but accept_invite writes only to profiles. Invited instructors bounced from /instructor/dashboard until token refresh. Next-steps #5.
4. **consistency** `next` open-redirect guard duplicated in 5 places — extract `safeNextPath()`. Next-steps #7.
5. **cleanup** Trigger's last_name split logic readable but fragile (`NULLIF(NULLIF(SUBSTRING(...), v_full), '')`). Rewrite as CASE expression.
6. **cleanup** profiles.ts upsert depends on the trigger having inserted. Comment is good; no action.
7. **cleanup** seed.sql ON CONFLICT DO UPDATE preserves seed determinism. Confirmed safe; no action.
8. **cleanup** Suspense boundary placement on /login + /register correct. No action.

## Session 103 — 2026-04-27 10:51–11:39 (0.83 hrs)
**Duration:** 0.83 hrs | **Points:** 3 (3.10: 3)
**Task:** Phase 3.10 — Password strength + email verification

**⚠ TOP REMINDER FOR NEXT SESSION:**
**Manual smoke test was NOT performed this session.** Eric stopped before exercising the new register → email confirm → login flow in a real browser. Before doing anything else next session: spin up dev, register a new user, find the confirmation email in Mailpit (http://127.0.0.1:54324), click the link, verify landing on /student/dashboard. If it breaks, code review's `cleanup #1` (rollback auth user on profile-insert failure) becomes load-bearing.

**Completed:**
- **Password policy.** `supabase/config.toml`: `minimum_password_length = 12`, `password_requirements = "lower_upper_letters_digits"`. `minLength={12}` + helper text on register and reset-password forms.
- **Email verification (local).** `enable_confirmations = true`. New `src/app/auth/callback/route.ts` exchanges code → session, sanitizes `next` against open-redirect, falls back to `/login?error=...`. New `src/app/(auth)/register/check-email/page.tsx` landing. Register action in `src/app/(auth)/actions.ts` switches profile insert to `adminClient` (signUp returns no session with confirmations on — same pattern as admin-created students). Redirects to `/register/check-email?email=...`. `src/proxy.ts` adds `/auth/` as a public prefix.
- **Custom email template.** `supabase/templates/confirmation.html` — SailBook-branded, Sky/Mist palette, inline-styled (email clients), wired via `[auth.email.template.confirmation]`.
- **Resend SMTP stub.** Commented `[auth.email.smtp]` block in config.toml pointing at `smtp.resend.com:587` with a comment that auth panel doesn't sync from config.toml — production wires in the Supabase Dashboard.
- **Seed password rotated** `qwert12345` → `Sailbook12345` across 7 canonical files: `supabase/seed.sql`, `src/components/dev-login-helper.tsx`, `src/app/dev/page.tsx`, `tests/helpers.ts`, `tests/auth.spec.ts`, `tests/codes.spec.ts`, `docs/QA.md`. Historical archives left alone.
- **Pre-Launch Checklist** in `docs/PROJECT_PLAN.md` gains five lines for remote auth-config rollout (enable_confirmations, custom SMTP, template upload, password policy, Site URL + Redirect URLs — all Dashboard-only).
- **Test API.** New `src/app/api/test/confirm-email/route.ts` (devOnly-gated) force-confirms a user via the admin API so specs can simulate clicking the confirmation link without scraping Mailpit.
- **Tests.** `tests/auth-email-verification.spec.ts` — 5 desktop tests: rejects password missing required character classes, valid registration lands on check-email, unconfirmed user gated from login until force-confirmed, callback with missing code → /login?error=missing_code, callback with invalid code → /login?error=invalid_link.
- **Targeted runs (all green):**
  - `auth-email-verification.spec.ts`: 5/5 desktop
  - `auth.spec.ts`: 36/36 across 3 viewports (verifies new seed password works)
  - `codes.spec.ts`: 9/9 across 3 viewports (uses new seed password)
  - `password-reset.spec.ts`: 18/18 across 3 viewports
- Build green. tsc clean. Lint clean.
- Commit `02305b9`.

**In Progress:** Nothing.

**Blocked:**
- 3.5/3.6/3.7 SMS smoke-test failure carryover from session 102 — Twilio Toll-Free Verification still pending; need to pull Twilio logs.
- Remote rollout of email confirmations + SMTP wiring + template upload — all listed in Pre-Launch Checklist for the deploy session.

**Next Steps:**
1. **Manual smoke test of 3.10 in a browser** (top reminder above). Register a new user, find the confirmation email in Mailpit, click the link, verify dashboard landing. Test path: http://localhost:3000/register → submit → /register/check-email → http://127.0.0.1:54324 → click confirm link → /auth/callback → /student/dashboard.
2. Carry forward from session 102: investigate 3.5/3.6/3.7 SMS smoke-test failure (Twilio logs).
3. Carry forward from session 102: cross-file Playwright test isolation hardening (~5–8 pts, Phase 6).
4. Carry forward from session 102: DEC-015 cleanup of `updateProfile` + `updateUserProfile` (~1 pt).
5. Carry forward from session 102: extract `useTransientSuccess(pending, state)` hook (~1 pt).
6. Code review cleanup #1 (rollback auth user on profile-insert failure in `register()`) becomes higher priority if step 1 reveals the broken-state path is reachable. ~1 pt.
7. Code review cleanup #2 (extract `PASSWORD_RULES_HELP` constant — duplicated in register-form.tsx, reset-password/page.tsx, config.toml). ~1 pt.
8. **3.11 — OAuth login (Google), 2 pts.** Or 3.12 — Security audit, 3 pts. Both are still in Phase 3.

**Context:**
- **adminClient on register is the right call.** With `enable_confirmations = true`, `signUp` does NOT create a session, so the user has no auth context to satisfy RLS on the profiles insert. Service-role bypass mirrors the admin-created-student pattern in `src/actions/profiles.ts` (around line 175). Code review confirmed no new exposure: role flags are hardcoded server-side, only the just-created `data.user.id` is touched.
- **Supabase auth panel does NOT sync from config.toml on remote.** `supabase config push` syncs project settings but the Authentication panel (providers, email templates, SMTP, password policy, URL configuration) is Dashboard-only. Captured in five Pre-Launch Checklist lines so the prod rollout is explicit.
- **Seed password (`Sailbook12345`) bypasses Supabase's password policy.** Supabase enforces password rules only at the API surface (`signUp`, `updateUser`). Direct `INSERT INTO auth.users (encrypted_password)` via SQL bypasses the check. The new seed password meets the policy regardless, for consistency with what users will see in the register form.
- **Hetzner box has no git identity configured.** The Phase 7 dev tooling script didn't set `user.email` / `user.name`. Worked around with one-off `git -c user.email=... -c user.name=...` flags on this commit (no persistent config change). Add to dev-tooling script or `git config --global` on the box; either is fine. Used `mobiustripper42 / mobius5kcrypto@gmail.com` to match prior history.
- **HTML5 `minLength={12}` blocks short passwords client-side.** Server enforces classes-required policy. Tests verify the *missing-classes* path (server-side) by submitting a 14-char all-lowercase password — HTML5 doesn't catch missing uppercase, so the request hits the server.
- **Mailpit is at http://127.0.0.1:54324 on this box.** Replaces Inbucket (older Supabase CLI versions); same role.
- **Co-author tag in this repo is `Claude Opus 4.7 (1M context)`** matching the three prior commits — the kill-this skill template still says "Sonnet 4.6" but the repo convention is Opus 4.7. Worth a one-line fix to `.claude/skills/kill-this/SKILL.md` if you want consistency with the actual tooling.

**Code Review:** 5 advisory cleanups, 0 bugs. (Findings via @code-review against 02305b9.)
1. **consistency** `actions.ts:65` — profile-insert failure leaves orphan `auth.users` row. Same race exists for admin-created students; not new. Either rollback via `admin.deleteUser` on profile error, or document. Captured as next-steps #6.
2. **consistency** Password rules text duplicated in register-form.tsx, reset-password/page.tsx, config.toml. Extract `PASSWORD_RULES_HELP` constant. Captured as next-steps #7.
3. **cleanup** `confirm-email/route.ts:32` — `listUsers({ perPage: 1000 })` silently fails if seed exceeds 1000 users. Iterate pages or add a loud assertion. Local-dev-only, low priority.
4. **cleanup** `auth/callback/route.ts:10` — `next` rejects `//` (good) but not `/\` (backslash). Defense-in-depth: parse with `new URL(...)` and check the origin matches.
5. **cleanup** `proxy.ts` — `/auth/` PUBLIC_PREFIX is broad; only `/auth/callback` exists. Add a comment or be explicit with `/auth/callback`.

## Session 102 — 2026-04-26 20:31–21:46 (1.25 hrs)
**Duration:** 1.25 hrs | **Points:** 2 (3.9: 2)
**Task:** Phase 3.9 — Student notification preferences + DEC-015 migration of updateStudentProfile

**Completed:**
- **DEC-015 pre-work migration of `updateStudentProfile`.**
  - `src/actions/profiles.ts` — return type changed from `Promise<{ error: string | null }>` → `Promise<string | null>` (DEC-015 form-action shape). The lone outlier among student-side form actions; resolved before 3.9 forks the pattern further.
  - `src/components/student/student-account-form.tsx` — reads state directly. "Profile updated." success banner preserved via a transient `pending → idle && state === null` flag. All 4 `instructor-notes.spec.ts` tests still pass against the new shape.
- **Phase 3.9 — Student notification preferences (2 pts).**
  - `src/lib/notifications/preferences.ts` — `STUDENT_GLOBAL_KEY`, `isStudentChannelEnabled(prefs, channel)`, `normalizeStudentPreferences(prefs)`. Same defensive defaults as admin helper (any non-bool / null / missing → enabled).
  - `src/lib/notifications/triggers.ts` — all 4 student fan-outs gated per-channel: `notifyEnrollmentConfirmed`, `notifySessionCancelled`, `notifyMakeupAssigned`, `notifyUpcomingSessionReminders`. Profile selects extended.
  - `src/actions/notification-preferences.ts` — new `updateStudentNotificationPreferences` (DEC-015 shape). **Both admin and student actions now MERGE with existing JSONB instead of replacing**, fixing a latent dual-role bug where saving one role's prefs would erase the other's. New `readExistingPrefs` helper.
  - `src/components/student/notification-preferences-section.tsx` — client form, two checkboxes (SMS / email), same transient success pattern.
  - `src/app/(student)/student/account/page.tsx` — loads `notification_preferences`, mounts new section below the profile form.
  - `src/app/api/test/set-notification-prefs/route.ts` — dev-only test API behind `devOnly()`. Lets dispatcher gating tests set arbitrary prefs without UI navigation.
- **Tests** — `tests/student-notification-preferences.spec.ts`. 5 desktop tests: section renders, save+reload persist, SMS-off → email only, email-off → SMS only, both-off → no student notifications. **First automated coverage of the channel-suppression dispatcher path** — possible because Eric flipped `NOTIFICATIONS_ENABLED=false` for this session.
- **Full-suite triage** of 4 failures Eric ran into:
  - `enrollment-hold:115` cron expires holds — flake (3/3 pass isolated). Parallel-load.
  - `enrollment-notifications:17` 3.4 — flake (3/3 pass isolated). Mock buffer cross-spec contention.
  - `instructor-notes:26` update name — flake (3/3 pass isolated). `pw_student` profile contention.
  - `member-pricing:52` strikethrough — flake (passes when full file runs serial). Inter-test dependency on `is_member` flag set in prior test of the same describe; cross-spec parallel writes to `pw_student.is_member` race against it.
  - **All four are pre-existing test-isolation issues, not regressions from today.** Captured in next steps as a Phase 6 hardening task.
- Commit `ef82ac6`.

**In Progress:** Nothing.

**Blocked:**
- 3.5/3.6/3.7 SMS production smoke test failure — Eric reported: 3.4 SMS+email worked, 3.5/3.6/3.7 email worked but SMS did not. Punted to next session per Eric. Possible causes: Twilio toll-free unverified rate limit, content filter on body (URLs / STOP disclosure), template-specific encoding. Need to check Twilio logs with the actual rejected message SIDs.
- Twilio Toll-Free Verification still pending submission/approval.
- Parallel CC running session 101 (Phase 7 — Hetzner remote dev). Independent.

**Next Steps:**
1. **Investigate 3.5/3.6/3.7 SMS smoke-test failure (Eric's first thing).** Pull Twilio logs for the failed message SIDs from this evening's smoke-test run to see actual rejection reason. Hypotheses to check first: (a) toll-free unverified content filter on URL or "STOP" string, (b) GSM-7 vs UCS-2 segment encoding, (c) per-recipient throttle. 3.4 worked, so account/number basics are fine — it's content-shape specific.
2. **Cross-file Playwright test isolation hardening (Phase 6 task, ~5–8 pts).** Tests collide on shared seed users (`pw_student` mostly) and the module-level mock buffer. Recommended fixes: (a) mock-buffer specs should scope assertions by `runId()` substrings so cross-spec dirtying doesn't cause false positives; (b) `is_member`-mutating tests should use a dedicated alt user (e.g. `pw_student2`); (c) `member-pricing.spec.ts` afterAll should verify reset; (d) consider a per-test transactional fixture if the pattern keeps biting. **Race tests will keep coming up as more concurrent-write features ship — worth investing.**
3. Code review cleanup: `updateProfile` + `updateUserProfile` in `src/actions/profiles.ts` still use `{ error }` shape — DEC-015 cleanup task, ~1 pt. Slot before any admin-form change.
4. Code review cleanup: `useTransientSuccess(pending, state)` hook to dedupe the pending-transition pattern now duplicated across 3 forms (admin notif, student profile, student notif). ~1 pt.
5. **3.10 — Password strength + email verification (3 pts).** Now unblocked since Resend is live (Eric did Phase 3.2 in session 95+) and `NOTIFICATIONS_ENABLED` is back to false-for-tests. Custom email template via Resend, Supabase Auth password requirements config.
6. `supabase db push` to remote — confirm `20260426232739_admin_notification_preferences.sql` is on remote (Eric pushed at start of session 100; this session's 3.9 reuses the existing column so no new migration needed).

**Context:**
- **Latent dual-role JSONB-clobber bug fixed in session 102.** Admin AND student actions both wrote `notification_preferences` by replacing the whole object. Profiles can be `is_admin && is_student` (1.13 dual-role pattern). Saving one role's prefs would silently erase the other's. New shallow-merge pattern via `readExistingPrefs` keeps both intact. Read-modify-write race window exists in theory; acceptable for V1 single-user single-form.
- **Shallow merge depth is load-bearing.** Top-level keys (`admin_enrollment_alert`, `admin_low_enrollment`, `student_global`) are disjoint, so `{ ...existing, ...newBlock }` replaces only the changed block. If a future event nests deeper, the merge silently wipes — comment in the code calls this out.
- **Transient-success pattern.** `useState + useRef + useEffect` to flip a `hasSubmitted` flag on the `pending → idle` transition, then derive `showSuccess` from `hasSubmitted && state === null && !pending`. Survives Strict Mode double-renders (refs persist, effect fires on falling edge). Now duplicated across 3 forms; ripe for extraction into a `useTransientSuccess` hook (next-steps #4).
- **Dispatcher gating tests are flaky against `NOTIFICATIONS_ENABLED=true`.** They use `notify=true` against `/api/test/enroll` — would fire real Twilio/Resend. Tests should add `test.skip(process.env.NOTIFICATIONS_ENABLED === 'true', 'requires mock buffer')` at the top of each gating test (code review flagged; not addressed this session).
- **Cross-spec parallel race patterns are accumulating.** Mock buffer + shared seed user state are concurrent-write hotspots. Workers=4 surfaces the races. Symptom: tests pass in isolation, fail intermittently in full suite. As notifications/preferences/etc. add more shared mutation, this bites harder. Earmarked as a real Phase 6 task (~5–8 pts).
- **Filter SMS test entries by template-specific phrase, not just title.** Student SMS template uses "you're enrolled in {title}"; admin SMS uses "{name} enrolled in {title}". Both contain the title — filtering on `title + "you're enrolled"` disambiguates student vs admin entries in the mock buffer. Discovered while debugging the first-run dispatcher test failure.

**Code Review:** 6 cleanups, 0 bugs. The dual-role JSONB merge fix is the real win.
1. **cleanup** `notification-preferences.ts:17` — `readExistingPrefs` uses `any` for the supabase client param. Adds to existing `project_types_debt` MEMORY. Type as `Awaited<ReturnType<typeof createClient>>` or extract a shared alias.
2. **cleanup** Shallow-merge depth is intentional; comment in code recommends documenting that top-level key disjointness is the load-bearing assumption.
3. **cleanup** `updateProfile` + `updateUserProfile` still on old shape; file a DEC-015 cleanup ticket. (Captured in next steps #3.)
4. **consistency** Read-modify-write race window noted; acceptable for V1, document the assumption in the code.
5. **cleanup** Extract `useTransientSuccess(pending, state)` hook now that 3 forms duplicate the pattern. (Captured in next steps #4.)
6. **consistency** Add `test.skip(process.env.NOTIFICATIONS_ENABLED === 'true')` guard to dispatcher gating tests so a stray env flip doesn't fire real Twilio/Resend.

RLS unchanged — existing self-update policy on `profiles` covers the new column writes. Test API route correctly gated behind `devOnly()`.

## Session 101 — 2026-04-26 20:03 → 2026-04-27 00:30 (~4.5 hrs, exact time TBD)
**Duration:** ~4.5 hrs | **Points:** 18 (7.1: 3, 7.2: 3, 7.3: 3, 7.4: 5, 7.5: 2, 7.6: 2)
**Task:** Phase 7 — Remote Dev Environment. Move dev off the laptop onto a Hetzner Cloud box accessed over Tailscale, edited via VS Code Remote-SSH.

**Completed:**
- **7.1 — Hetzner provisioning.** `hcloud` CLI installed to `~/.local/bin`, ed25519 key `~/.ssh/sailbook_hetzner` generated, project `sailbook` + R/W token configured (token in `~/.config/hcloud/cli.toml`, mode 600, gitignored). SSH key registered as `sailbook-laptop`. Cloud Firewall `sailbook-dev-fw` created with SSH-from-anywhere + ICMP. Server provisioned at `5.161.209.160` after CPX41 turned out to be retired across all locations — landed on **ccx23** (4 dCPU / 16 GB / 160 GB SSD / Ashburn / Ubuntu 24.04, $40/mo). Took 3 placement attempts; Hetzner's "Available: yes" lies during capacity crunches.
- **7.2 — Server hardening + Tailscale.** `scripts/hetzner-bootstrap.sh` (idempotent, two-pass): apt upgrade, sudo user `eric` (passwordless, key-only), 4 GB swap (swappiness=10), ufw default-deny + OpenSSH, fail2ban sshd jail, unattended-upgrades, Tailscale install. Pass 2 (`TAILSCALE_UP=1`) hardens sshd via `/etc/ssh/sshd_config.d/99-sailbook-hardening.conf` (root login + password auth disabled). Hetzner Cloud Firewall stripped to ICMP only — **public port 22 closed**, only the tailnet routes in. Box reachable as `100.118.147.49` / `sailbook-dev` on tailnet.
- **7.3 — Dev tooling.** `scripts/hetzner-dev-tooling.sh` (idempotent): fnm + Node 22.22.2, Docker CE 29.4.1 + Compose 5.1.3 (eric in `docker` group, no sudo needed), Supabase CLI 2.90.0 (matches laptop), gh 2.91.0, Playwright system deps + all 5 browsers (chromium, chromium-headless-shell, firefox, webkit, ffmpeg). Critical fix: symlinks `node`/`npm`/`npx`/`corepack`/`supabase` into `/usr/local/bin` so non-interactive SSH (`ssh host 'cmd'`) finds them — Ubuntu's `.bashrc` early-returns for non-interactive shells, and SSH cmd-exec doesn't source `.profile` either.
- **7.4 — Repo bring-up.** `gh auth login` interactively, repo cloned, `.env.local` scp'd over the tailnet, `supabase start` (15 containers, ~3 min cold), `npm install`, `npx playwright install`. **9/9 tests passed** on `tests/codes.spec.ts`, full pgTAP suite green. Dev URL forwarded to Windows browser through VS Code Remote-SSH later in 7.5.
- **7.5 — VS Code Remote-SSH.** SSH config block added to WSL `~/.ssh/config`. Walked Eric through Windows-side setup: Tailscale for Windows install + tailnet join, Remote-SSH extension, `sailbook_hetzner` key copied to `C:\Users\eric\.ssh\` with `icacls` permissions tightened, host block in `C:\Users\eric\.ssh\config`. Notepad's "save as .txt" gotcha bit; `Move-Item config.txt config -Force` fixed it. End-to-end loop closed: VS Code on Windows edits files on Hetzner over Tailscale, port 3000 auto-forwarded, browser hits Next dev served from Ashburn.
- **7.6 — Document.** `docs/HETZNER_DEV.md` (architecture / daily workflow / pause-stop / first-time-from-new-device / rebuild-from-scratch / troubleshooting). `scripts/hetzner-provision.sh` wraps the initial hcloud calls with retry on placement failure. `scripts/firewall-locked.json` is the post-bootstrap firewall rule set. README pointer added.

**In Progress:** None.

**Blocked:** None.

**Next Steps:**
1. Resume Phase 3.10 (password strength + email verification) on the new remote box. Now unblocked since Resend is live.
2. Carry forward from session 102: investigate 3.5/3.6/3.7 SMS smoke-test failure (Twilio logs).
3. Carry forward from session 102: cross-file Playwright test isolation hardening (~5–8 pts, Phase 6 task).
4. **Snapshot + delete the server** when stepping away for weeks (`hcloud server create-image --type snapshot ...` then `hcloud server delete`). Hetzner bills hourly whether on or off — `poweroff` does NOT save money, my earlier suggestion was wrong. Snapshot-and-delete drops the cost from $40/mo running to ~$2/mo (snapshot only); restore is ~5 min.
5. Update PROJECT_PLAN.md Velocity Tracking table with Phase 7 actuals next time the plan gets a refresh (Phase 7 not on the critical V1 path so the table didn't get a row, but actuals are: 18 pts / ~4.5 hrs / 0.25 hrs/pt).

**Context:**
- **CPX41 is retired everywhere.** Hetzner's listing showed pricing on `cpx41` but `Available: no` in every region. The new generation (`cpx42`) is EU-only. For US, the working 16 GB option is `ccx23` (dedicated vCPU, $40/mo, 160 GB). We had to retry 3x to get capacity even after switching off CPX41.
- **Local Supabase publishable keys are deterministic.** `supabase status -o env` shows the same `sb_publishable_*` and `eyJ...` ANON/SERVICE_ROLE keys on the laptop and the new Hetzner box — `.env.local` Just Works once copied. Earlier confusion came from a sloppy diff that compared two ANON-prefixed lines from the laptop's file.
- **Non-interactive SSH doesn't source shell init files.** `ssh host 'cmd'` runs with `/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin` — neither `.bashrc` (interactive guard returns early) nor `.profile` (login-only) is read. The fix is symlinks into `/usr/local/bin`. Same trap will bite VS Code Remote-SSH bootstrap (it runs commands non-interactively to install its server bits).
- **Tailscale SSH is the auth backstop.** With `tailscale up --ssh`, the box accepts SSH from any tailnet member without keys. When Eric's Windows SSH config was busted (empty `config`, content in `config.txt`), `ssh sailbook-dev hostname` still worked from PowerShell — Tailscale identity was doing the auth. Worth knowing: if you ever brick the SSH key/config story, you can still get in via Tailscale.
- **Hetzner placement reliability is mediocre.** "Available: yes" in `hcloud server-type describe` ≠ guaranteed placement. Both `ccx23` in `ash` and `hil` failed back-to-back during the same minute. `scripts/hetzner-provision.sh` now retries 3x with 30s sleep. For initial provisioning, advise picking a non-peak window.
- **Ubuntu 24.04 base image is missing `unzip`.** fnm's installer needs it. `scripts/hetzner-dev-tooling.sh` step 0 now apt-installs unzip + git + build-essential + pkg-config.
- **Notepad on Windows saves with `.txt` by default** even when you typed `config` as the filename (it appends an extension based on the file type). `Get-ChildItem $HOME\.ssh\` reveals it; `Move-Item` fixes it. Worth a one-liner in HETZNER_DEV.md troubleshooting.
- **Cost reality.** Server is hourly-billed ($0.064/hr ≈ $46/mo at full uptime; "$40/mo" is the listed monthly cap). Leaving it running 24/7 = $40/mo. Powering off when away = ~$20/mo. Deleting the server entirely while keeping the SSH key + firewall = $0 until next provision.
- **Plan renumbering.** Old "Phase 7: Skills & Tracking" pushed to Phase 8 to make room. Summary table updated.

**Code Review:** Skipped — infra/docs only, no app code touched. Two scripts (`hetzner-bootstrap.sh`, `hetzner-dev-tooling.sh`, `hetzner-provision.sh`) are idempotent and were exercised end-to-end during the session.

## Session 100 — 2026-04-26 19:09–20:13 (1.08 hrs)
**Duration:** 1.08 hrs | **Points:** 3 (3.8: 3)
**Task:** Phase 3.8 — Admin notification preferences (settings/UI shift away from triggers)

**Completed:**
- **Phase 3.8 — Admin notification preferences (3 pts).**
  - Migration `20260426232739_admin_notification_preferences.sql` — `notification_preferences jsonb` column on profiles, default NULL, comment documents the shape.
  - `src/lib/notifications/preferences.ts` — `ADMIN_NOTIFICATION_EVENTS` const (`admin_enrollment_alert`, `admin_low_enrollment`), `isAdminChannelEnabled()` (defensive: any non-bool / non-object / null / undefined → enabled), `normalizeAdminPreferences()` for form initial state.
  - `src/lib/notifications/triggers.ts` — admin fan-outs in `notifyEnrollmentConfirmed` and `notifyLowEnrollmentCourses` now read each admin's `notification_preferences` and gate per-channel sends. Profile selects extended to include the column.
  - `src/actions/notification-preferences.ts` — `updateAdminNotificationPreferences` server action, admin-only check + own-row write only. DEC-015 form-action shape (`Promise<string | null>`).
  - `src/app/(admin)/admin/notification-preferences/page.tsx` + `src/components/admin/notification-preferences-form.tsx` — server page + client form, four checkboxes (2 events × 2 channels).
  - Sidebar nav links added in `admin-nav.tsx` + `admin-mobile-nav-drawer.tsx`.
  - DEC-026 in `docs/DECISIONS.md` — JSONB on profiles over a separate table; resolved the TBD row.
  - `tests/admin-notification-preferences.spec.ts` — 4 desktop tests (page loads with defaults, save + reload persistence, non-admin redirect, sidebar link). All green.
- Commit `45714b9`.

**In Progress:** Nothing.

**Blocked:**
- `NOTIFICATIONS_ENABLED=true` for ongoing smoke testing → dispatcher-firing Playwright tests are paused for "a few sessions" per Eric. Will surface as test debt in the meantime.
- Twilio Toll-Free Verification still pending submission/approval.
- Parallel CC running session 101 (Phase 7 — Hetzner remote dev environment). Independent from 3.8 scope; worked around at commit time by staging files explicitly instead of `git add -A`.

**Next Steps:**
1. **3.9 — Student notification preferences (2 pts).** Reuses the same `notification_preferences` column on profiles. Spec calls for "opt out of SMS, email-only option" — simpler shape than admin (single global toggle vs per-event matrix). 3.9 is the natural next bite; DEC-026's "preferences will reuse the same column" claim gets exercised here.
2. Eric to finish smoke testing 3.4–3.8 with `NOTIFICATIONS_ENABLED=true` and a single test number. Confirm preferences toggles actually suppress channels in real Twilio/Resend output.
3. Code review test-debt follow-up: when notification env settles, add (a) unit tests for `isAdminChannelEnabled` covering the realistic JSON shapes, and (b) a triggers-level test asserting `mockBuffer` respects per-recipient prefs.
4. Form-action return-shape inconsistency: `updateAdminNotificationPreferences` returns `Promise<string | null>` (DEC-015 form-action shape), while existing `updateStudentProfile` returns `Promise<{ error: string | null }>`. Pick a winner before 3.9 reuses this column and forks the pattern further. Recommendation: standardize on `string | null` for form actions (matches DEC-015 explicitly).
5. `supabase db push` to remote (still overdue, but Eric did push earlier today — confirm whether the migration landed on remote).

**Context:**
- **Pattern shift in Phase 3.** Sessions 92–99 were notification-trigger work — every task was "new template + new trigger function + wire into action + test route". 3.8 is the first task that operates on the dispatcher itself rather than adding to it. 3.9 will follow the same pattern: read prefs in the recipient fan-out, gate channels.
- **JSONB-on-profiles design (DEC-026).** Null/missing keys mean enabled. This preserves historical behavior for any profile predating the column. The defensive helper (`isAdminChannelEnabled`) is the load-bearing piece — accidentally muting an admin is worse than accidentally sending, so any malformed value defaults to enabled. The OPPOSITE direction would be a bug.
- **Parallel CC commit hygiene.** When two CC sessions are running in the same working tree, `/kill-this`'s default `git add -A` would cross-contaminate. Stage explicit file paths to keep commits scoped to the current session's task. Both sessions can write to `session-log.md` (each prepends its open marker — order is whatever wins the race).
- **Types regen gotcha.** `npx supabase gen types typescript --local > types.ts` includes npm warnings from stderr if the supabase CLI isn't already installed. Add `2>/dev/null` to the redirect, or the file gets corrupted with `npm warn exec ...` lines that break tsc.
- **Dispatcher gating is the load-bearing logic.** UI tests pass; dispatcher behavior is currently only manual-smoke confirmed. Acceptable risk for V1, flagged as test debt in next steps.

**Code Review:** 4 cleanups, 0 bugs. RLS check confirmed the existing self-update policy covers the new column (DEC-026 claim holds).
1. **consistency** Form-action return-shape inconsistency between `updateAdminNotificationPreferences` (`string | null`) and `updateStudentProfile` (`{ error: string | null }`). Standardize before 3.9 forks further.
2. **cleanup** Add a one-line comment in `preferences.ts:38` that "default to enabled on any non-bool" is intentional (corrupted JSON wins by sending, not by muting).
3. **cleanup** Action validates FormData correctly — only iterates known events, drops extras. No change needed.
4. **cleanup** Test debt — dispatcher gating not automated. Add unit tests for `isAdminChannelEnabled` + triggers-level test once `NOTIFICATIONS_ENABLED` settles.

## Session 99 — 2026-04-26 07:42–08:32 (0.83 hrs)
**Duration:** 0.83 hrs | **Points:** 5 (3.7: 5)
**Task:** Phase 3.7 — Session reminders + 3 carryover cleanups from session 98 code review

**Completed:**
- **Phase 3.7 — Session reminders (5 pts).**
  - `src/lib/notifications/templates.ts` — `sessionReminder()` template + `SessionReminderData` type. Single template parameterized by `leadTimeLabel` ("tomorrow" or "in 1 week").
  - `src/lib/notifications/triggers.ts` — `notifyUpcomingSessionReminders(referenceDate?: Date)`. Lead-time table at top of file (`SESSION_REMINDER_LEAD_TIMES = [{daysOut: 7, label: "in 1 week"}, {daysOut: 1, label: "tomorrow"}]`). UTC-safe date math via `isoDateOffset()`. Idempotency from exact-date filter — each session fires reminders exactly once per slot. Optional `referenceDate` lets tests simulate "today".
  - `src/app/api/cron/session-reminders/route.ts` — daily cron route, mirrors `expire-holds` and `low-enrollment`. CRON_SECRET auth, returns `{ fired: N }`.
  - `vercel.json` — third cron entry, daily at 14:00 UTC.
  - `src/app/api/test/run-session-reminders/route.ts` — dev-only test route.
  - `tests/session-reminders.spec.ts` — 5 desktop tests (7-day fires, 24-hour fires, off-target dates skip, cancelled sessions skip, cron route smoke). All green.
- **Carryover cleanups from session 98 code review.**
  - `sessionCancellation` SMS body: `on {date} at {time} at {location}` → `on {when} ({where})` to avoid the awkward double "at" (also matches new `sessionReminder` formatting).
  - `notifyMakeupAssigned`: `courseResult` + `enrollments` lookups parallelized via `Promise.all` (matches `notifyEnrollmentConfirmed` pattern).
  - New `src/lib/dev-only.ts` helper exporting `devOnly()`. Refactored all 8 `/api/test/*` routes to use it. Now blocks on `NODE_ENV !== 'development' || VERCEL_ENV` — defense in depth against a misconfigured Vercel deploy exposing service-role writes.
- **Vercel plugin queued for next-session cleanup** (Eric will disable it via `/plugins`). Currently injecting ~5k tokens of skill descriptions on session start; trims fast-burn context budget.
- **Manual cron test commands documented** for all 3 crons (expire-holds, low-enrollment, session-reminders).
- Commit `00c0d56`.

**In Progress:** Nothing.

**Blocked:**
- `supabase db push` to remote — still uncertain if today's seed/migration changes are reflected.
- Smoke testing 3.7 cron live (Eric is doing this immediately after session close).

**Test failures from full suite:** Eric ran the full suite and confirmed everything passed.

**Next Steps (in order):**
1. **Manual smoke tests (Eric will do these post-close):**
   - 3.4 enrollment notification — already verified live, re-confirm
   - 3.5 cancellation notice — admin cancels a session with enrolled students → expect SMS+email per student
   - 3.6 makeup assignment — admin creates a makeup → SMS+email per affected student
   - 3.7 session reminder — `curl -X POST /api/test/run-session-reminders -d '{"referenceDate":"2026-05-02"}'` against a real seed enrollment to fire a 1-week reminder
2. **Vercel plugin disable** (next session start). Eric to run `/plugins` and disable. Should reduce session-start context by ~5k tokens.
3. **Phase 3 mode shift** — next phase 3 task is **3.8 Admin notification preferences (3 pts).** No more triggers/templates from here on; this is settings/UI work. DEC needed: settings table vs JSON column on profiles.
4. **Optional cleanups (advisory, not blocking):**
   - `sessionReminder` SMS body is ~217 chars = 2 Twilio segments. Trimming "Schedule: sailbook.live/student/courses." would land it back at 1 segment. ~50% per-reminder cost reduction. Tradeoff: less helpful body. Reminders are highest-volume of all triggers (per-student × per-session × 2 lead times) so the math favors trim.
   - Stale doc comment in `enroll/route.ts:3` still says "Gated behind NODE_ENV !== 'development'" — now uses `devOnly()`. One-line fix.
   - `isoDateOffset` could use a one-line comment that `Date.UTC` overflow normalization is the load-bearing detail.
5. `supabase db push` to remote.

**Context:**
- **Notification trigger pattern is now well-established across 4 implementations** (3.4, 3.5, 3.6, 3.7). Each: dedicated template (pure function, STOP disclosure on student-facing only), dedicated trigger (`notifyXyz()` with admin-client + per-channel try/catch + per-recipient fan-out), wired into the action that just performed the side effect, plus a dev-only `/api/test/*` route mirroring the action for testability. Phase 3.8 onwards departs from this pattern.
- **Cron pattern is now established across 3 implementations** (expire-holds, low-enrollment, session-reminders). Each: GET route with `CRON_SECRET` Bearer auth, returns `{ count: N }`, vercel.json entry. Add new ones by copying any of the three.
- **Mock buffer is shared module-level state across all notification tests.** Cross-file Playwright parallelism races it — must run with `--workers=1` for reliable group runs. Within-file is fine via `mode: 'serial'`.
- **`devOnly()` blocks if `VERCEL_ENV` is set** (any Vercel env: dev/preview/production) AND if `NODE_ENV !== 'development'`. Both conditions matter — a misconfigured `NODE_ENV=development` deploy still gets blocked by the `VERCEL_ENV` check.
- **Test data persists across serial Playwright tests in the same file.** Reminder tests had to scope assertions by course title because earlier tests' courses lived through to later tests. Worth the same hardening in future tests that read shared state.
- **SMS encoding still GSM-7 across the board** post-em-dash cleanup. New `sessionReminder` lands at 2 segments; everything else 1 segment. Trim flagged in optional cleanups.

**Code Review:** 4 cleanups, 1 doc-comment fix, 1 SMS-cost flag. No bugs.
1. **cleanup** `templates.ts:314` — `sessionReminder` SMS body ~217 chars = 2 Twilio segments. Trim "Schedule: sailbook.live/student/courses." for ~50% per-reminder cost reduction. Tradeoff: less helpful body. Worth doing because reminders are highest-volume trigger type.
2. **cleanup** `triggers.ts:459` — Add a one-line comment that `Date.UTC` overflow normalization is the load-bearing detail in `isoDateOffset`.
3. **cleanup** `triggers.ts:546` — `as unknown as { ... }` cast on `enrollments!inner` join. Third copy of the same types-debt pattern (MEMORY: `project_types_debt`). Cleanup gets slightly bigger when `supabase gen types` runs pre-V2.
4. **cleanup** `enroll/route.ts:3` — stale doc comment still says "Gated behind NODE_ENV !== 'development'" — now uses `devOnly()`.
5. **consistency** `dev-only.ts` — design is right. Pure function, no module-level side effects, returns `NextResponse | null` for early-return idiom.

## Session 98 — 2026-04-25 21:49 → 2026-04-26 07:28 wall clock (1.50 hrs active — overnight gap)
**Duration:** 1.50 hrs | **Points:** 6 (3.5: 3, 3.6: 3)
**Task:** Phase 3.5 + 3.6 — session cancellation + makeup notifications + pending-payment UX cleanup

**Completed:**
- **Phase 3.5 — Session cancellation notice (3 pts).**
  - `src/lib/notifications/templates.ts` — `sessionCancellation()` template + `SessionCancellationData` type. SMS body, email subject/text/html, optional cancel reason, "Reply STOP to opt out."
  - `src/lib/notifications/triggers.ts` — `notifySessionCancelled(sessionId)`. Identifies affected students by reading `session_attendance` rows that just flipped `expected → missed`. No admin alert (admin did the cancelling).
  - `src/actions/sessions.ts` — `cancelSession` calls trigger after the attendance flip, before `revalidatePath`.
  - `src/app/api/test/cancel-session/route.ts` — new dev-only test route mirroring side effects.
  - `tests/session-cancellation-notice.spec.ts` — 3 desktop tests (with-reason, without-reason, notify-off). All green.
- **Phase 3.6 — Makeup assignment notice (3 pts).**
  - `src/lib/notifications/templates.ts` — `makeupAssignment()` template. Mentions both the original missed session date AND the new makeup date/time/location.
  - `src/lib/notifications/triggers.ts` — `notifyMakeupAssigned(makeupSessionId)`. Identifies affected students by reading `session_attendance.makeup_session_id` links via FK embed (`sessions!session_attendance_session_id_fkey ( date )` confirmed by code review).
  - `src/actions/sessions.ts` — `createMakeupSession` calls trigger after the link update, only when missed records were linked.
  - `src/app/api/test/create-makeup-session/route.ts` — new dev-only test route.
  - `tests/makeup-assignment-notice.spec.ts` — 3 desktop tests. All green.
- **Pending-payment UX cleanups (uncovered during 3.4 smoke test).**
  - `enrollmentStatusLabel` returns `"Payment Pending"` instead of raw `"pending_payment"` on the browse-list badge.
  - Badge variant for `pending_payment` is now `warn` (yellow) — signals action needed.
  - New `isEffectivelyEnrolled(status, holdExpiresAt)` helper in `courses-card-list.tsx`: pending_payment with expired hold = treated as not-enrolled. Removes the inconsistency where the browse list said "Payment Pending" but detail page said "Register & Pay".
  - `my-courses` page query pulls `hold_expires_at` and filters expired-hold pending_payment rows out before render.
  - Browse page passes `hold_expires_at` through to `CourseCardData`.
- **3.4 smoke-tested live** — Stripe webhook (CLI listening) → `notifyEnrollmentConfirmed` → real Twilio SMS + real Resend email both delivered to Eric's phone. Phase 3.4 is done-done, not just mock-done.
- Commit `7a490db`.

**In Progress:** Nothing.

**Blocked:**
- `supabase db push` to remote — stale state on remote vs. local. Eric pushed earlier today but unclear if today's seed/migration changes are reflected.
- Locally: `/api/cron/expire-holds` doesn't auto-run, so pending_payment records sit until manually triggered. The cron-expired-hold UX cleanups in this commit decouple display from cron, but the underlying records still need a manual sweep in dev.

**Test failures from full suite:** Eric punted the full suite to start of next session.

**Next Steps (in order, pinned by Eric):**
1. **Run full Playwright suite** at the start of next session (carryover, was punted tonight).
2. **Manual smoke tests** for 3.4, 3.5, 3.6 — Eric explicitly asked for a reminder. Real-provider verification of each notification path:
   - 3.4: pay & register flow → enrollment confirmation SMS+email arrives (already verified once; re-verify in batch).
   - 3.5: admin cancels a session with enrolled students → cancellation SMS+email per student.
   - 3.6: admin creates a makeup for that cancelled session → makeup SMS+email per affected student.
3. **3.7 — Session reminders (5 pts).** Cron-scheduled SMS+email 1 week and 24 hours before session start. Same pattern as the low-enrollment cron route + new template + new trigger.
4. Optional code-review cleanups before phase close (none blocking):
   - SMS copy: `sessionCancellation` body has "...session on {date} at {time} at {location}..." — double "at" reads awkwardly. Switch to `on {when} ({where})` or split sentences.
   - `notifyMakeupAssigned`: parallelize the courseResult + enrollments lookup in `Promise.all` (matches pattern in `notifyEnrollmentConfirmed`).
   - Defense-in-depth on dev test routes: also gate by `VERCEL_ENV` or require `x-test-token` header in case `NODE_ENV` is misconfigured.

**Context:**
- **The cron not running locally** is now annotated in the data-display layer instead of the data layer. UX gracefully handles stale pending_payment via the `isEffectivelyEnrolled` helper. The actual record cleanup still happens via the cron in prod — locally the records sit but display correctly.
- **Manual smoke-test path established.** Stripe CLI listening (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`) bridges Stripe → localhost webhook. Without the CLI, paying through the hosted page leaves enrollments stuck in pending_payment because the `checkout.session.completed` webhook never reaches the dev server. Re-run `stripe listen` and update `STRIPE_WEBHOOK_SECRET` in `.env.local` if the CLI session restarts.
- **Trigger tests must reset DB before running.** Manual smoke tests leave pending_payment + Stripe customer state behind. Affected counts in tests like `student-enrollment.spec.ts:31` (spots-remaining) drift if the DB has leftover real-paid enrollments. Run `supabase db reset` before the full suite.
- **Notification trigger pattern is now well-established across 3 implementations** (3.4, 3.5, 3.6). Each: dedicated template (pure function), dedicated trigger (`notifyXyz(id)` with admin-client + per-channel try/catch + per-recipient fan-out), wired into the action that just performed the side effect, plus a dev-only `/api/test/*` route mirroring the action for testability. 3.7 should follow the same shape.
- **SMS encoding:** new templates land at 2 GSM-7 segments (cancellation 259 chars, makeup 218 chars). Em-dash → hyphen cleanup from earlier today held — no UCS-2 regression.

**Code Review:** 1 copy nit, 2 cleanup notes, 1 security suggestion. No bugs.
1. **consistency** `templates.ts` — `sessionCancellation` SMS body reads "session on {date} at {time} at {location}". The double "at" is awkward. Fix to `on {when} ({where})` or split sentences.
2. **cleanup** `triggers.ts:212-236, 311-333` — `as unknown as { ... }` casts on embedded relations. Same Supabase types-debt pattern from MEMORY (`project_types_debt`). Track for V2 cleanup.
3. **cleanup** `triggers.ts:281, 287` — `notifyMakeupAssigned`'s `courseResult` + `enrollments` lookups are independent. Wrap in `Promise.all` for a small latency win (matches `notifyEnrollmentConfirmed` pattern).
4. **security** Dev test routes (`/api/test/cancel-session`, `/api/test/create-makeup-session`) only gate on `NODE_ENV !== 'development'`. Belt-and-suspenders: also require a header secret or refuse if `VERCEL_ENV` is set.

## Session 97 — 2026-04-25 20:45–21:38 (0.92 hrs, triage session)
**Duration:** 0.92 hrs | **Points:** 0 (triage pins — pre-3.5 prep, not plan-table tasks)
**Task:** Phase 3 triage pins (STOP language, register consent, pgTAP fixes)

**Completed:**
- **STOP disclosure on `enrollmentConfirmation()` SMS template** (`src/lib/notifications/templates.ts`). Body now ends with `Reply STOP to opt out.`. Comment notes Twilio handles inbound STOP/HELP/UNSUBSCRIBE keywords automatically — no backend wiring needed. Admin templates intentionally skipped (operators, not consumer recipients).
- **SMS consent disclosure on `/register`** (`src/app/(auth)/register/register-form.tsx:61`). Small `text-xs text-muted-foreground` paragraph under the phone input: "Used for enrollment confirmations and session reminders. Standard message rates apply. Reply STOP to opt out." Aligns with what Twilio toll-free verification reviewer will look for.
- **pgTAP test drift from session 96 seed rewrite** — fixed across two files:
  - `supabase/tests/02_rls_courses.sql` — admin/instructor course count 6→10, student course count 5→9, seed-reference comment block rewritten to reflect five Open Sailing courses (c006-c010).
  - `supabase/tests/03_rls_enrollments.sql` — attendance count 17→13 in three places (admin, mike, chris views), seed-reference comment rewritten to note e006 has 1 attendance row (Open Sailing is single-session per-course).
  - **All 120 pgTAP tests green.**
- **Instructor-invite test retry config** (`tests/instructor-invite.spec.ts`). Added `retries: 2` to the describe block. Comment notes the chronic Playwright flake (target-page-closed during click under suite load, cold-compile races on fresh dev server) and points at session 92 manual QA confirming the feature works. Will escalate to `test.fixme()` if retries stop catching it.
- **Full Playwright suite run** (Eric, in user mode): 348 passed, 4 failed, 144 skipped, 8 did-not-run. The 4 failures are tracked below.
- Commit `94f1409`.

**In Progress:** Nothing.

**Blocked:**
- **Smoke tests on hold.** Resend domain re-verification still in flight, Twilio TFV pending Eric's form submission (which the triage pins now unblock).
- `supabase db push` to remote (overdue 7 sessions).

**Test failures from the full suite — pinned for next session:**
1. **`tests/notifications.spec.ts:24`** — SMS dispatch routes to mock and appears in buffer. **Cause:** Eric flipped `NOTIFICATIONS_ENABLED=true` in `.env.local` mid-day. Dev server inherits at startup. Test API route uses the dispatcher, which now routes to real Twilio instead of mock buffer. Buffer stays empty → fail. **Fix already applied:** Eric flipped `.env.local` back to `false`. Dev server needs a restart next session to pick it up. After restart, tests should pass.
2. **`tests/enrollment-notifications.spec.ts:17`** — confirmed enrollment fires student email and admin email per admin. **Same root cause as #1.** Same fix (restart dev server with `NOTIFICATIONS_ENABLED=false`).
3. **`tests/checkout.spec.ts:16`** — Register & Pay redirects to Stripe checkout. **Likely cause:** notify trigger on enrollment was hitting real Twilio/Resend on test-env credentials, slow-failing under load. Same fix likely resolves it. Verify after restart.
4. **`tests/instructor-invite.spec.ts:30`** — admin generates link. **Chronic flake.** This commit added `retries: 2`. If still fails after retries, escalate to `test.fixme()`.

**Next Steps (in order):**
1. **First thing next session:** restart dev server (it's running with stale `NOTIFICATIONS_ENABLED=true`) and re-run the full Playwright suite to confirm failures #1-#3 are gone. If #4 still fails after retries, escalate to `test.fixme()`.
2. **Then 3.5 — Session cancellation notice (3 pts).** Phase 3 keeps moving while Twilio TFV runs its multi-day external clock.
3. After 3.5, optionally address the 3 advisory cleanups from code review (em-dash → hyphen in seed titles, drop `text-muted-foreground` on register consent line, fix stale pgTAP comment at `02_rls_courses.sql:168`).
4. `supabase db push` to remote (overdue).

**Context:**
- **`.env.local` flip is dev-server-side, not test-runner-side.** Playwright reads `.env.local` for the test runner's process, but the actual notification dispatch happens in the dev server's process. Dev server inherits its env at `npm run dev` startup. Tests that depend on dispatcher-routes-to-mock require `NOTIFICATIONS_ENABLED=false` in the dev server's env, which means a restart after any flip.
- **Playwright `retries: 2` + `mode: 'serial'` is safe.** Code review confirmed: retries only re-run the failed test, not the whole serial chain. Dependent later tests still skip on failure (won't be retried). Good combo for the instructor-invite flake pattern.
- **The 26 ASA 101 + 5 Open Sailing course titles all use em-dash (—).** This forces UCS-2 SMS encoding (70/67 chars per segment) instead of GSM-7 (160/153). With the new `Reply STOP` line, typical SMS body is ~210 chars = 3 UCS-2 segments instead of 2 GSM-7. ~50% cost bump. Code review flagged as advisory cleanup — replace em-dash with ` - ` (hyphen-space-hyphen-space) in seed titles when convenient.
- **The pgTAP test at `02_rls_courses.sql:168` has a stale comment** (says "c001,c002,c003,c006 = 11 sessions" but should say "c006-c010"). Math is correct, comment is misleading. Trivial cleanup.

**Code Review:** 3 advisory cleanups, no bugs.
1. **consistency** `02_rls_courses.sql:168` — Comment lists `c001,c002,c003,c006` for the student-sees-11-active-sessions assertion but should list `c001,c002,c003,c006-c010`. Math correct; comment misleading.
2. **cleanup** `templates.ts:90` — Em-dash in `data.courseTitle` (from seed) forces UCS-2 encoding. Adding `Reply STOP to opt out.` pushes typical body to 3 segments instead of 2. ~50% cost bump on the highest-volume template. Fix at the seed level (em-dash → hyphen) when convenient.
3. **cleanup** `register-form.tsx:61` — `text-muted-foreground` may be borderline-low-contrast for a Twilio TFV reviewer in dark mode. Consider dropping the class so the line inherits body color (still `text-xs`, still visually subordinate to the input).

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
   - **Why first:** items 1+2 are required content for the Twilio Toll-Free Verification submission. Eric needs them landed before he can submit the TFV form, which then runs on a multi-day external clock.
2. **Then 3.5 — Session cancellation notice (SMS + email, 3 pts).** Phase 3 builds in parallel with the Twilio TFV approval window. 4.2 punted — pick it back up after Phase 3 has a few more tasks closed.
3. Run full Playwright suite + `supabase test db` (punted from session 96).
4. Smoke test punted explicitly — re-evaluate the day Resend domain + Twilio TFV both verify. Don't chase external verification clocks mid-session.
5. `supabase db push` to remote (overdue).

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

