# SailBook — Architectural Decisions

## DEC-001: Supabase-direct instead of Express API
**Decision:** No separate backend server. React/Next.js talks directly to Supabase.
**Why:** Andy's spec had React → Express → Supabase. The Express layer is ~40% of the build and is entirely CRUD plumbing. Supabase Auth + Row Level Security replaces JWT middleware and role checks. Eliminates backend hosting (Railway). For a single-school MVP with straightforward business logic, the API layer adds cost with no benefit.
**Tradeoff:** Business logic lives in Postgres RLS policies and database functions. Harder to unit test. Migration away from Supabase is more involved later.
**V2 update:** Stripe webhook requires one API route (`app/api/webhooks/stripe/route.ts`). This is a mailbox, not an API layer. DEC-001 survives — a single webhook endpoint does not justify a backend server.
**Revisit if:** Business logic becomes complex enough to warrant a dedicated API layer, or if the number of webhook endpoints exceeds 3–4.

## DEC-002: Next.js 14+ over bare React 18
**Decision:** Use Next.js with App Router instead of Create React App.
**Why:** File-based routing eliminates react-router-dom config. Vercel built Next.js — deployment is zero-friction. SSR/SSG available if needed later. React's own docs recommend framework-based approach. Developer (Eric) has prior Next.js experience and preferred it.
**Tradeoff:** App Router is newer, slightly different mental model from Pages Router.

## DEC-003: Single profiles table instead of separate users + students
**Decision:** One `profiles` table for all roles, extending Supabase Auth.
**Why:** Admin, instructor, and student share the same auth flow. Role is a column, not a table. Simplifies queries, RLS policies, and the auth model. Adding roles later is a one-line migration.
**V2 update:** Boolean flags (is_admin, is_instructor, is_student) replaced single role column in V1 Phase 2 to support multi-role users (e.g., Chris = instructor + student).
**Tradeoff:** Students have nullable fields they don't use (and vice versa for instructors).

## DEC-004: course_type → course → session(s) data model
**Decision:** Three-level hierarchy instead of Andy's flat `classes` table.
**Why:** Learn to Sail Cleveland offers the same course type (ASA 101) in different formats — weekend intensive, evening series, etc. A course type is the template. A course is the specific offering. Sessions are the time blocks. This handles: multi-day courses, flexible scheduling patterns, Open Sailing as recurring single sessions, and instructor swaps per session.
**Tradeoff:** More joins than a flat model. Slightly more complex admin UI for course creation.

## DEC-005: Enrollment at course level, attendance at session level
**Decision:** Students enroll in courses, not individual sessions. Attendance tracked per session via `session_attendance`.
**Why:** Maps to how sailing schools actually operate — you sign up for "ASA 101 May 17–18," not for Saturday separately from Sunday. Attendance tracking per session enables cancellation/makeup logic: who missed what, and where they made it up.
**V2 note:** Drop-in courses (Open Sailing) may use per-session enrollment. See DEC-TBD (drop-in enrollment model).

## DEC-006: Cross-course makeup support
**Decision:** `makeup_session_id` in session_attendance can reference any session, not just sessions within the same course.
**Why:** A student from the Tuesday ASA 101 should be able to make up a missed session in the Saturday ASA 101. Real-world scheduling flexibility.

## DEC-007: Instructor on both course and session
**Decision:** Default `instructor_id` on courses, optional override `instructor_id` on sessions.
**Why:** Typically one instructor teaches the whole course. But Learn to Sail Cleveland wants the ability to swap instructors mid-course for specific sessions. NULL on session means use course default.
**V2 note:** UI should clearly show "Using course instructor" on sessions with NULL instructor_id, not just a blank field. Andy flagged this as confusing in V1 review.

## DEC-008: No schools table (single-tenant)
**Decision:** Dropped Andy's `schools` table and all `school_id` foreign keys.
**Why:** Building for one school. Multi-tenant adds complexity to every query, every RLS policy, every UI component. Can add later as a migration if needed. Not worth the overhead for May 15.

## DEC-009: shadcn/ui for component library
**Decision:** Use shadcn/ui on top of Tailwind CSS.
**Why:** SailBook is forms and tables — exactly what shadcn/ui provides. Components are copied into the repo (not a dependency), so fully customizable. Saves significant time vs building every form input and modal from scratch. Claude Code knows it well. May 15 deadline doesn't leave room for custom UI work.

