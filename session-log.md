# SailBook — Session Log

Session summaries for continuity across work sessions.
Format: prepend newest entry at the top.

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

