# SailBook — Session Log

Session summaries for continuity across work sessions.
Format: prepend newest entry at the top.

## Session 77 — 2026-04-17 12:38 [open]
**[PAUSED 13:10]**
**[RESUMED 08:31]** Working on: Phase 2.4 — enrollment hold expiry. Left off at: all code complete and committed (cron route, Resume Payment UX, pgTAP debt, Playwright tests 3/3 passing). Next: run `supabase test db` to confirm pgTAP test #13 green, then visually verify Resume Payment UX in the browser, then move to Phase 2.5 (Stripe webhook).

## Session 76 — 2026-04-16 08:21–09:29 (1.2 hrs)
**Duration:** 1h 10min | **Points:** 6 pts (1.10: 3pts + 1.23: 3pts)
**Task:** Phase 1.10 — instructor notes field + expanded roster; Phase 1.23 — student account page

**Completed:**
- Migration: `instructor_notes text` added to profiles (`supabase/migrations/20260416082959_add_instructor_notes_to_profiles.sql`)
- Register form: captures instructor notes textarea at signup (`src/app/(auth)/register/register-form.tsx`)
- `updateStudentProfile` server action (`src/actions/profiles.ts`)
- Student account page: full profile edit — name, phone, ASA, experience, notes (`src/app/(student)/student/account/page.tsx`, `src/components/student/student-account-form.tsx`)
- Student nav + mobile drawer: Account link added
- Session roster: email column + blue dot indicator for students with notes (`src/app/(instructor)/instructor/sessions/[id]/page.tsx`)
- Student detail page: "Note from student" callout (`src/app/(instructor)/instructor/students/[id]/page.tsx`)
- Dev test helper: `POST /api/test/assign-instructor` (`src/app/api/test/assign-instructor/route.ts`)
- Placeholder color fix: unlayered `::placeholder` CSS override (`src/app/globals.css`)
- Supabase types regenerated
- New test file: `tests/instructor-notes.spec.ts` (serial mode, viewport-skipped mutation tests)
- Fixed `instructor-views.spec.ts`: match by email instead of student name; "Upcoming" not "—" for attendance

**In Progress:** Nothing — Phase 1 complete

**Blocked:** Nothing

**Next Steps:**
- Quick code review fixes before Phase 2: add ~2000 char length cap to `instructor_notes` in `updateStudentProfile`; add pgTAP test asserting students can't read other students' notes
- Confirm with Andy: is instructor access to student email in the session roster intentional?
- Phase 2 kickoff — run `/pm` for task order recommendation

**Context:**
- Mutation tests writing to pw_student's profile row must skip mobile/tablet — all 3 Playwright projects run in parallel and hit the same DB row
- "Profile updated." stays visible across sequential useActionState submits — wait for button to cycle through "Saving…" to confirm the second submit actually ran
- Enrollment API auto-creates `expected` attendance records → attendance column shows "Upcoming" not "—"
- Unlayered `::placeholder` wins over `@layer utilities` — correct approach for targeted pseudo-element overrides without touching design tokens

## Session 75 — 2026-04-16 00:05–00:22 (0.3 hrs)
**Duration:** 0.3 hours | **Points:** 5 pts
**Task:** Phase 1.7 — generic codes/lookup table + migrate experience levels

**Completed:**
- `supabase/migrations/20260416020000_codes_table.sql` — codes table, RLS (anon SELECT active; admin ALL), seeded with beginner / intermediate / advanced (desc: Confident on the water)
- `supabase/seed.sql` — codes rows with ON CONFLICT DO NOTHING
- `supabase/tests/07_rls_codes.sql` — 8 pgTAP RLS tests; all 85 pgTAP tests green
- `src/app/(auth)/register/register-form.tsx` — extracted client form, takes experienceCodes prop
- `src/app/(auth)/register/page.tsx` — converted to server component, fetches codes, passes to form
- `src/components/admin/profile-edit-form.tsx` — experienceCodes prop replaces hardcoded options
- `src/app/(admin)/admin/students/[id]/edit/page.tsx` — fetches codes in parallel with profile
- `src/app/(admin)/admin/instructors/[id]/edit/page.tsx` — same
- `src/components/admin/course-edit-form.tsx` + `course-type-form.tsx` — fixed stale named type imports broken by type regen
- `docs/DECISIONS.md` — DEC-021 added; DEC-TBD resolved
- `tests/codes.spec.ts` — 9 Playwright tests; all green

**In Progress:** Nothing

**Blocked:** Nothing

**Next Steps:**
- `supabase db push` to apply codes migration to remote
- Task 1.10 — instructor notes field + expanded roster (3 pts)
- Task 1.23 — student account page (3 pts)

**Context:**
- profiles.experience_level stays varchar with no FK — intentional (DEC-021). Retiring a code doesn't break existing profiles; retired codes just disappear from dropdowns.
- Seed data lives in both the migration (for prod via db push) and seed.sql (for local db reset) — ON CONFLICT DO NOTHING prevents duplication. If you update a label, update both files.
- Type regen wiped two custom named exports (Course, CourseType) — replaced with Tables<'courses'> / Tables<'course_types'>. Watch for this on future regen.

**Code Review:** 4 findings (all advisory):
1. Seed data duplicated between migration and seed.sql — intentional, ON CONFLICT DO NOTHING already in place
2. No pgTAP test for admin SELECT of inactive codes — gap if admin audit UI ever lands
3. codes fetch on instructor edit page is a no-op for pure instructors (experience field only shown when is_student) — minor wasted query
4. ExperienceCode type defined in two files — extract to shared location if more callsites emerge

## Session 74 — 2026-04-15 23:14–23:56 (0.7 hrs)
**Duration:** 0.7 hours | **Points:** 3 pts (lumped into 1.15 — continuation of same task)
**Tasks:** Phase 1.15 continuation — revert DB-synced theme persistence to localStorage-only

**Completed:**
- `src/components/theme-sync.tsx` — deleted
- `src/app/api/theme/route.ts` — deleted
- `src/actions/profiles.ts` — deleted dead `updateThemePreference` export
- `src/components/theme-toggle.tsx` — toggle now only calls `setTheme()`, fetch to /api/theme removed
- `src/app/(admin)/layout.tsx` — ThemeSync removed; profile query dropped entirely (theme_preference was its only purpose)
- `src/app/(student)/layout.tsx` — ThemeSync removed; profile query now selects `is_instructor` only
- `src/app/(instructor)/layout.tsx` — ThemeSync removed; profile query now selects `is_student` only
- `tests/theme.spec.ts` — cross-session DB persistence test removed; stale ThemeSync comment fixed
- `tests/dashboard-instructor-count.spec.ts` — `toBe` → `toBeGreaterThanOrEqual` for parallel test interference
- `docs/PROJECT_PLAN.md` — tasks 1.0, 1.15, 4.8 updated to reflect localStorage-only approach
- `docs/DECISIONS.md` — DEC-020 added; DEC-018 cross-reference updated

**In Progress:** Nothing

**Blocked:** Nothing

**Next Steps:**
- Push dev branch
- Continue Phase 1: 1.7 (experience levels / codes table, 5 pts), 1.10 (instructor notes + expanded roster, 3 pts), 1.23 (student account page, 3 pts)

**Context:**
- `theme_preference` column intentionally stays in DB schema — column is free, removal costs a migration + seed cleanup + type regen, and it's there if cross-device sync ever gets done properly (requires cookie-based SSR, not a useEffect)
- Correct approach for cross-device sync documented in DEC-020: set a cookie server-side on login so next-themes initializes with the right value before first render

**Code Review:** 2 findings, both fixed in-session:
1. `src/actions/profiles.ts` — dead `updateThemePreference` export left behind (deleted)
2. `tests/theme.spec.ts` — stale comment referencing ThemeSync (fixed)

## Session 73 — 2026-04-15 21:53–22:53 (1.0 hrs)
**Duration:** 1.0 hours | **Points:** 6 pts
**Tasks:** Session 72 code review fixes, Phase 1.14 (dashboard instructor count tests), Phase 1.15 (theme preference persistence)

**Completed:**
- `src/app/api/test/enroll/route.ts` — JSDoc updated (NEXT_PUBLIC_DEV_MODE → NODE_ENV); session_attendance upsert now checks and returns error
- `src/app/(auth)/register/page.tsx` — select `shadow-sm` → `shadow-xs`
- `src/app/(student)/student/courses/[id]/actions.ts` — enrollment upsert in `createCheckoutSession` now returns errors (update + insert); TODO comment on `!checkoutSession.url` guard linking to 2.4
- `supabase/migrations/20260416010000_change_theme_preference_default.sql` — column default `theme_preference` `'dark'` → `'system'`
- `src/components/theme-provider.tsx` — `defaultTheme="dark"` → `"system"` (unauthenticated pages follow OS)
- `src/app/(admin)/layout.tsx`, `(student)/layout.tsx`, `(instructor)/layout.tsx` — fallback `?? 'dark'` → `?? 'system'`
- `supabase/seed.sql` — `theme_preference` column added to profiles INSERT; all seed users pinned to `'dark'` explicitly
- `src/components/theme-sync.tsx` — comment updated to document localStorage-first-render limitation
- `tests/theme.spec.ts` — rewritten: localStorage isolation for toggle tests (prevents parallel viewport DB pollution); adds unauthenticated system-default test and cross-session persistence test (uses pw_student, restores dark on exit)
- `tests/dashboard-instructor-count.spec.ts` — new: 3 tests covering warning card, count increment (desktop-only), session "Course default" label
- `docs/PROJECT_PLAN.md` — task 4.8 added (cookie-based theme sync); 4.9 is end-of-phase review

**In Progress:** Nothing

**Blocked:** Nothing

**Next Steps:**
- `supabase db push` to apply `20260416010000_change_theme_preference_default.sql` to remote
- Continue Phase 1: 1.7 (experience levels / codes table, 5 pts), 1.10 (instructor notes + expanded roster, 3 pts), 1.23 (student account page, 3 pts)

**Context:**
- Theme FOUC on first page after login is a known limitation: ThemeSync writes 'dark' to localStorage in a useEffect, but next-themes already initialized from `defaultTheme="system"`. Fix is task 4.8 (cookie-based pre-population). Fully documented in theme-sync.tsx.
- Theme toggle tests pre-seed localStorage directly (`page.evaluate(() => localStorage.setItem('theme', 'dark'))`) to avoid DB state pollution from parallel viewport projects — do not remove this pattern
- `supabase db reset` needed before running theme tests if toggle tests were interrupted mid-run (pw_student or pw_admin DB state may be stale)

**Code Review:** 3 findings:
1. "Toggle is visible" tests don't clear localStorage first — inconsistent with rest of suite (low risk, tests use `/switch to/i` not a specific label)
2. Persistence test DB restore could be left dirty if test fails mid-run between ctx1/ctx2 — no afterAll cleanup hook
3. theme-sync.tsx comment says "next page navigation" — should say "next full page load" (minor precision)

## Session 72 — 2026-04-15 19:08–19:41 (0.6 hrs)
**Duration:** 0.6 hours | **Points:** 4 pts
**Tasks:** Phase 1.18 (logo + favicon), 1.19 (/dev dark mode), code review fixes (sessions 68 & 70), dark mode select fix

**Completed:**
- `src/app/(auth)/login/page.tsx` — logo.png placed inside CardHeader, right side, vertically centered with title; Image import added
- `src/app/layout.tsx` — favicon.svg wired into metadata icons
- `src/app/dev/page.tsx` — bg-white → bg-background text-foreground; bg-gray-50/100 → bg-muted; readable in both themes
- `src/app/(student)/student/courses/[id]/actions.ts` — enrollment lookup .single() → .maybeSingle(); stripe_customer_id update now captures + logs error (non-fatal)
- `src/app/api/test/enroll/route.ts` — NEXT_PUBLIC_DEV_MODE → NODE_ENV !== 'development' (removes env var from client bundle)
- `supabase/migrations/20260415232000_add_payments_status_check.sql` — CHECK constraint on payments.status
- `src/app/(auth)/register/page.tsx`, `src/components/admin/profile-edit-form.tsx`, `src/components/admin/user-edit-form.tsx` — bg-transparent → bg-background text-foreground on all native <select> elements (dark mode fix)
- `docs/PROJECT_PLAN.md` — note added to 2.12: replace native <select> with shadcn <Select> at end-of-phase UI pass