## DEC-010: Manual makeup scheduling for V1
**Decision:** Admin manually creates makeup sessions and assigns students. No automation.
**Why:** Automated suggestions require understanding availability, cross-course compatibility, and student preferences — complex logic that can wait. Manual flow covers the need for season one. Automated is a fast-follow.

## DEC-011: Price display only, no payment processing (V1)
**Decision:** `price` field on courses for display. No checkout, no Stripe, no payment status tracking.
**Why:** Shipping by May 15. Payment processing adds Stripe integration, webhook handling, refund logic, and PCI compliance concerns. The school can collect payment outside the app (cash, Venmo, check) for season one.
**V2 update:** Superseded. Phase 2 adds Stripe Checkout Sessions. Enrollment `confirmed` status tied to payment. See DEC-TBD (pessimistic inventory).

## DEC-012: Vercel for hosting
**Decision:** Vercel free tier for frontend hosting.
**Why:** Built Next.js, zero-config deployment, auto-deploy from GitHub, free tier sufficient for MVP traffic. Best DX available.

## DEC-013: experience_level is static in V1
**Decision:** `profiles.experience_level` is set at registration and never updated automatically.
**Why:** Automatically updating skill level based on completed courses is non-trivial — it requires defining progression rules per course type, handling partial completions, and surfacing it meaningfully in the UI.
**V2 update:** Experience level moves to generic codes table (DEC-TBD). Still static — automatic progression deferred to Phase 7 (Skills & Tracking).

## DEC-014: Enrollment status lifecycle
**Decision:** Enrollment statuses are `registered → confirmed → cancelled / completed`. In V1, admin manually moves a student from `registered` to `confirmed` after receiving payment (cash, Venmo, check). `confirmed` is the payment signal.
**V2 update:** With Stripe, lifecycle becomes `registered → pending_payment → confirmed → cancelled / completed`. Stripe webhook sets `confirmed` automatically. `pending_payment` includes a hold timer — spot held for configurable duration, released on timeout. See DEC-TBD (pessimistic inventory).

## DEC-015: Server action error handling — two patterns, both return errors
**Decision:** Two error patterns based on how the action is called. No `throw` in server actions.
1. **Form actions** (used with `useActionState`, accept `prevState`): return `string | null`. `null` means success. A string is the error message displayed inline by the form.
2. **Button-triggered actions** (called via `useTransition`): return `{ error: string | null }`. Callers check the result and show inline feedback.
**Why:** Throwing sends the user to an error boundary with no recovery path except refreshing the page. Returning errors lets components show inline feedback and keep the user in context.

## DEC-016: Empty state component — shared component, text + optional CTA
**Decision:** Top-level list views with no data use a shared `EmptyState` component: centered text, optional action button. No icons, no illustrations.
**Why:** ~5 top-level list pages need empty states. One component, consistent appearance, minimal implementation.

## DEC-017: Layout-level padding
**Decision:** Page padding applied once in layout.tsx `<main>` element, not in individual page components.
**Why:** Consistent padding across all pages in a route group. Any new page must NOT add outer `p-*` — layout provides it.

### D-018: Theme & Visual Refresh (2026-04-12)
**Context:** V1 shipped with Geist font, zinc-only palette, no dark mode. App felt clinical — wrong tone for a school built on "meeting people where they are."
**Decision:** Adopt shadcn Mira style (preset b7CSfQ4Xo). Sky theme on Mist base, Nunito Sans font, xs border radius, dark mode default with toggle.
**Options considered:**
- Keep V1 aesthetic, add color accent only — too minimal, still cold
- Full custom theme — overkill for MVP, maintenance burden
- shadcn preset with targeted overrides — right balance of polish and speed
**Chose:** Preset with overrides. Theme preference is localStorage-only per device (see DEC-020).
**Consequence:** Oleg's Law retired. ui-reviewer.md updated to enforce new design language. Every screen from Phase 1 built against final theme — no retrofit.

## DEC-020: localStorage-only theme persistence (per device)
**Decision:** Reverted device-synced theme persistence to localStorage-only per device. The toggle calls `setTheme()` from next-themes only — no DB write, no server action. `theme_preference` column remains in the profiles table but is not read or written.
**Why:** The cross-device sync wasn't worth the complexity. Users expect theme to match the device they're on — a phone in a bright marina should be light regardless of what's set on the office desktop. Every attempt to sync via DB introduced a race between next-themes' localStorage initialization and a React useEffect firing after hydration, resulting in flashes and wrong-theme loads that were impossible to reliably fix without cookie-based SSR pre-rendering.
**Tradeoff:** Theme resets to system default on first visit in a new browser. Acceptable — users set it once per device and it stays.
**Revisit if:** Users specifically ask for cross-device sync. Correct implementation would require a cookie set server-side on login (not a useEffect), so next-themes initializes with the right value before first render.

