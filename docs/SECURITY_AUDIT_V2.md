# SailBook V2 Security Audit

**Date:** 2026-05-03
**Auditor:** manual code review (no automated SAST)
**Scope:** auth, RLS, server actions, API routes, payments, notifications, waitlist, prereqs, secrets handling, dependencies
**Result:** 2 moderate findings fixed; remainder deferred to post-launch backlog. No critical findings.

---

## Method

- Inventory of every server action and API route, classified by client (RLS-respecting vs service-role)
- Inventory of every table and its RLS policies
- pgTAP test coverage check for V2 tables
- `npm audit --omit=dev`
- Grep for hardcoded secrets, service-role exposure to client code, `NEXT_PUBLIC_` env var leaks
- Three parallel agent passes (auth/RLS, server actions, V2 features) cross-checked against direct code reads
- Stripe webhook + auth callback read line-by-line

What this audit did NOT do: live pen-testing, automated dependency scanning beyond `npm audit`, runtime fuzz testing, threat-model exercise.

---

## Findings

### 🔴 Critical — 0
Nothing actively exploitable.

### 🟠 Moderate — 2 fixed in this PR

**M1. `updateUserProfile` lacked server-side admin check** — `src/actions/profiles.ts:8`
- The action authenticated the caller but did not verify the caller was an admin.
- At line 61 it called `adminClient.auth.admin.updateUserById(id, { user_metadata: { is_admin, ... } })` using the service role, which bypasses RLS.
- Currently safe in practice because the action is only imported into `user-edit-form.tsx`, which only renders on `/admin/*` paths (gated by middleware).
- **Risk:** one refactor away from being directly callable by a non-admin. Per Next.js docs, server actions must not rely solely on middleware.
- **Fix:** added the same `is_admin` check pattern already in sibling actions (`updateProfile`, `createAdminStudent`).

**M2. Cron routes silently open if `CRON_SECRET` is unset in production** — `src/app/api/cron/*/route.ts`
- All three cron routes guarded with `if (cronSecret) { check }`. If the env var is missing in prod (Vercel misconfig, dropped from dashboard), no auth check runs.
- **Risk:** anyone hitting `/api/cron/expire-holds` (cancels enrollments), `/api/cron/low-enrollment`, or `/api/cron/session-reminders` (sends SMS/email) can trigger them.
- **Fix:** extracted `verifyCron()` helper at `src/lib/cron-auth.ts` that fails closed in production when `CRON_SECRET` is missing, mirroring the `devOnly()` pattern.

---

### 🟡 Deferred to V3 backlog

**D1. ~15 admin/instructor server actions lack action-level role checks** — `courses.ts`, `sessions.ts`, `attendance.ts`, `instructors.ts`, `course-types.ts`
- All use the regular `createClient()` server client (RLS-respecting) — RLS catches unauthorized writes; they fail silently.
- **Not exploitable today.** Listed for defense-in-depth and UX improvement (silent RLS failures vs explicit "Unauthorized").
- Suggested fix: add a `requireAdmin(supabase)` helper, apply across affected actions. ~30 min refactor.

**D2. npm audit: 1 high + 6 moderate** (postcss XSS, uuid bounds, svix/resend chain)
- None directly exploitable in our code paths (no untrusted CSS, no UUIDs from user input).
- Fix requires `npm audit fix --force` → resend 6.1.3 (breaking).
- Defer until post-launch when we can absorb a breaking dependency upgrade safely.

**D3. No security headers in `next.config.ts`** — missing CSP, HSTS, X-Frame-Options, Referrer-Policy, X-Content-Type-Options.
- Vercel adds some defaults (X-Content-Type-Options, X-Frame-Options on assets).
- Standard hardening for V3.

**D4. JWT role flag cast inconsistency in RLS policies** — some use `'true'::text`, others `::boolean = TRUE`. Both work; cosmetic only.

**D5. No rate limiting on `/api/webhooks/stripe` or `/auth/callback`** — Stripe enforces upstream rate limits + signature verification; Supabase auth has its own anti-spam. Acceptable for V2.

**D6. Notification unsubscribe forgery vector** — N/A. No unsubscribe links exist yet. When added, sign with HMAC and scope to user.

**D7. Waitlist `created_at` not enforced at RLS layer** — server action sets via DB default `now()`, not user-supplied. Direct Supabase client call cannot insert a row for another user (RLS), and own `created_at` could only delay your own position. Not exploitable.

---

## What was verified clean

- **Service role isolation:** `createAdminClient()` is only imported by server-only files (`triggers.ts`, `actions/profiles.ts`, `actions/enrollments.ts`, three API routes). No client component imports it.
- **`.env*` files in `.gitignore`** — never committed.
- **No hardcoded secrets in source.** Only `NEXT_PUBLIC_*` env vars are referenced from client-bundled code, all of them are intentionally public (Supabase URL, anon key, site URL, dev-mode flag).
- **Test API routes (`/api/test/*`)** all use `devOnly()` helper that checks `NODE_ENV === 'development'` AND `VERCEL_ENV` is unset (belt-and-suspenders against `NODE_ENV=development` on a Vercel deploy).
- **Stripe webhook (`/api/webhooks/stripe/route.ts`)** verifies signatures with `stripe.webhooks.constructEvent`, has idempotency guard (skip if already confirmed), returns 200 for unknown sessions to stop retries.
- **Auth callback (`/auth/callback/route.ts`)** validates Host header against `NEXT_PUBLIC_SITE_URL` to prevent open-redirect via spoofed Host.
- **Middleware role guards** in `proxy.ts` correctly gate `/admin/*`, `/instructor/*`, `/student/*` on JWT metadata flags.
- **All 11 tables have RLS enabled** with appropriate policies.
- **All V2 tables have pgTAP coverage** (`waitlist_entries`, `course_type_prerequisites`, `payments`, `codes`, `invites`).
- **`auth.uid() IS NULL` traps** — none found. SECURITY DEFINER functions all check for NULL caller and refuse.
- **Profile role-flag mutation protection** — `profile_role_flags_unchanged()` trigger (migration `20260421031000`) blocks self-elevation via direct profile UPDATE; the only path to change role flags is via the admin actions audited above.
- **Self-enrollment integrity** — `createCheckoutSession` and `enrollInCourse` use `auth.uid()` server-side; no `studentId` param, can't enroll another user.

---

## Pre-launch checklist

- [x] Fix M1, M2 (this PR)
- [ ] Verify Vercel env: `CRON_SECRET` is set on production
- [ ] Verify Vercel env: `STRIPE_WEBHOOK_SECRET` is set on production
- [ ] Verify Vercel env: `SUPABASE_SERVICE_ROLE_KEY` is set on production (and never on `NEXT_PUBLIC_*`)
- [ ] After deploy: smoke-test cron routes return 401 without auth header
- [ ] After deploy: confirm Stripe webhook endpoint is registered with the deployed URL
