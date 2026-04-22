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
**Why:** Simply Sailing offers the same course type (ASA 101) in different formats — weekend intensive, evening series, etc. A course type is the template. A course is the specific offering. Sessions are the time blocks. This handles: multi-day courses, flexible scheduling patterns, Open Sailing as recurring single sessions, and instructor swaps per session.
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
**Why:** Typically one instructor teaches the whole course. But Simply Sailing wants the ability to swap instructors mid-course for specific sessions. NULL on session means use course default.
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
**Why:** Simply Sailing is a small school where Andy knows every student. Giving him control over refund decisions avoids abuse (cancelling 10 minutes before class) without requiring a policy engine. A deadline-based policy (Phase 6) can layer on later if volume demands it.
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

## V2 Decisions (to be resolved during build)

| ID | Decision | When | Who | Status |
|----|----------|------|-----|--------|
| DEC-022 | Student cancellation refund policy | Phase 2, task 2.7 | Andy | Done |
| DEC-021 | Generic codes/lookup table pattern | Phase 1, task 1.7 | DEC entry | Done |
| DEC-019 | Inactive instructor cascade behavior | Phase 1, task 1.3 | DEC entry | Done |
| DEC-TBD | Pessimistic inventory / enrollment hold duration | Phase 2, task 2.3 | DEC + Andy | Pending |
| DEC-TBD | Scheduled job infrastructure (Vercel Cron vs Supabase Edge Functions) | Phase 2, task 2.4 | @architect | Pending |
| DEC-TBD | Notification settings storage (table vs JSON column) | Phase 3, task 3.8 | @architect | Pending |
| DEC-TBD | Admin-created student architecture (profile without auth?) | Phase 4, task 4.4 | @architect | Pending |
| DEC-TBD | Drop-in enrollment model (per-session vs per-course, flag on course) | Phase 5, task 5.2 | @architect + Andy | Pending |