## DEC-019: Instructor deactivation cascade
**Decision:** When an instructor is deactivated (`is_active = FALSE`) or has their instructor role removed (`is_instructor = FALSE`), a `SECURITY DEFINER` trigger function (`cascade_instructor_deactivation`) NULLs out `instructor_id` on all affected courses and sessions. The cascade is one-way — reactivation does not restore assignments.
**Why:** Two code paths can deactivate an instructor (the toggle button and the profile edit form). A trigger covers both automatically and atomically, with no risk of one path forgetting to cascade. The existing admin dashboard already flags courses without instructors, so clearing assignments is immediately visible.
**SECURITY DEFINER choice:** The trigger needs to UPDATE courses and sessions as a side effect of a profiles UPDATE. The admin RLS policies on courses/sessions would technically allow this for an admin session, but triggers run in a context where JWT claims may not be set (e.g., service role calls, future background jobs). SECURITY DEFINER makes the cascade unconditional regardless of who executes the profiles UPDATE. The guard is at the profiles UPDATE policy (admin-only), not inside the trigger itself.
**Tradeoff:** Cascade is silent — no event or notification is emitted. Andy sees the cleared assignments on the courses page; no separate audit trail for "why is this course unassigned."
**Revisit if:** We add an audit log table and need to record the reason for assignment removal.

## DEC-021: Generic codes/lookup table pattern
**Decision:** All configurable dropdown/lookup values live in a `codes` table with `(category, value, label, description, sort_order, is_active)`. First use: experience levels (`category = 'experience_level'`). Reusable for qualification types, prerequisite names, skill names, and anything else that currently would be a hardcoded enum or `<option>` list.
**Why:** Hardcoded option lists in components mean a code deploy to add a new level. The codes table lets Andy (or future admin UI) add/retire values without touching code. It also makes the schema self-documenting — the full list of valid experience levels lives in the database, not scattered across three files.
**Structure:** `profiles.experience_level` remains a `varchar` column with no FK constraint. App reads valid options from codes at render time. Deactivated codes stay in the DB (historical records keep their values); they just don't appear in dropdowns.
**No FK constraint:** Adding a FK from `profiles.experience_level` to `codes.value` would require a partial index or composite key reference and would block retiring a code if any profile still holds it. The softer approach (app-level filtering) is sufficient — this isn't financial data.
**Tradeoff:** No admin UI for codes in Phase 1. Andy edits directly via SQL. Polish task 6.x to add a UI if needed.

## DEC-022: Student cancellation refund policy
**Decision:** Students request cancellation; admin processes the refund manually. No automated Stripe refund from student action. Students can transition a `confirmed` enrollment to `cancel_requested` via the UI. Admin reviews the request in the enrollment view and issues the refund + final cancellation from the dashboard (Phase 2.8).
**Why:** Learn to Sail Cleveland is a small school where Andy knows every student. Giving him control over refund decisions avoids abuse (cancelling 10 minutes before class) without requiring a policy engine. A deadline-based policy (Phase 6) can layer on later if volume demands it.
**Status:** `cancel_requested` is a terminal student-facing state — students cannot self-transition out of it. Only admins can move it to `cancelled`. RLS enforces: students can only update `confirmed → cancel_requested`, not `confirmed → cancelled`.
**Phase 6:** Add deadline-based automatic refund eligibility (e.g., full refund if cancelled ≥ 7 days before first session, none after).