**In Progress:** Nothing

**Blocked:** Nothing

**Next Steps:**
- Fix 5 code review items from this session before next feature (see Code Review below) — items 1–2 are quick; item 3 is most important
- `supabase db reset` (or `supabase db push`) to apply payments.status CHECK constraint migration
- Continue Phase 2: 2.4 (enrollment hold expiration — scheduled job) or 2.5 (Stripe webhook)
- Remaining Phase 1: 1.7, 1.10, 1.14, 1.15, 1.23

**Context:**
- Logo is h-20 w-auto inside CardHeader with items-center — adjust if logo proportions look off at different sizes
- Native <select> dark mode: bg-background fixes the field but the browser dropdown popup is still unstyled — deferred to 2.12 (shadcn Select swap)
- Enrollment upsert in createCheckoutSession still discards errors silently (Stripe session already exists at that point — partial-write risk; linked to 2.4 cleanup)

**Code Review:** 5 findings — fix at start of next session:
1. JSDoc comment in test/enroll/route.ts still says NEXT_PUBLIC_DEV_MODE — update to NODE_ENV
2. Register page select uses shadow-sm; admin forms use shadow-xs — standardize to shadow-xs
3. Enrollment upsert in createCheckoutSession (update + insert) discards errors silently — fix before 2.5
4. !checkoutSession.url guard fires after enrollment write — add TODO comment linking to 2.4
5. session_attendance upsert in test route doesn't check error — low urgency (test-only), but inconsistent with main path

## Session 71 — 2026-04-15 17:59–19:01 (1.0 hrs)
**Duration:** 1.0 hours | **Points:** 3 pts
**Tasks:** Phase 1.8 code review fixes, Phase 1.9 unsaved changes guard

**Completed:**
- `src/app/(auth)/actions.ts` — `requestPasswordReset` guards undefined `NEXT_PUBLIC_SITE_URL`; `updatePassword` uses user returned directly from `updateUser` (fixes null-user bug under recovery session); role-aware redirect (admin → `/admin/dashboard`, instructor → `/instructor/dashboard`)
- `src/app/(auth)/forgot-password/page.tsx` — email input made controlled (same fix as login page)
- `src/app/(auth)/reset-password/page.tsx` — removed `getSession` fallback security gap (logged-in users could bypass recovery token); wired `SIGNED_OUT` → `setTokenError` so "Link expired" card is now reachable; dropped `router` from `useEffect` deps
- `src/lib/supabase/types.ts` — stripped leaked `Connecting to db 5432` line that was breaking ESLint (pre-existing)
- `src/hooks/use-unsaved-changes.ts` — new hook: `beforeunload` (hard nav) + capture-phase click listener (Next.js `<Link>` / sidebar nav) + `pushState` guard + `popstate` listener (browser back button); returns `confirmDiscard()` helper
- Wired to all admin edit/create forms: `course-edit-form`, `course-form`, `course-type-form`, `user-edit-form`, `profile-edit-form`, `session-row` (inline edit), `add-session-form`, `makeup-session-form`
- `tests/unsaved-changes.spec.ts` — 32 passing, 4 skipped (desktop-only sidebar tests skip at mobile/tablet)

**In Progress:** Nothing

**Blocked:** Nothing

**Next Steps:**
- `supabase db push` to apply hold_expires_at migration from session 70 to remote (if not already done)
- Phase 2 priority: fix 3 code review items from session 70 before next feature (`.single()` → `.maybeSingle()`, stripe_customer_id update error check, NEXT_PUBLIC_DEV_MODE → NODE_ENV in test route)
- Then continue Phase 2: 2.4 (enrollment hold expiration) or 2.5 (Stripe webhook)
- Remaining Phase 1: 1.7 (experience levels), 1.10 (instructor notes), 1.14 (dashboard clarity), 1.23 (student account page)

**Context:**
- Known tradeoff in `useUnsavedChanges`: on successful save + redirect, the `pushState` guard entry stays in history — one extra Back click needed after leaving an edit form. Acceptable complexity tradeoff
- `SIGNED_OUT` on reset-password page fires if user signs out in another tab while this tab is open — would incorrectly show "Link expired." Extremely edge-case, noted in code review

**Code Review:** 1 bug fixed immediately (updatePassword redundant getUser call). 4 low-severity notes: external link bypass in click guard (no external links in admin nav, latent), guard entry not cleaned up when isDirty→false without navigation (documented tradeoff), dropdown toggle reset pattern vs explicit close (readability), desktop-only skip using `width < 1024` (correct, 768px skips).

## Session 70 — 2026-04-15 17:56–18:50 (0.9 hrs)
**Duration:** 0.9 hours | **Points:** 5 pts
**Task:** Phase 2.3 — Stripe Checkout Session creation