## DEC-023: Email split — Zoho for human mail, Resend for transactional (2026-04-22)
**Decision:** Two separate email systems.
1. **Human-addressable mailboxes** (`info@sailbook.live`, `andy@sailbook.live`) run on Zoho free tier, pulled into Gmail for unified inbox and branded reply. See `docs/EMAIL_SETUP.md`.
2. **Transactional/app email** (enrollment confirmations, reminders, cancellation notices) goes through Resend with `from: info@sailbook.live`. See `docs/NOTIFICATION_SETUP.md`.
**Why:** Each tool is built for its job. Resend is send-only for programmatic mail — wrong fit for human correspondence (no inbox, no reply handling). Zoho provides real mailboxes with proper SMTP/IMAP — wrong fit for app-scale transactional sending. Splitting them keeps each tool in its lane and gives students one branded reply destination: hitting reply on any app notification lands in the same human inbox Andy already uses.
**Tradeoffs:** Two vendors to manage. DNS coordination required — exactly one SPF record per domain must include both senders (`v=spf1 include:zoho.com include:_spf.resend.com ~all`), while DKIM stacks cleanly via separate selectors. Resend does not need MX records; Zoho handles all inbound `@sailbook.live` mail.
**Setup order:** Zoho first (`EMAIL_SETUP.md`), then Resend (`NOTIFICATION_SETUP.md` §3.2). Twilio has no DNS dependency and is independent.
**Revisit if:** Zoho free tier blocks SMTP (fallbacks: Zoho Mail Lite $1/user/mo, Fastmail, or Google Workspace). Or if notification volume grows to where `noreply@` is preferable to human replies.

---

## DEC-024: Admin-created students use passwordless auth.users rows
**Decision:** Admin-created profiles use a service-role `auth.admin.createUser` call with `email_confirm: true` and no password. `profiles.id` always equals `auth.users.id` — the existing RLS invariant (`profiles.id = auth.uid()`) is preserved. A `NOT NULL` column `auth_source` (`'self_registered' | 'admin_created'`) discriminates the two. The student cannot log in (no password set, no credential flow triggered). Linking to a real login later means setting a password and triggering email verification on the existing auth row.
**Why:** Free-floating UUIDs (profiles with no auth.users counterpart) would silently break the `auth.uid() = id` invariant that every RLS policy assumes. Future policy authors would need to know about the two-class distinction — a rotting assumption. The passwordless-auth-row approach preserves the invariant unconditionally. @architect reviewed and approved.
**Tradeoff:** One extra auth.users row per admin-created student. These rows are inert — no login method, no session. The `auth_source` discriminator makes them identifiable.
**Revisit if:** Supabase Auth changes how passwordless placeholder accounts work, or if the number of admin-created students creates noise in the auth dashboard.

## DEC-025: Manual payment path bypasses Stripe entirely
**Decision:** `payments.stripe_checkout_session_id` is nullable (already was). The UNIQUE constraint is now partial (`WHERE stripe_checkout_session_id IS NOT NULL`). A `payment_method` column (`stripe | cash | check | venmo | other`, default `stripe`) distinguishes payment origin. Admin-initiated enrollments skip `pending_payment` status entirely — the enrollment and payment rows are written as `confirmed` / `succeeded` in a single server action. The Stripe webhook and hold-expiry cron paths are unaffected; they only operate on rows with Stripe checkout session IDs.
**Why:** Phone-in students exist. Andy needs to record cash/check payments without routing them through Stripe Checkout. No new table needed — the payments table already exists and the enrollment model already has a `confirmed` status. Two roads to `confirmed`: Stripe Checkout (automated via webhook) and admin-initiated (direct server action).
**Note on ghost-student payment visibility:** Payment rows for admin-created students (`auth_source = 'admin_created'`) are admin-visible only until the student links a real login. The "Students read own payments" RLS policy (`student_id = auth.uid()`) cannot be satisfied without an active session. Intentional for V1.
**Tradeoff:** Two payment paths to maintain. The manual path has no receipt email (Phase 3 notifications will add this). Partial refunds on manual payments update the DB row only — no Stripe API call.

## DEC-026: Notification preferences stored as JSONB on profiles (2026-04-26)
**Decision:** Per-recipient notification channel toggles live in a `notification_preferences jsonb` column on `profiles`. Shape: `{ [eventType]: { sms?: boolean, email?: boolean } }`. Null/missing keys mean the channel is enabled — admins who never visit the preferences page keep getting everything.
**Why:** The data is read at per-recipient fan-out time inside each trigger, which already reads the recipient's profile row — no extra queries, no joins, no new RLS surface. Admin count is small (1–3 in V1) and there is no need to filter or query by preference. A separate `notification_preferences` table would add migration work, RLS policies, and join cost for zero practical benefit at this scale. Future event types extend the JSON shape additively — no schema migration. The 3.9 student preferences (opt out of SMS, email-only) will reuse the same column.
**Tradeoffs:** No DB-level shape validation — the app must defend against malformed values. The dispatcher helper `isAdminChannelEnabled()` validates defensively (typeof checks, null/undefined → enabled) so a bad JSON value can never throw or default to "disabled" silently. Querying "which admins have SMS enabled for X" is awkward (would need a JSON path expression), but no current or planned feature needs that.
**Revisit if:** preferences need to be queryable (e.g., bulk admin reporting), shape grows beyond ~5 events × multiple channels, or a third role (instructor) wants distinct preferences with overlapping events.

## DEC-027: Drop-in enrollment model for Open Sailing (2026-05-01)
**Decision:** Drop-in courses (Open Sailing) reuse the existing `enrollments` + `session_attendance` + `payments` model without schema changes to those tables. `is_drop_in` flag lives on `course_type` (not `course`). Each Open Sailing night is its own course with exactly one session. The hold amount is the course `price` — no separate field. Enrollment lifecycle (`pending_payment → confirmed → cancelled`) is identical to regular course enrollment. Attendance is seeded for the one session on webhook confirmation, identical to the existing path.
**Why:** "Drop-in" is a property of what Open Sailing IS, not a per-course toggle — `course_type` is the right level. One-course-per-night means `UNIQUE(course_id, student_id)` on enrollments remains correct for independent Monday + Thursday bookings. No new table needed because "all sessions in a one-session course" and "the single session the student picked" are the same thing.
**What `is_drop_in` gates:** Student-facing callout ("pay $X now, balance to captain on the day"), admin "Drop-in" badge on course detail. Not the payment flow — the hold amount is just the course price.
**Superseded in part by DEC-032 (2026-06-30):** the payment flow now charges a flat configurable deposit (`DROP_IN_DEPOSIT`), not the course `price`; `is_drop_in` gates the charge amount. The rest of DEC-027 (model reuse, one-course-per-night, lifecycle, attendance) stands.
**Revisit if:** Open Sailing moves to a season-pass or multi-session-booking model.

## DEC-028: Page-header actions — visible primary + `•••` overflow menu (2026-05-02)
**Decision:** When a page header has more than two actions, keep the most-frequent action as a visible button and collapse the rest into a `•••` `DropdownMenu` trigger (matching the row-level pattern in `SessionRow`/`SessionCardItem`). No labeled "Actions" trigger; no shared `PageActionsMenu` component until a second page needs one.
**Why:** Four buttons in a header wrap awkwardly at narrow desktop widths (~1208px with long titles) and feel heavy on mobile. Keeping the daily action visible preserves discoverability for the 90% case; consistency with existing row-level `•••` menus avoids introducing a second overflow idiom.
**First use:** `/admin/courses/[id]` — Edit visible, status transitions (Publish / Revert to Draft / Mark Completed / Cancel Course) in menu. @architect reviewed and approved.
**Test pattern:** Status transitions are no longer queryable as buttons. Use the `clickCourseAction(page, name)` helper in `tests/helpers.ts` which opens the menu, clicks the menu item, and waits for the trigger to re-enable after the server action.
**Revisit if:** A second page-header collapses actions into a menu — extract a shared `PageActionsMenu` (or equivalent) component instead of inlining the DropdownMenu twice.

## DEC-029: Production-branch deploy model (2026-06-24)
**Decision:** Replace the staging release-train (never recorded as a DEC — it lived only in `CLAUDE.md` + `docs/STAGING.md`) with the seeds workflow's production-branch model (seeds `DEC-S022`). `main` is the always-active trunk: feature PRs merge straight into `main`; there is no `staging` branch. A long-lived `production` branch is a deploy pointer — Vercel's Production Branch is set to `production`, while `main` drives the dev/preview deploy (`dev-sailbook.vercel.app`). `/promote-production` ff-merges `main` → `production` to ship prod (`sailbook.live`); it is deploy-only, since the release is already version-bumped + tagged on `main` by `/retro` / `/bump-major`. Tags apply on `main` at bump time and the promotion carries the tagged commit (supersedes the old "tag at `/promote-staging`" rule).
**Why:** Single school, single dev — the staging accumulator added a release-PR ceremony with no payoff. Keeping `main` always-shippable and making "deploy" a one-command ff-merge removes a branch and a ritual. Migrated from seeds schema v3 → v4 on 2026-06-24: `/promote-staging` removed, `/promote-production` added, `.claude/seeds-version` bumped to `4`.
**Revisit if:** SailBook grows past a single tenant/season and needs a genuine multi-environment promotion pipeline again.