**Completed:**
- `supabase/migrations/20260415220534_add_hold_expires_at.sql` — hold_expires_at TIMESTAMPTZ on enrollments
- `src/app/(student)/student/courses/[id]/actions.ts` — createCheckoutSession action: capacity check, Stripe customer upsert, pending_payment enrollment hold, Checkout Session creation, redirect URL return
- `src/components/student/enroll-button.tsx` — wired to createCheckoutSession; redirects to Stripe on success; "Preparing checkout…" loading state
- `src/app/(student)/student/courses/[id]/page.tsx` — pending_payment state shows "Payment pending" badge instead of enroll button
- `src/app/(student)/student/checkout/success/page.tsx` — confirmation page post-payment
- `src/app/(student)/student/checkout/cancel/page.tsx` — hold-duration page with optional return-to-course link
- `src/app/api/test/enroll/route.ts` — dev-only enrollment API for Playwright to bypass Stripe
- `src/proxy.ts` — /api/* routes bypass login redirect (handle own auth)
- `.env.local` — ENROLLMENT_HOLD_MINUTES=1 (change to 15 for prod), SUPABASE_SERVICE_ROLE_KEY
- `tests/checkout.spec.ts` — 15 passing, 6 skipped by design (Stripe redirect + success/cancel pages)
- `tests/helpers.ts` — createTestCourse fills Price ($) field; createEnrolledCourse uses test API route
- `tests/student-enrollment.spec.ts` + `tests/instructor-views.spec.ts` — updated for Stripe flow

**In Progress:** Nothing

**Blocked:** Nothing

**Next Steps:**
- Set ENROLLMENT_HOLD_MINUTES=15 in Vercel env before go-live
- Add SUPABASE_SERVICE_ROLE_KEY (prod value) to Vercel env before go-live
- Fix 3 priority code review findings before next feature:
  1. `.single()` → `.maybeSingle()` on enrollment lookup in createCheckoutSession
  2. profiles.update stripe_customer_id missing error check
  3. NEXT_PUBLIC_DEV_MODE gate → use NODE_ENV or server-only var in test enroll route
- Continue Phase 2: 2.4 (enrollment hold expiration) or 2.5 (Stripe webhook)
- Session 71 (Phase 1.8 fixes) still open — will commit separately

**Context:**
- Stripe Checkout Session expires in 24h (Stripe minimum is 30 min — too short for holds); our hold_expires_at in DB is the real mechanism; 2.4 cleans up expired holds
- /api/* routes now bypass proxy auth redirect — every future API route must handle its own auth
- pending_payment does NOT count against get_course_active_enrollment_count (RPC counts confirmed only); the capacity check in createCheckoutSession also uses this RPC — a race condition exists between two students hitting checkout simultaneously (2.4 task handles this)
- Test API route creates confirmed enrollments (not pending_payment); student-enrollment.spec test for "Payment pending" badge is misleading — logged in code review findings
- price field on test courses was missing from createTestCourse helper — fixed; all test courses now default to $250

**Code Review:** 8 findings:
1. **Security** — NEXT_PUBLIC_DEV_MODE gate in test route leaks into client bundle; use NODE_ENV instead
2. **Security** — /api/* proxy exemption is blanket; document contract or enumerate specific public API paths
3. **Bug** — enrollment written after Stripe session created; Stripe session can dangle if DB write fails
4. **Bug** — .single() on enrollment lookup should be .maybeSingle() (swallows real errors)
5. **Security** — pending_payment holds grant course/attendance visibility via existing RLS helpers (probably acceptable, needs explicit decision)
6. **Consistency** — success page silently discards session_id query param (by design, add comment)
7. **Consistency** — stripe_customer_id update missing error check (silent duplicate Stripe customers)
8. **Cleanup** — student-enrollment test for "Payment pending" badge actually tests confirmed state; rename or fix

## Session 69 — 2026-04-15 16:27–16:59 (0.5 hrs)
**Duration:** 0.5 hours | **Points:** 3 pts
**Tasks:** Phase 1.8 (password reset), login email persistence fix

**Completed:**
- `src/app/(auth)/actions.ts` — requestPasswordReset + updatePassword server actions
- `src/app/(auth)/forgot-password/page.tsx` — forgot password form; shows confirmation on submit
- `src/app/(auth)/reset-password/page.tsx` — PASSWORD_RECOVERY event gate; new password form
- `src/app/(auth)/login/page.tsx` — "Forgot password?" link; controlled email input (persists on failed login)
- `src/proxy.ts` — /forgot-password + /reset-password added to PUBLIC_ROUTES; /reset-password excluded from logged-in redirect
- `.env.local` — NEXT_PUBLIC_SITE_URL=http://localhost:3000 added
- `supabase/config.toml` — localhost:3000/reset-password added to additional_redirect_urls
- `tests/password-reset.spec.ts` — 18 Playwright tests, all passing
- Phase 2.2 completed in parallel session (logged in Session 68)

**In Progress:** Nothing

**Blocked:** Nothing

**Next Steps:**
- `supabase stop && supabase start` to pick up config.toml redirect URL change
- `supabase db push` to apply asa_number + payments migrations to remote
- Fix code review findings before next feature (see Code Review below) — 3 are worth doing next session
- Continue Phase 1: 1.7 (experience level codes), 1.9 (unsaved changes guard), 1.23 (student account page)
- Add production URL to config.toml additional_redirect_urls before go-live

**Context:**
- supabase stop/start required (not just db reset) to reload config.toml changes
- NEXT_PUBLIC_SITE_URL must be set in Vercel env before password reset goes live in production
- reset-password page relies solely on onAuthStateChange PASSWORD_RECOVERY event (no getSession fallback — intentional)

**Code Review:** 6 findings to address next session:
1. **Security** — `requestPasswordReset` should guard against undefined NEXT_PUBLIC_SITE_URL; currently sends email with broken link silently returning success
2. **Production blocker** — prod domain missing from config.toml additional_redirect_urls (add before go-live)
3. **Bug** — `updatePassword` hardcodes redirect to /student/dashboard; admins/instructors land in wrong place after reset
4. **Consistency** — forgot-password email input is uncontrolled (same bug just fixed on login page)
5. **Consistency** — stale `router` dep in reset-password useEffect (not used; remove it)
6. **Consistency** — requestPasswordReset/updatePassword return `{error}` not `string|null`; pre-existing auth group pattern, flag for harmonization

## Session 68 — 2026-04-15 16:26–16:38 (0.2 hrs)
**Duration:** 0.2 hours | **Points:** 6 pts
**Tasks:** Phase 2.2 (Stripe/payments schema), Phase 1.8 (password reset)

**Completed:**
- `supabase/migrations/20260415203119_add_stripe_payments.sql` — stripe_customer_id on profiles, stripe_checkout_session_id on enrollments, payments table (amount_cents, status, refund_amount_cents, stripe_payment_intent_id, stripe_checkout_session_id); indexes on enrollment_id, student_id, checkout id
- `supabase/tests/06_rls_payments.sql` — 10 pgTAP tests; admin all, student read-own, instructor/anon blocked (77/77 total passing)
- `src/lib/supabase/types.ts` — regenerated; Course + CourseType convenience aliases re-appended
- `src/app/(auth)/actions.ts` — requestPasswordReset + updatePassword server actions
- `src/app/(auth)/forgot-password/page.tsx` — forgot password form page
- `src/app/(auth)/reset-password/page.tsx` — set new password page; onAuthStateChange PASSWORD_RECOVERY gate
- `src/app/(auth)/login/page.tsx` — "Forgot password?" link
- `src/proxy.ts` — /reset-password excluded from logged-in redirect
- `tests/password-reset.spec.ts` — Playwright tests for password reset flow

**In Progress:** Nothing

**Blocked:** Nothing

**Next Steps:**
- Fix security bug: reset-password getSession fallback lets any logged-in user bypass recovery token → drop getSession fallback, rely solely on PASSWORD_RECOVERY event; wire SIGNED_OUT event to setTokenError to make "Link expired" branch live
- Add payments.status CHECK constraint (`IN ('pending','succeeded','refunded','failed')`) via new migration
- Confirm with Andy: should logged-in users be able to reach /forgot-password? Currently bounced to dashboard.
- `supabase db push` to apply asa_number + payments migrations to remote
- Continue Phase 2: next is 2.3 (Stripe Checkout Session creation)

**Context:**
- payments table uses amount_cents (INT) — no decimal money, amounts in USD cents throughout
- types.ts regen still wipes Course + CourseType aliases — re-append manually after every regen
- reset-password page uses onAuthStateChange to gate the form; PASSWORD_RECOVERY event fires reliably on hash fragment load so the getSession fallback is both redundant and a security gap
- auth actions (login, register, requestPasswordReset, updatePassword) all return `{ error: string | null }` rather than `string | null` — pre-existing pattern in auth group, flag for future harmonization

**Code Review:** 2 bugs to fix (reset-password security gap + dead tokenError code), 1 schema hardening (CHECK on payments.status), 1 consistency note (auth action return type vs. convention), 1 low-severity proxy question (logged-in /forgot-password redirect)

## Session 67 — 2026-04-15 15:48–16:22 (0.6 hrs)
**Duration:** 0.6 hours | **Points:** 4 pts
**Tasks:** Phase 2.1 (Stripe setup), Phase 1.6 (ASA number), 1.23 added to backlog

**Completed:**
- `src/lib/stripe.ts` — Stripe singleton server client, env guard, apiVersion 2026-03-25.dahlia
- `package.json` / `package-lock.json` — stripe npm package installed
- `.env.local` — STRIPE_SECRET_KEY + NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY + STRIPE_WEBHOOK_SECRET placeholder
- `supabase/migrations/20260415200027_add_asa_number_to_profiles.sql` — asa_number VARCHAR(20) on profiles
- `supabase/seed.sql` — Sam Davies seeded with ASA 101234
- `src/lib/supabase/types.ts` — regenerated; corrupt npm prompt header stripped; Course + CourseType convenience exports added
- `src/actions/profiles.ts` — updateProfile: auth guard added; is_active gated behind is_admin_caller flag
- `src/components/admin/profile-edit-form.tsx` — is_admin_caller hidden input; asa_number optional → nullable
- `src/app/(admin)/admin/students/page.tsx` — ASA # column in student list
- `src/app/(admin)/admin/students/[id]/page.tsx` — ASA # on student detail
- `src/app/(admin)/admin/students/[id]/edit/page.tsx` — asa_number in select query
- `src/app/(admin)/admin/instructors/[id]/edit/page.tsx` — asa_number added to select (ProfileEditForm requires it)
- `src/app/(student)/student/history/page.tsx` — ASA # shown on Experience page; .maybeSingle() fix
- `tests/asa-number.spec.ts` — 5 Playwright tests (admin list, detail, edit, student experience view)
- `docs/PROJECT_PLAN.md` — 1.23 added: student account page (3 pts)

**In Progress:** Nothing

**Blocked:** Nothing

**Next Steps:**
- `supabase db push` to apply asa_number migration to remote
- Run `npx playwright test tests/asa-number.spec.ts` to confirm 1.6 tests pass
- Continue Phase 1 backlog: 1.8 (password reset), 1.7 (experience level codes), 1.23 (student account page)
- Or jump to Phase 2: next is 2.2 (schema migration — stripe_customer_id, payments table)

**Context:**
- types.ts regen wiped hand-written Course + CourseType exports — added them back as derived row type aliases at bottom of file. Any future regen will wipe them again — re-add manually or fix the regen command to append them
- updateProfile is_active is only applied when is_admin_caller=true hidden field present — student-facing form (1.23) should NOT include that hidden field
- STRIPE_WEBHOOK_SECRET left commented in .env.local — fill in during 2.5
- Stripe test keys are in .env.local; need to add to Vercel env config before any 2.x task deploys

**Code Review:** 5 findings addressed — corrupt types.ts header, updateProfile missing auth guard + is_active self-deactivation vector, asa_number type (optional vs nullable), instructor edit page missing asa_number in select, student history profile query .single() → .maybeSingle()

## Session 66 — 2026-04-15 15:12–15:43 (0.5 hrs)
**Duration:** 0.5 hours | **Points:** 12 pts
**Tasks:** Phase 1 housekeeping + 6.3/6.4 ui-reviewer

**Completed:**
- `docs/PROJECT_PLAN.md` — 1.4 marked complete (architect confirmed existing statuses sufficient, no schema changes)
- `~/.claude/skills/restart-this/SKILL.md` — added Step 1 to stamp `[RESUMED HH:MM]` in session log on wake
- `~/.claude/skills/kill-this/SKILL.md` — split Playwright question into two separate questions
- `npm run lint` — 3 issues fixed: eslint-disable on `theme-toggle.tsx` hydration pattern, unused `browser` fixture in `instructor-cascade.spec.ts`, unused `PASSWORD` import in `instructor-views.spec.ts`
- Code review deferrals (4): removed redundant `getUser()` + redirect from `instructor/students/[id]/page.tsx`, error element fixed in `student/history/page.tsx`, stale empty message fixed, migration comment added
- **6.3 — @ui-reviewer full audit:** 8 pages × 3 viewports, scored 7.75/10. Key findings: S1 nav token wrong, S3 amber hardcoded light color, layout padding DEC-017 violations, rounded-xl on table wrappers, stat card sizing, heading weights
- **6.4 — Implement findings (all High + Medium):**
  - `admin-nav.tsx`, `admin-mobile-nav-drawer.tsx`, `instructor-desktop-nav.tsx`, `instructor-mobile-nav-drawer.tsx`, `student-nav.tsx`, `mobile-nav-drawer.tsx` — S1: `bg-foreground text-background` → `bg-accent text-accent-foreground`
  - `globals.css` — added `--warning` token (oklch amber, light + dark values)
  - `admin/dashboard/page.tsx` — S3: `bg-amber-50`/`text-amber-700` → `bg-warning/10`/`text-warning` throughout
  - `(admin)/layout.tsx`, `(instructor)/layout.tsx` — `p-4 md:p-8` on `<main>`, removed `p-8` from all 19 admin/instructor pages
  - 5 admin list pages — `rounded-xl` → `rounded-lg` on table wrappers
  - Student + instructor dashboards — stat cards `size="sm"`
  - Admin + instructor student detail pages — "Course History" `font-medium` → `font-semibold`
  - `src/components/ui/badge.tsx` — `rounded-4xl` → `rounded-lg` (badge/card rounding consistency)
- `docs/PROJECT_PLAN.md` — added end-of-phase @ui-reviewer tasks to Phases 2–5 (2.12, 3.14, 4.8, 5.9)

**In Progress:** Nothing

**Blocked:** Nothing

**Next Steps:**
- Continue Phase 1: 1.6 (ASA number), 1.8 (password reset), 1.7 (experience level codes), 1.9 (unsaved changes guard)
- Phase 2 (Payments) is the critical path — can start 2.1 (Stripe account setup) once Phase 1 is clean

**Context:**
- `--warning` token: `oklch(0.68 0.16 67)` light / `oklch(0.80 0.15 67)` dark. Use `bg-warning/10` for card bg, `text-warning` for text, `border-warning/40` for border
- Badge rounding fixed in `components/ui/badge.tsx` (shadcn component edited deliberately — no reasonable workaround)
- Layout padding now lives in `(admin)/layout.tsx` and `(instructor)/layout.tsx` `<main>` — pages should not add their own `p-*` outer wrapper
- 6.3/6.4 marked complete ahead of Phase 6 — end-of-phase ui-reviewer tasks added at each phase boundary for ongoing quality checks

## Session 65 — 2026-04-15 11:06–14:56 (0.6 hrs)
**Duration:** 0.6 hours | **Points:** 5 pts
**Task:** Phase 1.5 — Student history/Experience view

**Completed:**
- `src/lib/student-history.ts` — shared `fetchStudentHistory()` helper; sorts by newest session date
- `src/components/student/student-history-list.tsx` — thin wrapper around `CourseAttendanceCard`, reusable across roles
- `src/app/(student)/student/history/page.tsx` — "Experience" page for students; own history
- `src/app/(admin)/admin/students/[id]/page.tsx` — admin view of any student's profile + full history; breadcrumb + Edit link
- `src/app/(instructor)/instructor/students/[id]/page.tsx` — instructor view of any student's full history
- `src/components/student/student-nav.tsx` + `mobile-nav-drawer.tsx` — "Experience" nav link added
- `src/app/(admin)/admin/students/page.tsx` — "View" link added alongside "Edit" in student list
- `src/app/(instructor)/instructor/sessions/[id]/page.tsx` — student names in roster are now links
- `supabase/migrations/20260415184644_instructor_cross_course_read.sql` — 5 new SELECT policies giving instructors read access to all enrollments, attendance, sessions, courses, and student profiles
- `supabase/tests/01_rls_profiles.sql`, `02_rls_courses.sql`, `03_rls_enrollments.sql` — pgTAP counts updated to reflect broadened instructor access
- `tests/student-history.spec.ts` — 36 tests across 3 viewports (26 pass, 10 skip by design)

**In Progress:** Nothing

**Blocked:** Nothing

**Next Steps:**
- Fix 4 code review deferrals (quick, top of next):
  1. `instructor/students/[id]/page.tsx` — remove redundant `getUser()` + redirect (middleware already guards; admin page doesn't do this)
  2. `student/history/page.tsx:12` — error display: `<div className="text-destructive">` → `<p className="text-sm text-destructive">`
  3. `instructor/students/[id]/page.tsx:57` — stale `emptyMessage`: "No history found for courses you teach." → "No course history for this student."
  4. Migration dead-policy comment: add note in `20260415184644_instructor_cross_course_read.sql` that the narrow baseline policies are superseded but retained (OR semantics, not a bug)
- Then: 1.4 (course status audit via @architect), 1.6 (ASA number), 1.8 (password reset)
- Remember: `supabase db push` to apply migration to remote (user confirmed done this session)

**Context:**
- Instructor RLS was scoped to own-courses only on all four tables (enrollments, session_attendance, sessions, courses) + profiles — all needed new broad policies for the Experience view to work
- `fetchStudentHistory` accepts untyped `SupabaseClient` — consistent with existing tech debt; deferred to types.ts regeneration pass
- `/kill-this` Playwright question is ambiguous ("Did you run it? If not, want to?") — "yes" answer is ambiguous; needs two separate questions
- `/restart-this` does not stamp a `[RESUMED HH:MM]` line in the session log — gap identified, needs fix

**Code Review — Findings:**
1. `20260415184644_instructor_cross_course_read.sql` — superseded narrow baseline policies not dropped; still present alongside new broad ones. Not a runtime bug (OR semantics), but clutters dashboard. Deferred: add comment to migration.
2. `instructor/students/[id]/page.tsx:14–15` — redundant `getUser()` + redirect; middleware already handles it. Fix next session.
3. `student/history/page.tsx:12` — error element/sizing inconsistent with established pattern. Fix next session.
4. `instructor/students/[id]/page.tsx:57` — stale empty message. Fix next session.

## Session 64 — 2026-04-14 19:52–20:50 (1.0 hrs)
**Duration:** 1.0 hours | **Points:** 2 pts
**Task:** Phase 1.21 deferrals — code review fixes from Session 63

**Completed:**
- `src/components/instructor/instructor-desktop-nav.tsx` — exact-match guard for dashboard link; `pathname === href || (href !== '/instructor/dashboard' && pathname.startsWith(href))`; mirrors AdminNav pattern
- `tests/dev-login-helper.spec.ts` — `test.beforeEach` with `test.skip(!process.env.NEXT_PUBLIC_DEV_MODE, …)` guard; prevents misleading "element not found" CI failures
- `playwright.config.ts` — dotenv load of `.env.local` at top; makes `NEXT_PUBLIC_DEV_MODE` (and other vars) available to the test process, not just the app server
- `src/app/(auth)/login/page.tsx` — wrapper div indentation fixed
- `CLAUDE.md` — updated workers convention: workers=4 locally, workers=1 in CI

**In Progress:** Nothing

**Blocked:** Nothing

**Next Steps:**
- Fix 1 code review deferral from this session (quick, top of next):
  1. `instructor-mobile-nav-drawer.tsx:73` — mirror the exact-match guard applied to desktop nav; mobile drawer still uses bare `startsWith`
- Then: 1.4 (course status review via @architect), 1.6 (ASA number), 1.8 (password reset)

**Context:**
- dotenv load in `playwright.config.ts` is the right pattern for making `.env.local` vars available to test skip guards; without it, `process.env.NEXT_PUBLIC_DEV_MODE` is undefined in the test runner even if the app server sees it
- The exact-match guard in the desktop nav is technically dead code right now (only one link, no child routes), but it prevents a silent bug when nav grows
- workers=4 locally is the tested correct value; CLAUDE.md was stale

**Code Review — Findings:**
1. `instructor-mobile-nav-drawer.tsx:73` — mobile drawer still uses bare `startsWith`; desktop and mobile are now inconsistent. Deferred to next session.
2. `playwright.config.ts` — `workers: 4` locally — CLAUDE.md updated this session to match.

## Session 63 — 2026-04-14 16:53–17:15 (0.37 hrs)
**Duration:** 0.37 hours | **Points:** 2 pts
**Task:** Phase 1.21 — dev login helper + Session 62 code review deferrals

**Completed:**
- `src/components/instructor/instructor-desktop-nav.tsx` — new client component, pathname-based active link; mirrors AdminNav pattern; replaces hardcoded active class in instructor desktop sidebar
- `src/app/(instructor)/layout.tsx` — wired InstructorDesktopNav; removed hardcoded Link
- `src/components/instructor/instructor-mobile-nav-drawer.tsx` — active-link: strict equality → startsWith (consistent with admin/student)
- `tests/instructor-mobile-nav.spec.ts` — "aside sidebar hidden on mobile" now asserts `aside` not in viewport (real assertion); all if/skip/return guards → test.skip(condition, reason)
- `src/components/dev-login-helper.tsx` — NEXT_PUBLIC_DEV_MODE-gated Select dropdown; fills uncontrolled form inputs + calls requestSubmit(); 7 seed users
- `src/app/(auth)/login/page.tsx` — wired DevLoginHelper below Card in flex-col wrapper
- `NEXT_PUBLIC_DEV_MODE=true` added to `.env.local`
- `tests/dev-login-helper.spec.ts` — 4 tests: dropdown visible, admin/student/instructor quick login; all green

**In Progress:** Nothing

**Blocked:** WSL2 networking stall at session end (wsl --shutdown to recover; unrelated to code)

**Next Steps:**
- Fix 3 code review deferrals from this session (quick, do top of next):
  1. `instructor-desktop-nav.tsx:23` — mirror AdminNav exact-match guard for dashboard link
  2. `dev-login-helper.spec.ts` — add `test.skip(!process.env.NEXT_PUBLIC_DEV_MODE, …)` guard
  3. `login/page.tsx` — fix indentation on wrapper div
- Then: 1.4 (course status audit via @architect), 1.6 (ASA number), 1.8 (password reset)
- Note: playwright.config.ts has workers:4 for non-CI (pre-existing, flagged by code review)

**Context:**
- DevLoginHelper fills uncontrolled inputs directly (no React setState needed) then calls requestSubmit() — works because the login form inputs have no value/onChange props
- NEXT_PUBLIC_DEV_MODE guard works at runtime but entire component (including seed emails + password) is still in the client bundle on any build where the var is true — fine for local dev, don't set this var on any externally accessible deployment
- test.skip(condition, reason) works correctly even after async loginAs/goto calls

**Code Review — Deferrals (fix next session):**
1. `instructor-desktop-nav.tsx:23` — startsWith without exact-match dashboard guard; diverges from AdminNav pattern; harmless now (1 link) but will silently differ when nav grows
2. `dev-login-helper.spec.ts` — no NEXT_PUBLIC_DEV_MODE skip guard; will fail in CI with misleading "element not found" instead of a skip
3. `login/page.tsx` — wrapper div indentation inconsistent with surrounding JSX

## Session 62 — 2026-04-14 11:55–12:20 (0.42 hrs)
**Duration:** 0.42 hours | **Points:** 2 pts
**Task:** Phase 1.20 — instructor mobile hamburger menu + CLAUDE.md workflow guardrails

**Completed:**
- `src/components/instructor/instructor-mobile-nav-drawer.tsx` — new drawer component: hamburger top bar, slide-out drawer, close button, overlay dismiss, RoleToggle for dual-role users
- `src/app/(instructor)/layout.tsx` — `hidden md:flex` on desktop aside, drawer wired in, `name ?? ''` type fix
- `tests/instructor-mobile-nav.spec.ts` — 9 tests across mobile/desktop (hamburger visible, open/close, label, overlay dismiss, dual-role toggle, single-role negative)
- `tests/dual-role-nav.spec.ts` — open drawer before clicking Switch to Student View on mobile; removed stale "no mobile drawer" comment
- `CLAUDE.md` — Plan-before-code step added to Micro Workflow; new "Approval Before Action" section; full-suite guardrail (ask user, don't auto-run)
- `docs/PROJECT_PLAN.md` — 1.20 marked complete; 1.21 (dev login helper, 2 pts) added

**In Progress:** Nothing

**Blocked:** Nothing

**Next Steps:**
- Task 1.21 — dev login helper (dropdown of seed users, auto-fill + submit, gated by `NEXT_PUBLIC_DEV_MODE=true`)
- Then: 1.4 (course status audit via @architect), 1.6 (ASA number), 1.8 (password reset)

**Context:**
- CSS `transform` doesn't affect Playwright's `isVisible()` — use `not.toBeInViewport()` to assert a translated-off-screen drawer is closed
- `getByText('Instructor')` strict mode violation: matches both "Instructor" and "PW Instructor" — use `{ exact: true }`
- For mobile tests in drawer specs, open the drawer before asserting any link inside it (pattern established in 1.13 and confirmed here)

**Code Review — Deferrals (fix later):**
1. `instructor-mobile-nav-drawer.tsx:73` — active-link uses strict equality only; admin/student use `startsWith` guard. Fix when a second instructor page lands.
2. `instructor-layout.tsx` desktop sidebar — hardcoded active class instead of `pathname`-based conditional. Same fix, same trigger.
3. `instructor-mobile-nav.spec.ts` — `aside sidebar hidden on mobile` test is redundant; remove or give it a real `aside` visibility assertion.
4. `instructor-mobile-nav.spec.ts` — inline `if/skip/return` guards could use `test.skip(condition, reason)` one-liner. Low urgency.

## Session 61 — 2026-04-14 10:32–11:27 (0.92 hrs)
**Duration:** 0.92 hours | **Points:** 2 pts
**Task:** Code review deferrals (Session 60) + 1.13 dual-role nav toggle

**Completed:**
- `window.confirm` standardized across all admin components (`course-status-actions.tsx`, `session-row.tsx`, `enrollment-actions.tsx`, `instructor-actions.tsx`, `profile-edit-form.tsx`)
- Confirm dialog wording unified: both deactivation paths say "remove them from all assigned courses and sessions"
- `supabase/tests/05_cascade.sql` — pre-condition count=1 assertions before `is_instructor=FALSE` block; plan(6) → plan(8)
- `src/components/role-toggle.tsx` — new server component, renders a Link
- `src/app/(student)/layout.tsx` — fetches `is_instructor`, shows RoleToggle, passes `isInstructor` to MobileNavDrawer
- `src/app/(instructor)/layout.tsx` — fetches `is_student`, shows RoleToggle
- `src/components/student/mobile-nav-drawer.tsx` — accepts `isInstructor` prop, shows toggle in drawer; removed dead `themePreference` prop
- `tests/dual-role-nav.spec.ts` — 18 tests across 3 viewports; mobile drawer opened before click/assert
- `docs/PROJECT_PLAN.md` — added 1.20 (instructor mobile hamburger menu, 2 pts)

**In Progress:** Nothing

**Blocked:** Nothing

**Next Steps:**
- Task 4.1 — instructors are students by default (migration + seed, discussed this session, deferred to 4.1)
- Then: 1.4 (course status audit via @architect), 1.6 (ASA number), 1.8 (password reset), 1.20 (instructor mobile hamburger)

**Context:**
- On mobile, student drawer must be opened before interacting with the toggle link
- Instructor layout has no mobile drawer — sidebar always visible, no hamburger (tracked as 1.20)
- Chris Marino (`chris@ltsc.test`) is the only seed user with both roles until 4.1

**Code Review:** Clean Bill of Health

## Session 60 — 2026-04-14 10:07–10:29 (0.37 hrs)
**Duration:** 0.37 hours | **Points:** 0 pts
**Task:** Session 59 code review deferrals — cascade trigger hardening + test quality

**Completed:**
- `supabase/migrations/20260414141053_fix_cascade_null_coercion.sql` — new migration:
  `IS TRUE`/`IS FALSE` NULL-safe comparisons in cascade trigger; `DROP TRIGGER IF EXISTS`
  makes the trigger creation idempotent on re-run
- `src/components/admin/profile-edit-form.tsx` — `window.confirm()` guard on deactivation
  path (edit form was the silent second path DEC-019 names; toggle button already had it)
- `supabase/tests/05_cascade.sql` — test 3: assert Lisa Chen's specific count (1) instead
  of `isnt(count, 0)`; test 5+6: re-assign session before is_instructor=FALSE path and add
  session-level assertion (session cascade on that path was untested); plan(5) → plan(6)
- `tests/instructor-cascade.spec.ts` — scope instructor cell check to `td.nth(1)` instead
  of `getByRole('cell', { name: '—' }).first()` (price column also renders '—'); wait for
  `toBeEnabled()` on Activate teardown so server round-trip confirms before test ends
- 65 pgTAP / 113 Playwright — all green

**In Progress:** Nothing

**Blocked:** Nothing

**Next Steps:**
- Code review found 3 deferred items (see below) — quick fixes, worth doing top of next session
- Then: 1.13 (dual-role nav toggle), 1.6 (ASA number), 1.8 (password reset),
  or 1.4 (course status audit via @architect)

**Context:**
- `toBeEnabled()` was key: optimistic UI update makes `toBeVisible()` pass immediately,
  masking a not-yet-committed server action. `toBeEnabled()` waits for `pending=false` which
  means the transition completed and the DB update committed.
- The Next.js dev-mode `performance.measure` error on InstructorSessionRosterPage is a
  Next.js internal bug (negative timestamp on interrupted async Server Component). Does not
  affect production. Not fixable in app code.

**Code Review — Deferred (fix next session):**
1. `profile-edit-form.tsx:37` vs `instructor-actions.tsx:14` — confirm dialog wording
   diverged: "remove them from all assigned courses and sessions" vs "...course and session
   assignments." Same cascade, should be identical wording.
2. `window.confirm` vs bare `confirm` — split across codebase; `profile-edit-form` and
   `instructor-actions` use `window.confirm`, other files use bare `confirm`. Pick one.
3. `05_cascade.sql` tests 5+6 — "went to zero" assertions without pre-condition "was non-zero
   first." Add count=1 assertions before the `UPDATE profiles SET is_instructor = FALSE`
   block to prevent vacuous passes.

## Session 59 — 2026-04-14 08:55–09:25 (0.50 hrs)
**Duration:** 0.50 hours | **Points:** 2 pts
**Task:** Phase 1.3 — Inactive instructor cascade

**Completed:**
- `supabase/migrations/20260414125953_instructor_deactivation_cascade.sql` — SECURITY DEFINER trigger function + trigger; NULLs instructor_id on courses and sessions when is_active → false (while instructor) or is_instructor → false. One-way cascade.
- `src/components/admin/instructor-actions.tsx` — window.confirm() guard before Deactivate fires
- `supabase/tests/05_cascade.sql` — 5 pgTAP tests; 64/64 total passing
- `tests/instructor-cascade.spec.ts` — 2 Playwright tests (cascade flow + dialog dismiss); 113/113 full suite passing
- `docs/DECISIONS.md` — DEC-019; documents SECURITY DEFINER choice and one-way behavior

**In Progress:** Nothing

**Blocked:** Nothing

**Next Steps:**
- Address code review deferrals (see below) — quick fixes worth doing at top of next session
- Then: 1.4 (course status audit via @architect), 1.6 (ASA number field), 1.8 (password reset), or 1.13 (dual-role nav toggle)

**Context:**
- Two deactivation paths exist: toggle button (InstructorActions) and edit form (ProfileEditForm). Only the toggle has the confirm dialog — edit form path is silent (deferred fix).
- Sessions in seed have NULL instructor_id; pgTAP tests set explicit values within the transaction.
- SECURITY DEFINER chosen because trigger may run outside an admin JWT context (service role, future background jobs).

**Code Review — Deferred (fix next session):**
1. `profile-edit-form.tsx` — No confirm dialog on edit form deactivation path (second path DEC-019 names). Silent cascade.
2. `migration line 17` — `OLD.is_active = TRUE` → `OLD.is_active IS TRUE` (NULL coercion edge case, cheap fix).
3. `05_cascade.sql test 3` — "other instructors untouched" uses `isnt(count, 0)` instead of asserting a specific known instructor's count. Weaker assertion.
4. `05_cascade.sql test 5` — is_instructor=FALSE branch has no session-level assertion. Session cascade on that path is untested.
5. `instructor-cascade.spec.ts line 52–55` — `getByRole('cell', { name: '—' }).first()` may grab wrong cell if other columns also render '—'. Fragile selector.
6. `migration` — Missing `DROP TRIGGER IF EXISTS` before `CREATE TRIGGER`. Not idempotent on re-run.

## Session 58 — 2026-04-14 08:28–08:51 (0.42 hrs)
**Duration:** 0.42 hours | **Points:** 2 pts
**Task:** Code review stragglers + Task 1.12 — Past courses not enrollable

**Completed:**
- `src/app/(instructor)/instructor/dashboard/page.tsx:68` — Total Students stat: `!= 'cancelled'` → `=== 'confirmed'` (consistent with seat count on line 99, same render pass)
- `src/app/(admin)/admin/students/page.tsx:54` — added comment clarifying intentional `!= 'cancelled'`: includes `registered`, `confirmed`, and `completed`; only excludes `cancelled`
- `src/app/(student)/student/courses/page.tsx` — post-fetch JS filter hides active courses where every session date < today; courses with zero sessions remain visible
- `tests/student-enrollment.spec.ts` — new test: admin creates active course with 2020 session date, confirms it's absent from student browse; 10/10 pass, mobile green
- `docs/PROJECT_PLAN.md` — added then removed Task 6.14 (uncancel session — decided it's a testing convenience, not a product feature)

**In Progress:** Nothing

**Blocked:** Nothing

**Next Steps:**
- Task 1.3 — Inactive instructor cascade (or next Phase 1 task of your choosing)
- Known edge case accepted: active course with one future *cancelled* session + one past *scheduled* session still shows — pathological enough to ignore

**Context:**
- UTC-only date comparison for "past course" filter — consistent with instructor dashboard. A student in UTC-4 at 10pm could lose visibility of a course whose last session was that day. Accepted.
- Code review noted `as unknown as` double-cast on sessions is unnecessary; left as-is to match existing file pattern — type debt fix tracked separately.

**Code Review:** Comment missing `completed` status — fixed in follow-up commit. Magic date `2020-06-01` in test has no comment — left, not blocking. No RLS gaps. No pattern violations.

## Session 57 — 2026-04-14 00:00–00:08 (0.13 hrs)
**Duration:** 0.13 hours | **Points:** 0 pts
**Task:** Tooling — Playwright workers=1 default + targeted test protocol

**Completed:**
- `playwright.config.ts` — `workers: undefined` → `workers: 1` for local dev (eliminates parallel-load flakiness; benchmark `--workers=4` vs default to verify speed claim)
- `CLAUDE.md` — added targeted Playwright conventions: run specific file + `--project=desktop` during development, full suite before every commit
- `src/components/admin/session-row.tsx` — Delete button variant cleanup (`text-amber-500` → `variant="destructive"`) that was left unstaged from session 56

**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** Task 1.12 — Past courses not enrollable (plus the two code review stragglers from session 56: `instructor/dashboard.tsx:68` Total Students stat and `admin/students/page.tsx:54` enrollment count)

---

## Session 56 — 2026-04-13 23:17–23:57 (0.67 hrs)
**Duration:** 0.67 hours | **Points:** 0 pts
**Task:** Phase 1.11 follow-up — fix remaining `!= 'cancelled'` enrollment count locations; diagnose 3 failing attendance tests

**Completed:**
- `src/app/(admin)/admin/courses/page.tsx:68` — "Enrolled / Cap" column → `=== 'confirmed'`
- `src/app/(admin)/admin/dashboard/page.tsx:176` — today's sessions capacity column → `=== 'confirmed'`
- `src/app/(instructor)/instructor/dashboard/page.tsx:99` — per-session enrollment count → `=== 'confirmed'`
- Diagnosed 3 failing attendance tests — root cause was Supabase not fully started after upgrade. Tests pass green once Supabase is up (11/11 attendance spec, 109/150 full suite)
- Confirmed the 1 remaining failure is the pre-existing flaky "enrolled course card shows Pending confirmation badge" test (known from session 54, flakes under parallel load)

**In Progress:** Nothing

**Blocked:** Nothing

**Next Steps:**
- Address code review findings (deliberate exceptions need either a fix or a comment):
  - `instructor/dashboard/page.tsx:68` — "Total Students" stat card still uses `!= 'cancelled'`; creates internal inconsistency in same file (stat card counts `registered` but session seat count doesn't). Likely should also use `=== 'confirmed'`
  - `admin/students/page.tsx:54` — student enrollment activity count still uses `!= 'cancelled'`; now the last straggler. Add comment or fix
- Task 1.12 — Past courses not enrollable

**Context:**
- After `supabase upgrade` + `db reset`, let Supabase fully start before running tests — cold start causes 404 on attendance page (server component queries return null)
- pgTAP count tests will show inflated numbers if test data hasn't been cleared; run `supabase db reset` before running pgTAP to get accurate counts
- Two intentional `!= 'cancelled'` exceptions were left in (roster student-ID set and student activity count) but code review flagged instructor dashboard line 68 as creating a confusing inconsistency within a single render pass

**Code Review:**
- Instructor dashboard line 68 (`Total Students` stat) diverges from line 99 (seat count) — `registered` users appear in the stat but not the count; confusing if any `registered` enrollments exist. Recommend updating to `=== 'confirmed'` for consistency.
- `admin/students/page.tsx:54` is now the only remaining `!= 'cancelled'` in UI code. Either update or add explanatory comment.

---

## Session 55 — 2026-04-13 (tooling)
**Duration:** ~15 min | **Points:** 0 pts
**Task:** Skill refactor — move time calc and point tally from `/kill-this` to `/its-dead`

**Completed:**
- `/home/eric/.claude/skills/kill-this/SKILL.md` — removed Steps 3 & 4 (time calc, point tally); draft now shows `[TBD]` placeholders; closing prompt directs user to pass time adjustments to `/its-dead`
- `/home/eric/.claude/skills/its-dead/SKILL.md` — new Step 0 does full time calc (with adjustment args), point tally, and fills `[TBD]` before writing the log
- `CLAUDE.md` — skills table updated to reflect new split

**Why:** After `/kill-this` the session isn't actually over — code review runs, bugs get found during testing, last-minute fixes happen. Session end time should be captured when `/its-dead` runs, not when `/kill-this` runs. Time adjustment arg (`subtract N minutes`) moves to `/its-dead` as well.

**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** Resume Phase 1 work — fix the 4 remaining `!= 'cancelled'` enrollment count locations, then Task 1.12

---

## Session 54 — 2026-04-13 22:22–22:55 (0.58 hrs)
**Duration:** 0.58 hours | **Points:** 3 pts
**Task:** Phase 1.11 — Spots remaining fix

**Completed:**
- `supabase/migrations/20260414022518_fix_enrollment_count_confirmed_only.sql` — updated both RPCs
  (`get_all_course_enrollment_counts`, `get_course_active_enrollment_count`) from
  `status != 'cancelled'` to `status = 'confirmed'`
- `src/app/(admin)/admin/courses/[id]/page.tsx` — capacity JS filter changed to match RPCs
- `tests/helpers.ts` — `confirmTestEnrollment()` helper added; uses `waitForLoadState('networkidle')`
  before closing context to prevent in-flight server action cancellation
- `tests/student-enrollment.spec.ts` — spots badge assertion updated (2→3, scoped to c001 card);
  enroll flow assertion corrected (registered doesn't decrement spots); new "spot count decreases
  on admin confirm, not on student registration" test; both capacity tests now confirm via admin
  before Jordan checks for Full

**In Progress:** Nothing

**Blocked:** Nothing

**Next Steps:**
- Fix the 4 remaining `!= 'cancelled'` enrollment count locations flagged by code review:
  - `admin/courses/page.tsx:68` — "Enrolled / Cap" column (capacity display → use `confirmed`)
  - `admin/dashboard/page.tsx:176` — today's sessions capacity column (→ use `confirmed`)
  - `instructor/dashboard/page.tsx:99` — upcoming sessions enrollment count (→ use `confirmed`)
  - `instructor/dashboard/page.tsx:68` — roster student ID set (deliberate: registered students in pipeline, probably leave as `!= 'cancelled'`)
  - `admin/students/page.tsx:54` — student activity count (deliberate decision: current enrollments vs confirmed-only)
- Then pick up Task 1.12 — Past courses not enrollable

**Context:**
- `confirmTestEnrollment` must call `waitForLoadState('networkidle')` before closing the context —
  closing mid-transition cancels the in-flight fetch and the DB write never happens
- The 2 pre-existing flaky tests ("enrolled course card shows Pending confirmation badge" and
  "re-visiting an enrolled course") continue to flake under parallel load — pre-existing, unrelated
- As Andy noted: this fix may become moot when Phase 2 Stripe payments ship — the checkout flow
  will likely bypass `registered` status entirely and go straight to `confirmed`

**Code Review:**
- 4 remaining locations still use `status !== 'cancelled'` for enrollment counting:
  admin courses list, admin dashboard, instructor dashboard (×2), and admin students page.
  The capacity displays (courses list, dashboard) are unambiguously wrong relative to this fix.
  The roster inclusion and student activity count may be intentional different semantics — need
  a deliberate call before updating them.

## Session 53 — 2026-04-13 18:28–18:41 (0.22 hrs)
**Duration:** 0.22 hours | **Points:** 2 pts
**Task:** Phase 1.2 — Revert active course to draft status

**Completed:**
- `src/actions/courses.ts` — added `revertToDraft` action (sets status → 'draft', revalidates both paths); follows same shape as publishCourse/completeCourse/cancelCourse siblings
- `src/components/admin/course-status-actions.tsx` — imported `revertToDraft`; added "Revert to Draft" button that renders when status === 'active', wrapped both active-state buttons in a Fragment
- `tests/admin-course-crud.spec.ts` — new "course status transitions" describe block; test creates a fresh draft course (self-contained, no seed state dependency), publishes it, reverts to draft, confirms badge + button state at each step; 3/3 viewports passing

**In Progress:** Nothing
**Blocked:** Nothing

**Next Steps:**
- Task 1.11 — Spots remaining fix (only count confirmed enrollments against capacity; UI language cleanup)
- Task 1.12 — Past courses not enrollable (filter student browse to exclude courses with all sessions in the past)
- Task 1.3 — Inactive instructor cascade (DB function; warning tile already exists)

**Context:**
- Status transition actions (publish/revert/complete/cancel) all skip the auth guard that createCourse/updateCourse have — RLS enforces admin-only at DB level, but error message is "row-level security policy" not "Unauthorized" — deferred cleanup, pre-Phase 2
- Pending spinner on "Revert to Draft" and "Mark Completed" drops the label text (inconsistency with "Publish" which shows "Publishing…") — deferred to Phase 5 polish

**Code Review:**
- All status-transition actions missing explicit admin auth guard — RLS blocks the write but surfaces ugly error message; deferred, pre-existing pattern
- "Revert to Draft" and "Mark Completed" drop button label during pending state; "Publish" shows "Publishing…" — inconsistency; deferred to polish pass
- Suggest adding `expect(Cancel Course button).toBeVisible()` assertion in active-state check — minor test coverage gap
- Magic-string statuses ('draft', 'active', etc.) should eventually live in constants — pre-existing, low urgency

## Session 52 — 2026-04-13 14:22–14:49 (0.42 hrs)
**Duration:** 0.42 hours | **Points:** 2 pts
**Task:** Phase 1.17 — Session row Action dropdown

**Completed:**
- `src/components/admin/session-row.tsx` — replaced 4-button cluster with single `···` DropdownMenu; items: Edit/Close (toggle), Attendance (link), Cancel session, Delete; added `data-session-id` to `<TableRow>`
- `src/components/admin/session-actions.tsx` — deleted; logic inlined into SessionRow
- `src/components/ui/dropdown-menu.tsx` — shadcn component (user-installed)
- `tests/admin-course-crud.spec.ts` — edit tests updated to open dropdown → click menuitem
- `tests/attendance-cancellation.spec.ts` — cancel flow updated to open dropdown
- `tests/helpers.ts` + `tests/instructor-views.spec.ts` — sessionId extraction switched from Attendance link href to `[data-session-id]` attribute
- `.claude/agents/code-review.md` — clean review now outputs "Clean Bill of Health"
- `.claude/skills/kill-this/SKILL.md` + `CLAUDE.md` — @code-review now runs automatically after every commit (was "optional")

**In Progress:** Nothing
**Blocked:** Nothing

**Next Steps:**
- Task 1.18 — Add logo to login page and favicon (ask Andy for SVG/PNG files)
- Or pick up Phase 1: 1.2 (Draft status), 1.11 (spots remaining fix), 1.12 (past courses)

**Context:**
- Attendance is a DropdownMenuItem asChild wrapping a Link — not in DOM when menu is closed; `data-session-id` on TableRow is the stable test handle for extracting sessionIds
- Delete uses `variant="destructive"` (red) — amber was considered, destructive is semantically correct
- Two student-enrollment flaky tests (parallel load) are pre-existing, unrelated to this change

**Code Review:**
- `variant="destructive"` preferred over `text-amber-500` on Delete — fixed this session
- `session-row.tsx` at 247 lines (47 over 200-line limit) — deferred; `SessionEditForm` extraction is the clean split

## Session 51 — 2026-04-13 11:07–11:18 (0.17 hrs)
**Duration:** 0.17 hours | **Points:** 2 pts
**Task:** Phase 1.16 — Restore admin mobile hamburger menu

**Completed:**
- `src/components/admin/admin-mobile-nav-drawer.tsx` — new client component; sticky top bar with hamburger button, slide-in drawer with admin nav links, overlay, close button, sign-out + ThemeToggle in footer; exact mirror of student drawer
- `src/app/(admin)/layout.tsx` — aside now `hidden md:flex` (hidden on mobile); wrapped content in flex-col div; wired AdminMobileNavDrawer; fixed `name` type to `?? ''`
- `tests/admin-course-crud.spec.ts` — removed sidebar-specific `force:true` branch on create course (now plain `.click()`); removed desktop-only skips from edit-session tests; re-added those skips with corrected reason (overflow-x-scroll table, not sidebar); fixed strict-mode violation in edit-session assertion by scoping date cell check to the row containing `newLocation`

**In Progress:** Nothing
**Blocked:** Nothing

**Next Steps:**
- Task 1.17 — Session row Action dropdown (consolidate Attendance/Edit/Cancel/Delete into shadcn DropdownMenu, 2 pts)

**Context:**
- Admin session table is overflow-x-scroll; edit session tests remain desktop-only because the Edit button is in the rightmost column and scrolled off-screen on narrow viewports — same constraint as add-session
- The create course `force:true` branch is gone; button is in a form (not a table) so it works normally at all viewports after the sidebar fix

## Session 50 — 2026-04-13 10:28–10:47 (0.33 hrs)
**Duration:** 0.33 hours | **Points:** 3 pts
**Task:** Phase 1.1 — Inline session editing

**Completed:**
- `src/actions/sessions.ts` — added `updateSession` action (date, start_time, end_time, location)
- `src/components/admin/session-row.tsx` — new client component; Fragment with main row + optional inline edit sub-row; Close button toggles form; form uses useTransition + onSubmit pattern
- `src/app/(admin)/admin/courses/[id]/page.tsx` — refactored to use SessionRow; removed inline Fragment rendering; cleaned unused imports
- `tests/admin-course-crud.spec.ts` — 2 new desktop tests: edit saves + Close dismisses
- `docs/BRAND.md` — --radius: 0.125rem documented
- `docs/PROJECT_PLAN.md` — 1.1 marked complete; 1.16 and 1.17 added; totals updated to 47 pts

**In Progress:** Nothing

**Blocked:** Nothing

**Next Steps:**
- Task 1.16 — Restore admin mobile hamburger menu (theme changes broke it, regression)
- Check what changed in the admin layout during theme work (likely `bg-white` → `bg-sidebar` or ThemeProvider wrapping changed something)
- Goal: hamburger visible + working on 375px, unblock admin mobile test skips

**Context:**
- Edit button toggles to "Close" (not "Cancel") — avoids collision with SessionActions' "Cancel session" button in PW selectors
- Edit form uses onSubmit + new FormData() pattern (not useActionState) so we can close the form on success without extra state tracking
- SessionActions (cancel/delete with prompt/confirm) intentionally kept as separate component — will merge into shadcn DropdownMenu in task 1.17
- Admin mobile layout has pre-existing fixed sidebar overlap (all admin tests use force:true or desktop-only skip) — not introduced here

## Session 49 — 2026-04-12 23:24–00:35 (1.17 hrs)
**Duration:** 1.17 hours | **Points:** 0 pts (completing 1.0 remainder)
**Task:** Phase 1.05 — Get Mira Sky/Mist preset actually applied

**Completed:**
- Diagnosed why theme wasn't showing: `@theme inline` var() references DO work at runtime — the problem was wrong color values, not the mechanism
- Reverted multiple failed experiments back to session 48 baseline
- Sourced exact b7CSfQ4Xo preset CSS by running `npx shadcn@latest init --preset b7CSfQ4Xo` in a scratch project (/home/eric/next-app)
- Ported correct oklch values to `src/app/globals.css` (:root and .dark)
- Set --radius to 0.125rem (2px) — almost square, brand-appropriate
- Sky-blue primary confirmed in both light and dark mode
- Dark mode toggle confirmed working

**In Progress:** Nothing

**Blocked:** Nothing

**Next Steps:**
- Update BRAND.md to record --radius: 0.125rem as the chosen value
- Mark task 1.0 fully complete in PROJECT_PLAN.md
- Move to task 1.1 — session editing (edit date/time/location/instructor)

**Context:**
- The `@theme inline` with var() references is the correct pattern — don't change it. Colors live in :root and .dark blocks only.
- Preset source of truth: /home/eric/next-app/app/globals.css (scratch project)
- Button/badge components use rounded-4xl which maps to --radius * 2.6, so even 2px base gives slightly rounded pill feel on small elements — acceptable
- Session 48 commit (5f09783) is the safe rollback point for theme machinery

## Session 48 — 2026-04-12 22:22–23:19 (0.92 hrs)
**Duration:** 0.92 hours | **Points:** 5 pts
**Task:** Phase 1.0 — Theme & dark mode

**Completed:**
- `src/app/globals.css` — Full rewrite with Mira preset hex CSS vars; `.dark` block replaces oklch defaults
- `src/app/layout.tsx` — Swapped Geist → Nunito Sans; added ThemeProvider wrapper; suppressHydrationWarning on html
- `src/components/theme-provider.tsx` — New; next-themes ThemeProvider (attribute="class", defaultTheme="dark")
- `src/components/theme-toggle.tsx` — New; HugeIcons sun/moon; fetch-based DB save via /api/theme; mounted guard
- `src/components/theme-sync.tsx` — New; writes directly to localStorage (not setTheme) on first session to avoid re-render cascade
- `src/app/api/theme/route.ts` — New Route Handler; saves theme_preference to DB without triggering router refresh
- `supabase/migrations/20260412222200_add_theme_preference_to_profiles.sql` — New; theme_preference column, default 'dark'
- `src/lib/supabase/types.ts` — Added theme_preference to Profile type
- `src/app/(admin|student|instructor)/layout.tsx` — Wired ThemeSync + ThemeToggle; profile fetch for DB preference
- `src/components/student/mobile-nav-drawer.tsx` — bg-white → bg-sidebar; ThemeToggle in drawer footer
- `tests/theme.spec.ts` — 15 tests × 3 viewports, all passing (defaults dark, toggle round-trip, visible student/instructor)

**In Progress:** Nothing

**Blocked:** Nothing

**Next Steps:**
- Run `supabase db push` to apply theme_preference migration to remote
- Update `docs/BRAND.md` and `.claude/agents/ui-reviewer.md` with Mira/Nunito Sans/dark-first (noted in 1.0 task)
- Mark Task 1.0 complete in PROJECT_PLAN.md
- Start Task 1.1 — Session editing (edit date, time, location, instructor on existing sessions)

**Context:**
- ThemeSync must write `localStorage.setItem('theme', preference)` directly — calling `setTheme()` in next-themes v0.4.6 creates an unstable reference loop that remounts ThemeToggle repeatedly. Using localStorage bypasses the context update entirely.
- Server actions from ThemeToggle trigger router refresh in Next.js 16 App Router even without revalidatePath — always use a Route Handler for fire-and-forget DB saves that must not refresh the page.
- pgTAP: 11 tests still failing (02_rls_courses, 03_rls_enrollments) — pre-existing, not caused by this session.

## Session 47 — 2026-04-12 20:41–21:28 (0.75 hrs)
**Duration:** 0.75 hours | **Points:** 2 pts
**Task:** Phase 0.17 — @ui-reviewer agent spec + theme planning

**Completed:**
- Created `~/.claude/agents/ui-reviewer.md` — ui-reviewer agent spec tuned to new SailBook design language: Mira preset (b7CSfQ4Xo), Nunito Sans, Sky accent on Mist base, xs border radius, dark mode default. Token-based color rules (no hardcoded zinc/gray classes), 12-point review checklist, scored output format (X/10 with High/Medium/Low findings table).
- `docs/BRAND.md` — updated Visual Direction: Mira theme, Nunito Sans, xs radius, dark default. Retired Oleg's Law, Geist, and zinc-only palette.
- `docs/DECISIONS.md` — added D-018: Theme & Visual Refresh rationale (preset over custom, theme preference in profiles table, no localStorage).
- `docs/PROJECT_PLAN.md` — marked 0.17 complete; added task 1.0 (theme + dark mode implementation, 5 pts) as first task in Phase 1.
- Phase 0 fully complete. All 20 tasks done.
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 1.0 — Apply Mira theme: swap globals.css to preset b7CSfQ4Xo values, install Nunito Sans, wire next-themes toggle, add theme_preference column to profiles (migration), sync preference on login. Dark default. Migration required before any Phase 1 UI work.
**Context:** ui-reviewer.md lives at ~/.claude/agents/ (outside the repo — not in git). Theme preference decision: stored in profiles table as text ('light'/'dark'/'system'), default 'dark', syncs across devices. Task 1.0 is a prerequisite for Phase 1 UI work — build the theme once, then every new screen comes out right.

## Session 46 — 2026-04-12 20:20–20:36 (0.27 hrs)
**Duration:** 0.27 hours | **Points:** 3 pts
**Task:** Phase 0.16 — Playwright test suite for instructor views

**Completed:**
- Created `tests/instructor-views.spec.ts` — 18 tests (9 pass, 9 skip by design) across 3 viewports
- Suites: dashboard empty state (heading + stat cards), dashboard with assigned sessions (course title, badge, Roster link), session roster (title, date/time/location, student in table, back link), access control (instructor can't view unowned session — gets 404)
- `createInstructorCourse()` inline helper: admin creates course with pw_instructor assigned + student enrolls, returns courseId + sessionId
- Key locator fixes: `{ exact: true }` for stat card labels; `.first()` on badge + Roster link (dirty DB resilience); `fmtDateLong` outputs "Wed, Sep 15" (short format — don't use long weekday/month names)
- Empty-state message test skipped with note: requires `supabase db reset` — prior runs accumulate pw_instructor assignments
- 9/9 pass; capacity enforcement flaky test (student-enrollment.spec.ts:96) confirmed pre-existing — passes in isolation
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 0.17 — Save @ui-reviewer agent spec to `.claude/agents/ui-reviewer.md`. Tuned to SailBook design language. Should cover: nav/layout consistency, color/brand adherence, mobile layout, typography, shadcn component usage. Read `docs/BRAND.md` + existing pages before writing the spec.
**Context:** Phase 0 is now fully tested (auth, admin CRUD, student enrollment, attendance/cancellation/makeup, instructor views). `createInstructorCourse` lives inline in instructor-views.spec.ts (not helpers.ts) since it's specific to that suite. Dirty DB is a fact of life — design assertions with `.first()` or scoped locators when multiple matching elements can accumulate. `test.skip(true, 'reason')` is the pattern for tests that need clean-DB state.

## Session 45 — 2026-04-12 18:40–19:02 (0.33 hrs)
**Duration:** 0.33 hours | **Points:** 5 pts
**Task:** Phase 0.15 — Playwright test suite for attendance + cancellation + makeup

**Completed:**
- Created `tests/attendance-cancellation.spec.ts` — 7 tests (11/21 pass, 10 desktop-only skips)
- Suites: admin marks attendance + All Attended, student attendance history page (seed data), admin marks attended → student sees badge on course detail, admin enrollment cancellation, full session cancel → makeup schedule → student sees Makeup scheduled
- `createEnrolledCourse()` helper: creates course + enrolls pw_student, returns courseId + sessionId
- `test.setTimeout(90000/120000)` on setup-heavy tests (createEnrolledCourse takes ~25s)
- `page.on('dialog')` with type-checks for `prompt` (session cancel) vs `confirm` (enrollment cancel)
- Session row scoped by "Edgewater Park" location; enrollment row by email — no fragile index selectors
- `{ exact: true }` on "Needs makeup" to avoid strict-mode collision with "1 needs makeup" badge
- Ran @code-review agent; actioned all 5 findings in follow-up commit:
  - Moved `createTestCourse` + `createEnrolledCourse` into `tests/helpers.ts`
  - `student-enrollment.spec.ts` now imports `createTestCourse` from helpers (was duplicated)
  - Scoped makeup form date input to `form.filter({hasText:'Schedule Makeup'})` to prevent strict-mode violation if AddSessionForm is ever open simultaneously
  - Removed unnecessary `type Browser` import at spec file level
  - Added comment on "All Attended" intentional short stop
- 59/59 pgTAP + 80/80 Playwright green (after `supabase db reset`)
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 0.16 — Playwright test suite for instructor views. Dashboard, roster, session detail. Read-only pages — no writes, so no createEnrolledCourse setup needed. Login as pw_instructor@ltsc.test. Key pages: /instructor/dashboard, /instructor/sessions/[id]. Check existing instructor pages before writing tests.
**Context:** `supabase db reset` is routine maintenance before pgTAP after Playwright runs accumulate test data in the DB. `createEnrolledCourse` in `tests/helpers.ts` is the canonical helper for any test that needs an enrolled student — it manages its own browser contexts. `test.setTimeout` values: 90000 for single-context setup tests, 120000 for tests that also open a student context after admin work. Jordan's missed-session count (1) is seed-data dependent — requires clean DB reset before those assertions are reliable.

## Session 44 — 2026-04-12 18:08–18:33 (0.42 hrs)
**Duration:** 0.42 hours | **Points:** 8 pts
**Task:** Phase 0.14 — Playwright test suite for student browse + register + capacity + duplicate prevention

**Completed:**
- Created `tests/student-enrollment.spec.ts` — 24 tests (14 pass, 10 skipped by design) across 3 viewports
- Suites: browse courses, enroll flow, capacity enforcement, duplicate prevention
- Browse tests run all viewports (read-only); enrollment/capacity/duplicate tests are desktop-only
- `createTestCourse()` helper: creates + publishes a course via admin UI, returns UUID
- User-switching via `browser.newContext()` — separate context per user (admin → pw_student → jordan)
- Ran code-review agent; actioned all 7 findings in follow-up commit
- Extracted shared `tests/helpers.ts` with `loginAs()` and `runId()`; updated `admin-course-crud.spec.ts` to import from it
- Fixed `jordanCtx` context leaks (try/finally), added `'3 of 4 remaining'` spot-decrement assertion, added seed-row comments, documented duplicate-prevention server-side coverage gap
- `supabase db reset` needed before pgTAP after accumulated Playwright runs; 59/59 pgTAP + 69/69 Playwright green
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 0.15 — Playwright test suite for attendance + cancellation + makeup. Key flows: pw_student enrolled in a course → admin marks attendance (present/absent) → student sees updated attendance badge on detail page → cancellation flow (admin cancels enrollment or session) → makeup session linkage. Check existing `/admin/courses/[id]/sessions/[sessionId]/attendance` page and attendance actions before writing tests.
**Context:** `createTestCourse` is only called from desktop-only tests — `force: true` on Create Course is safe (no mobile layout conflict). `getByText('Full', { exact: true })` needed when course title contains 'Full' as substring. `supabase db reset` is routine maintenance before pgTAP — schedule it at start of any session that will run both suites. `tests/helpers.ts` is the single source for `loginAs`/`runId`/`PASSWORD` — add new shared helpers there, not inline.

## Session 43 — 2026-04-12 17:14–17:59 (0.75 hrs)
**Duration:** 0.75 hours | **Points:** 8 pts
**Task:** Phase 0.13 — Playwright test suite for admin course CRUD

**Completed:**
- Created `tests/admin-course-crud.spec.ts` — 16 passing tests across 3 viewports (5 skipped with rationale), 55/55 full suite green
- Suites: course type creation + list, course creation with session, add session to existing course, course detail cards, course type edit
- Edit test includes write verification: navigates back to edit page after save and asserts `Description` field value matches — no-op submits now fail
- Ran code-review agent; actioned `force:true` scoping and write verification findings
- Established patterns for 0.14–0.16 (see Context)
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 0.14 — Playwright test suite for student browse + register + capacity + duplicate prevention. Use `pw_student@ltsc.test`. Key flows: browse /student/courses, enroll in a course (enroll button → confirmation), try to enroll in a full course (capacity check), try to enroll twice (duplicate prevention). Supabase + dev server must be running.
**Context:** `test.skip(test.info().project.name !== 'desktop')` — use for admin tests involving the sessions table; overflow-x-auto + non-responsive sidebar make mobile/tablet button clicks unreliable as sessions accumulate. Most admin interaction tests can be desktop-only. `force: true` WITHOUT prior scrollIntoViewIfNeeded() for buttons near the sessions table — scroll repositions the element so the force-click lands on whatever was previously on top. field-sizing-content textareas: fill() appends instead of replacing when field has a value — fix with click() + Ctrl+A + keyboard.type(). page.locator('main form').evaluate(f => f.requestSubmit()) when multiple forms on page. runId() helper for unique test data per run (avoids unique constraint re-run failures). Write verification pattern: after save redirect, goto(editUrl) and assert field value. Code-review agent run post-commit; findings addressed in follow-up commit.

## Session 42 — 2026-04-12 08:53–09:41 (0.75 hrs)
**Duration:** 0.75 hours | **Points:** 3 pts
**Task:** Phase 0.12 — Playwright test suite for auth flows

**Completed:**
- Created tests/auth.spec.ts — 13 tests across 4 suites: role routing (admin/instructor/student/dual-role), unauthenticated access (4 protected routes), cross-role protection (3 cases), login page behavior (wrong password, already-logged-in redirect)
- Fixed login action (src/app/(auth)/actions.ts): now reads user_metadata from signInWithPassword response and redirects directly to role dashboard instead of routing through / — proxy no longer responsible for post-login hop
- Renamed proxy function from `middleware` → `proxy` (Next.js 16 convention; proxy.ts is the correct filename, proxy is the correct export name)
- Fixed playwright.config.ts: switched mobile/tablet from WebKit (not installed) to Chromium browserName with 375px / 768px viewports
- Installed playwright system deps (libnspr4 etc.) to unblock Chromium headless
- 39/39 passing across mobile (375px), tablet (768px), desktop (1440px)
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 0.13 — Playwright test suite for admin course CRUD (create course type, create course, add sessions). Full admin catalog flow — first big multi-step Playwright tests. Supabase + dev server must be running.
**Context:** Next.js 16 uses proxy.ts (not middleware.ts) — function must be named `proxy`. Login action now redirects directly to role dashboard; proxy still guards cross-role access and unauthenticated requests but is NOT in the post-login path. Playwright mobile/tablet use Chromium (not WebKit) — webkit not installed, Chromium covers the viewport breakpoints we care about. login() helper in tests uses waitForURL(/dashboard/) to ensure session is fully settled before any subsequent page.goto() calls. The proxy's getUser() in Playwright contexts does not reliably see cookies set by Server Action redirects — hence the direct-redirect fix in the login action.

## Retroactive credit — 2026-04-12
**Duration:** 0.25 hrs | **Points:** 8 pts (0.18 + 0.19 + 0.20)
Tasks 0.18, 0.19, 0.20 completed before V2 work formally began: session skills, CLAUDE.md update, docs update.

## Session 41 — 2026-04-12 08:39–08:46 (0.08 hrs)
**Duration:** 0.08 hours | **Points:** 3 pts
**Task:** Phase 0.11 — Install Playwright + MCP servers, configure viewports
**Completed:**
- Installed @playwright/test v1.59.1 + Chromium headless browser
- Created playwright.config.ts with 3 viewport projects: mobile (375px), tablet (768px), desktop (1440px)
- Created .mcp.json with @playwright/mcp and a11y-mcp-server configured
- Created tests/ directory for Playwright test suite
- Confirmed build clean post-install
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 0.12 — Playwright test suite for auth flows. Login as admin (andy@ltsc.example), instructor (mike@ltsc.example), student (sam@ltsc.example). Verify each lands on correct dashboard. Requires `supabase start` + `npm run dev` running before `npx playwright test`.
**Context:** Playwright v1.59.1. MCP servers live in .mcp.json (project root), not .claude/settings.json — project settings schema rejects mcpServers. Viewports: 375/768/1440. baseURL is http://localhost:3000. Tests run against local Supabase stack.

## Session 40 — 2026-04-12 00:35–00:52 (0.25 hrs)
**Duration:** 0.25 hours | **Points:** 3 pts
**Task:** Phase 0.10 — RLS audit
**Completed:**
- Full audit of all 28 RLS policies across 6 tables — no uncovered tables in V1
- Found & fixed: "Students can update own enrollments" WITH CHECK had no status restriction; now restricted to status='cancelled' only (`supabase/migrations/20260412044427_rls_enrollment_update_restriction.sql`)
- Found & fixed: get_enrolled_course_ids included cancelled enrollments — students could see sessions for courses they'd cancelled from
- Found & fixed (code review follow-up): get_student_enrollment_ids also included cancelled enrollments — students could read/update attendance for cancelled enrollments
- Found & fixed (code review follow-up): students could cancel completed enrollments; USING clause now blocks status='completed' rows (`supabase/migrations/20260412045055_rls_student_attendance_cancelled_fix.sql`)
- Created `supabase/tests/04_rls_gaps.sql` — 11 tests: write-blocks for students/instructors, status escalation prevention, cancelled-enrollment visibility fix, completed-enrollment cancel guard
- Ran code-review agent post-commit; two findings actioned
- 59/59 pgTAP tests passing
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 0.11 — Install Playwright + Playwright MCP + a11y-mcp-server, configure viewports (375/768/1440). `npm init playwright@latest`. MCP config in `.claude/settings.json`.
**Context:** Documented intentional non-fix: admin has no DELETE policy on profiles (correct by design — deleting profiles should go through Supabase Auth admin tools, not RLS). get_student_enrollment_ids and get_enrolled_course_ids now both exclude cancelled enrollments — keep these in sync when adding future enrollment statuses. Student enrollment UPDATE policy allows only status='cancelled' AND only when starting status != 'completed'. The code-review agent caught two real gaps in the first commit.

## Session 39 — 2026-04-12 00:27–00:34 (0.08 hrs)
**Duration:** 0.08 hours | **Points:** 5 pts
**Task:** Phase 0.9 — pgTAP RLS tests for enrollments and session_attendance
**Completed:**
- Created `supabase/tests/03_rls_enrollments.sql` — 16 tests
- enrollments: anon blocked, admin sees all 6 + can update, sam sees own 3 (not alex's), sam can INSERT own / throws 42501 on another student's, mike sees 5 (c001+c004+c006), chris sees 1 (c002)
- session_attendance: anon blocked, admin sees all 17, sam sees own 8 (not alex's), mike sees 13 (assigned sessions), chris sees 4
- `supabase test db` passes 48/48 (smoke + profiles + courses + enrollments)
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 0.10 — RLS audit: review all policies for gaps found (or not found) by the pgTAP suite. Compare against spec. Flag anything suspicious before moving to Playwright in 0.11.
**Context:** throws_ok 2-arg form matches error message, not test name — always use 4-arg form: throws_ok(sql, '42501', NULL, description). RLS violation SQLSTATE = 42501. 48/48 tests passing; full RLS coverage for profiles, course_types, courses, sessions, enrollments, session_attendance.

## Session 38 — 2026-04-12 00:17–00:22 (0.08 hrs)
**Duration:** 0.08 hours | **Points:** 5 pts
**Task:** Phase 0.8 — pgTAP RLS tests for course_types, courses, sessions
**Completed:**
- Created `supabase/tests/02_rls_courses.sql` — 13 tests
- course_types: anon blocked, authenticated sees active only (4/5), admin sees all (5/5)
- courses: admin sees all 6, student sees active+enrolled (5, not draft c005), instructor (mike) sees only assigned (3)
- sessions: admin sees all 14, student sees 13 (not d009 draft), instructor sees 9
- `supabase test db` passes 32/32 (smoke + profiles + courses)
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 0.9 — pgTAP RLS tests for enrollments and session_attendance. Highest-risk tables. Same authenticate() pattern. Test student sees own, instructor sees assigned course enrollments, admin sees all.
**Context:** RLS policies combine with OR — student sees active courses UNION enrolled courses (explains why sam sees completed c004). Session count math: active courses (11 sessions) + enrolled adds d007-d008 = 13 total.

## Session 37 — 2026-04-12 00:08–00:15 (0.08 hrs)
**Duration:** 0.08 hours | **Points:** 3 pts
**Task:** Phase 0.7 — pgTAP RLS tests for profiles
**Completed:**
- Created `supabase/tests/01_rls_profiles.sql` — 12 tests across 4 roles (anon, admin/andy, student/sam, instructor/mike)
- Covers all 7 profiles policies: admin all, anyone reads instructors, users read/update own, instructors read their students
- Established `tests.authenticate()` helper + role-switching pattern (SELECT tests.authenticate(...); SET LOCAL ROLE authenticated; ... RESET ROLE)
- Fixed: PERFORM → SELECT for void function calls in plain SQL context
- `supabase test db` passes 19/19 (smoke + profiles)
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 0.8 — pgTAP RLS tests for course_types, courses, sessions. Reuse authenticate() helper pattern from 01_rls_profiles.sql.
**Context:** PERFORM is PL/pgSQL only — use SELECT for void function calls in plain SQL test files. authenticate() is SECURITY DEFINER so it works even when called as authenticated role. Verify-as-postgres pattern: reset role, then SELECT to confirm blocked writes didn't land.

## Session 36 — 2026-04-12 00:03–00:06 (0.08 hrs)
**Duration:** 0.08 hours | **Points:** 3 pts
**Task:** Phase 0.6 — pgTAP setup
**Completed:**
- Created `supabase/tests/00_smoke.sql` — 7 tests: pgTAP alive + all 6 core tables exist (profiles, course_types, courses, sessions, enrollments, session_attendance)
- `supabase test db` passes 7/7 — pipeline confirmed working
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 0.7 — pgTAP RLS tests for `profiles` table (all roles × CRUD). This is the template test file — patterns established here carry into 0.8/0.9.
**Context:** Test files live in `supabase/tests/`. Format: BEGIN; SELECT plan(N); ... tests ... SELECT * FROM finish(); ROLLBACK; Supabase handles pgTAP extension setup automatically — no manual CREATE EXTENSION needed in test files.

## Session 35 — 2026-04-11 23:57–00:02 (0.08 hrs)
**Duration:** 0.08 hours | **Points:** 2 pts
**Task:** Phase 0.5 — Smoke test local Supabase
**Completed:**
- Updated `.env.local` to point at local Supabase (http://127.0.0.1:54321) with prod commented out for easy switching
- Confirmed `npm run dev` + login shows seed data users (not prod users)
- Smoke test passed — app running against local DB
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 0.6 — pgTAP setup. `CREATE EXTENSION pgtap` in test helper, create `supabase/tests/` structure, run a trivial test to confirm `supabase test db` works.
**Context:** `.env.local` has local/prod toggle via comments. Local is currently active. `.env.local` is gitignored — switching envs is manual.

## Session 34 — 2026-04-11 23:47–23:55 (0.17 hrs)
**Duration:** 0.17 hours | **Points:** 2 pts
**Task:** Phase 0.4 — Seed data (supabase/seed.sql)
**Completed:**
- Created `supabase/seed.sql` from demo-seed.sql — 7 demo users + 3 Playwright test users (pw_admin, pw_instructor, pw_student; f1 UUID block)
- Fixed two local Supabase quirks: `extensions.crypt()`/`extensions.gen_salt()` (pgcrypto in extensions schema, not public) and schema-qualified all table names (Supabase batches seed SQL, SET search_path doesn't carry across batches)
- `supabase db reset` runs clean — migration + seed both apply without errors
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 0.5 — Smoke test. `supabase db reset` → `npm run dev` → log in as each role (andy, mike, sam) → verify correct dashboard loads against local DB.
**Context:** Seed table names must be schema-qualified (public.profiles, etc.) — bare names fail because Supabase splits seed.sql into batches and search_path doesn't persist. crypt/gen_salt must use extensions.crypt()/extensions.gen_salt(). All passwords: qwert12345.

## Session 33 — 2026-04-11 23:28–23:44 (0.25 hrs)
**Duration:** 0.25 hours | **Points:** 5 pts
**Task:** Phase 0.2–0.3 — Finish local Supabase init + baseline migration
**Completed:**
- 0.2 done (was already complete coming in — confirmed and marked off)
- 0.3: Ran `supabase login`, linked to remote project `sbbcfnivtnakgvgtchre`
- Dumped prod schema to `supabase/migrations/000_baseline.sql` (28 policies + helper functions)
- Verified `supabase db reset` applies migration cleanly — local stack healthy
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 0.4 — Create `supabase/seed.sql`. Rebuild from demo-seed data (dev-seed-qa is stale). Add Playwright test users. Verify seed runs automatically on `supabase db reset`.
**Context:** Docker image pull on first reset is normal (one-time cache). Subsequent resets are fast/local only. `supabase/seed.sql` warned as missing — expected, not yet created.

## Session 32 — 2026-04-11 23:09–23:23 (0.25 hrs)
**Duration:** 0.25 hours | **Points:** 2 pts
**Task:** Phase 0.2 — Initialize local Supabase
**Completed:**
- `supabase init` run — `supabase/config.toml` created with `project_id = "sailbook"`
- Discussed Supabase CLI install options (brew/npm/direct download)
- Confirmed `supabase start` output format and how to verify stack is running (`supabase status`, `docker ps`)
**In Progress:** 0.2 — CLI install method not yet chosen; `supabase start` not yet run
**Blocked:** Nothing
**Next Steps:** Install Supabase CLI (`brew install supabase/tap/supabase` or `npm install -g supabase`), then `supabase start` — first run pulls Docker images, watch for port conflict on 5432
**Context:** `supabase init` already done — do NOT re-run. `project_id = "sailbook"`. Ports: API 54321, DB 54322, Studio 54323.

## Session 31 — 2026-04-11 21:06–21:15 (0.17 hrs)
**Duration:** 0.17 hours | **Points:** 2 pts
**Task:** Phase 0.1 — Docker Desktop install
**Completed:**
- Docker Desktop 29.3.1 installed on Windows with WSL2 integration enabled
- Verified `docker --version` and `docker ps` work in WSL2 without sudo — clean
- Task 0.1 complete
**In Progress:** Nothing
**Blocked:** Nothing
**Next Steps:** 0.2 — `supabase init` then `supabase start` (first run pulls Docker images, may take a few minutes)
**Context:** Docker is fully operational in WSL2. `supabase start` will be the first real test — watch for port conflicts on 5432 (postgres).