## DEC-030: Sessions branch excluded from Vercel deploys via Ignored Build Step (2026-06-25)
**Decision:** The orphan `sessions` branch (DEC-S014 — per-session log files committed via `.sessions-worktree/` by `/its-alive`, `/kill-this`, `/its-dead`) must not trigger Vercel deployments on push. Gate it with a Vercel **dashboard** Ignored Build Step (Project → Settings → Git → Ignored Build Step): `bash -c '[ -f package.json ] && exit 1 || exit 0'`. No root `package.json` on the orphan branch → exit 0 → build skipped; every real branch carries `package.json` → exit 1 → build proceeds. Branch-name-agnostic, applies project-wide.
**Why:** Each session pushes `sessions` 2–3×; ungated, every push spends a Vercel build (and, lacking `package.json`, fails). `git.deploymentEnabled` / `ignoreCommand` in `vercel.json` do **not** work here — Vercel reads that config from the *pushed* branch, and the orphan `sessions` branch carries no `vercel.json`, so a setting on `main` never applies to it. The dashboard Ignored Build Step runs project-wide regardless of branch contents, which is why it's the only reliable gate. Same setup as `~/muster`.
**Caveat:** The Ignored Build Step is a Vercel project setting, not version-controlled — it must be set once per project in the dashboard. Recorded here so it survives a project re-link or dashboard reset.
**Revisit if:** Vercel adds per-branch deploy gating that reads the production branch's `vercel.json` (would let us version-control this).

## DEC-031: Email one-time-code sign-in via Supabase native OTP (2026-06-29)
**Decision:** Add email 6-digit-code sign-in alongside email/password + Google OAuth, flag-gated (`NEXT_PUBLIC_EMAIL_CODE_AUTH`, dark by default), available to all roles. Uses Supabase `signInWithOtp({ shouldCreateUser: false })` + `verifyOtp({ type: 'email' })` — sign-in only for existing accounts; never creates users, never captures profile. Registration stays the sole signup/profile-capture path. No magic link — codes only, via the repurposed (previously unused) Magic Link email template now emitting `{{ .Token }}`. Phase 1 of a longer passwordless-only north star; phase 1 is purely additive.
**Why:** Lowers the password barrier for all roles without touching the data model. `shouldCreateUser: false` keeps it additive and zero-DB-impact: no `auth.users` insert, no `handle_new_user`, no new RLS. Supabase covers enumeration safety, send rate-limits, and verification brute-force caps natively — no hand-rolled OTP store needed (cf. `~/muster`, which predates Supabase and hand-rolls all of it). The request action surfaces only pre-send input-format errors (empty/malformed email) and swallows **every** send-side result — the no-account 422 *and* the per-user/global resend throttle — returning an identical "code on its way" state, so the UI state can't be used as an account-enumeration oracle. One residual channel remains: an existing email triggers a synchronous send before the action returns, so response latency differs slightly from the immediate no-account path — inherent to `shouldCreateUser:false`, not closed here.
**Interactions:**
- **DEC-024** (admin-created students are passwordless `auth.users` rows): when the flag is on, those accounts gain a working login path via code — the intended realization of the Phase-4 "link admin-created student to login" capability. DEC-024's "the student cannot log in" is now conditional on this flag.
- **Invites** (`accept_invite`): unaffected — invites grant roles to an already-signed-in user and are orthogonal to sign-in method. Not-yet-registered invitees still bootstrap via registration/Google first; `shouldCreateUser:false` keeps codes out of the onboarding path.
- **DEC-023** (Resend/Zoho mail split): untouched — OTP rides Supabase Auth's SMTP (same channel as confirmation/recovery), not the app's Resend notification path.
**Gating to enable (config, not code):** Magic Link template updated to `{{ .Token }}` in the staging + prod dashboards (`config.toml` does not sync templates to remote); auth `email_sent` rate limit raised above the built-in-sender default of 2/hr; confirm auth SMTP delivers in prod before flipping the flag. @architect reviewed and approved.
**Revisit if:** We move students fully passwordless (phase 2) — that removes password fields + reset/change-password and forces a profile-capture step for first-time code signups (`shouldCreateUser:true`).

## DEC-032: Drop-in courses charge a flat deposit, not the course price (2026-06-30)
**Decision:** Drop-in course types advertise their full admin-set `price` but collect only a flat, configurable **deposit** at checkout (env `DROP_IN_DEPOSIT`, USD; no member discount). The balance is paid to the captain on the day. The student reservation alert copy is configurable (`DROP_IN_ALERT_TEXT`, with a `{DROP_IN_DEPOSIT}` token rendered as currency); the course-detail **Price** stat still shows the full course price. `is_drop_in` now gates the **charge amount** in `createCheckoutSession` (deposit, flat) in addition to the callout + admin badge. Config is server-only env (no schema change), matching the `ENROLLMENT_HOLD_MINUTES` precedent; `codes` was considered but has no admin editor, so it offers no advantage over env for a singleton scalar + copy string.
**Supersedes:** DEC-027's "the hold amount is the course `price` — no separate field" and "`is_drop_in` … not the payment flow." The rest of DEC-027 (model reuse, one-course-per-night, enrollment lifecycle, attendance seeding) is unchanged. A missing/invalid `DROP_IN_DEPOSIT` makes drop-in checkout error clearly rather than charge $0.
**Why:** Andy's actual drop-in pricing is a small deposit to reserve a spot, with the balance collected in person — charging the full course price up front was wrong. The webhook already records Stripe `amount_total`, so the payment record reflects the deposit with no further change.
**Revisit if:** Drop-in pricing needs per-course deposits (move to a column or `codes` with an admin editor) or a refundable-deposit / auth-hold flow.

## DEC-033: Passwordless registration via Supabase OTP — DEC-031 phase 2 (2026-06-30)
**Decision:** When `NEXT_PUBLIC_EMAIL_CODE_AUTH` is on, registration is passwordless: the register form (no password field) calls `signInWithOtp({ shouldCreateUser: true, data: {…profile} })` — creating the `auth.users` row with the profile in `raw_user_meta_data` (the existing `handle_new_user` trigger builds the `profiles` row, identical to the password `signUp`) — and the user verifies the emailed 6-digit code with the shared `verifyEmailCode` / `CodeEntryStep` (no `/register/check-email`, no `/auth/callback` on this path; `verifyOtp` sets the session). Flag off → today's password sign-up, unchanged. Same flag and the same dark/reversible enablement as DEC-031. Supersedes DEC-031's "Revisit if (phase 2)" note.
**Decisions within:** (a) **Profile capture** on the form via `data` — not a deferred "complete profile" step. (b) **Existing-email collision is silent** — `shouldCreateUser:true` on a known email just sends a sign-in code; the request action swallows every send-side result (logs, never surfaces) so it can't reveal whether the account existed (enumeration-safe, same discipline as `requestEmailCode`). (c) **Password + recovery retained, NOT removed** — having a password is account *state*, not a role, so there's no clean role gate; pre-flag password accounts and Google users keep working. Retiring `forgot`/`reset`/`change-password` is a separate later unit, once effectively all active accounts are passwordless/Google. (d) **Invites unaffected** — invitees register passwordless then `accept_invite`; thread `next=/invite/<token>` through the flow. (e) **No reauth config** — leave `secure_password_change` / reauthentication off; passwordless users can't satisfy a password reauth. (f) **Register `data` carries no role flags** — only profile fields; `handle_new_user` defaults the roles (`is_student=true`) on INSERT. This closes a privilege-downgrade vector: were GoTrue ever to apply `options.data` to an existing user on a sign-in OTP, an `is_admin:false` in the payload could clobber an elevated account's flags pre-verification (the re-stamp trigger only fills NULLs, not explicit `false`).
**Gating to enable (config, not code):** the **Confirm-signup** email template must emit `{{ .Token }}` — a *new* signup sends the confirmation template, NOT Magic Link, so DEC-031's Magic Link fix doesn't cover it. Done in `supabase/templates/confirmation.html` (keeps `{{ .ConfirmationURL }}` too, so both flag states work) and must be applied to the staging + prod dashboard "Confirm signup" templates (`config.toml` doesn't sync to remote). Plus the DEC-031 enablement (Magic Link template, OTP length, the flag). No schema change, no migration, no new RLS — `handle_new_user` already does the insert.
**Revisit if:** We retire the password/recovery surface (separate unit), or add a change-email feature (re-check the reauth path).

## DEC-034: Preview QA via repointing dev-sailbook.vercel.app, not per-PR previews (2026-07-01)
**Decision:** Full auth/OAuth/Stripe-checkout QA of a feature branch happens by repointing `dev-sailbook.vercel.app`'s Vercel Git Branch assignment (Settings → Domains → Edit) to that branch, QA'ing there, then repointing back to `main` — not by relying on each PR's own ephemeral Vercel preview URL. Gated `/promote-production` (Step 0.5) on this having happened for the promoted commit.
**Why:** Google's OAuth "Authorized JavaScript origins" field requires an exact, pre-registered origin — no wildcards, no per-branch registration — so a new hostname per PR can never support Google sign-in. `dev-sailbook.vercel.app` already has working Google OAuth (Supabase staging Site URL/Redirect URLs configured for it, fixed session 135) and is the one `NEXT_PUBLIC_SITE_URL` value every preview build shares, so per-PR preview URLs already redirect auth/checkout flows there regardless — repointing just makes that the point, instead of an accidental landing spot. Filed against issue #99 after a session where PRs were merged and promoted straight to production because preview QA felt unusable.
**Revisit if:** A second concurrent QA'er needs the domain at the same time (one QA slot today), or per-PR OAuth becomes worth the cost of a wildcard Supabase Redirect URL entry + verifying Google's origin-matching behavior against it.

## DEC-035: Account credit as an immutable ledger, not a mutable balance column (2026-07-02)
**Decision:** Student account credit (#106 — admin issues credit instead of a cash refund) is modeled as `credit_ledger`, an append-only table: one row per event (`amount_cents` positive = issued, negative = a future redemption from #107), balance is always `SUM(amount_cents)` for the student — never a separately-stored running-balance column. RLS grants admins **INSERT + SELECT only**, deliberately no UPDATE/DELETE, so the immutability guarantee is enforced by the database, not just convention.
**Why:** A mutable balance column can silently drift from reality (a missed update, a race, a bug) with no way to reconstruct what happened. A ledger's rows are individually auditable (who issued it, when, why, linked back to the originating enrollment) and the balance is always a derived, trustworthy sum. This is the app's first ledger-style table — worth establishing the pattern now since #107 (redemption at checkout) extends it directly, and any future credit-adjacent feature should follow the same shape rather than reinvent a balance column.
**No Stripe call for issuance:** crediting an account does not refund the original charge — the school keeps the cash, the student gets a redeemable, non-expiring balance. `payments.status` gets a `'credited'` value (reusing `refund_amount_cents` to record the credited amount — same "money left this payment record" semantics as a refund, just a different destination) so admin views can distinguish credited-not-refunded payments without a new column.
**Revisit if:** A redemption bug or dispute requires "undoing" a ledger row — the fix should be a new, explicit reversal row (negative amount, reason referencing the original), never an UPDATE/DELETE on the original.
**Status update (2026-07-08):** UI disabled. Reviewing #113 (a partial-credit reversal gap) surfaced a bigger unresolved question — whether courses should stop offering cash refunds entirely and settle only in credit, with a separate "cash out credit" admin action as the sole path to real money leaving the system. That's a real policy call for Andy, not an implementation detail, so the admin "Issue Credit" action and all student/admin-facing credit balance displays were removed from the UI pending that conversation. The `credit_ledger` table, RLS, `issueCredit()`, and its pgTAP coverage are left in place — nothing here was wrong, the feature just isn't ready to expose until the policy is settled. #107 (spend credit at checkout) was closed without merging for the same reason. Re-enabling is UI work only once the policy question resolves.

## V2 Decisions (to be resolved during build)

| ID | Decision | When | Who | Status |
|----|----------|------|-----|--------|
| DEC-025 | Manual payment path for admin enrollment | Phase 4, task 4.4b | @architect | Done |
| DEC-024 | Admin-created student uses passwordless auth row | Phase 4, task 4.4a | @architect | Done |
| DEC-022 | Student cancellation refund policy | Phase 2, task 2.7 | Andy | Done |
| DEC-021 | Generic codes/lookup table pattern | Phase 1, task 1.7 | DEC entry | Done |
| DEC-019 | Inactive instructor cascade behavior | Phase 1, task 1.3 | DEC entry | Done |
| DEC-TBD | Pessimistic inventory / enrollment hold duration | Phase 2, task 2.3 | DEC + Andy | Pending |
| DEC-TBD | Scheduled job infrastructure (Vercel Cron vs Supabase Edge Functions) | Phase 2, task 2.4 | @architect | Pending |
| DEC-026 | Notification settings storage (JSONB on profiles) | Phase 3, task 3.8 | @architect | Done |
| DEC-027 | Drop-in enrollment model (per-session vs per-course, flag on course_type) | Phase 5, task 5.2 | @architect + Andy | Done |
