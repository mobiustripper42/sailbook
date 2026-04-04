# SailBook — Architectural Decisions

## DEC-001: Supabase-direct instead of Express API
**Decision:** No separate backend server. React/Next.js talks directly to Supabase.
**Why:** Andy's spec had React → Express → Supabase. The Express layer is ~40% of the build and is entirely CRUD plumbing. Supabase Auth + Row Level Security replaces JWT middleware and role checks. Eliminates backend hosting (Railway). For a single-school MVP with straightforward business logic, the API layer adds cost with no benefit.
**Tradeoff:** Business logic lives in Postgres RLS policies and database functions. Harder to unit test. Migration away from Supabase is more involved later.
**Revisit if:** Business logic becomes complex enough to warrant a dedicated API layer.

## DEC-002: Next.js 14+ over bare React 18
**Decision:** Use Next.js with App Router instead of Create React App.
**Why:** File-based routing eliminates react-router-dom config. Vercel built Next.js — deployment is zero-friction. SSR/SSG available if needed later. React's own docs recommend framework-based approach. Developer (Eric) has prior Next.js experience and preferred it.
**Tradeoff:** App Router is newer, slightly different mental model from Pages Router.

## DEC-003: Single profiles table instead of separate users + students
**Decision:** One `profiles` table for all roles, extending Supabase Auth.
**Why:** Admin, instructor, and student share the same auth flow. Role is a column, not a table. Simplifies queries, RLS policies, and the auth model. Adding roles later is a one-line migration.
**Tradeoff:** Students have nullable fields they don't use (and vice versa for instructors).

## DEC-004: course_type → course → session(s) data model
**Decision:** Three-level hierarchy instead of Andy's flat `classes` table.
**Why:** LTSC offers the same course type (ASA 101) in different formats — weekend intensive, evening series, etc. A course type is the template. A course is the specific offering. Sessions are the time blocks. This handles: multi-day courses, flexible scheduling patterns, Open Sailing as recurring single sessions, and instructor swaps per session.
**Tradeoff:** More joins than a flat model. Slightly more complex admin UI for course creation.

## DEC-005: Enrollment at course level, attendance at session level
**Decision:** Students enroll in courses, not individual sessions. Attendance tracked per session via `session_attendance`.
**Why:** Maps to how sailing schools actually operate — you sign up for "ASA 101 May 17–18," not for Saturday separately from Sunday. Attendance tracking per session enables cancellation/makeup logic: who missed what, and where they made it up.

## DEC-006: Cross-course makeup support
**Decision:** `makeup_session_id` in session_attendance can reference any session, not just sessions within the same course.
**Why:** A student from the Tuesday ASA 101 should be able to make up a missed session in the Saturday ASA 101. Real-world scheduling flexibility.

## DEC-007: Instructor on both course and session
**Decision:** Default `instructor_id` on courses, optional override `instructor_id` on sessions.
**Why:** Typically one instructor teaches the whole course. But LTSC wants the ability to swap instructors mid-course for specific sessions. NULL on session means use course default.

## DEC-008: No schools table (single-tenant)
**Decision:** Dropped Andy's `schools` table and all `school_id` foreign keys.
**Why:** Building for one school. Multi-tenant adds complexity to every query, every RLS policy, every UI component. Can add later as a migration if needed. Not worth the overhead for May 15.

## DEC-009: shadcn/ui for component library
**Decision:** Use shadcn/ui on top of Tailwind CSS.
**Why:** SailBook is forms and tables — exactly what shadcn/ui provides. Components are copied into the repo (not a dependency), so fully customizable. Saves significant time vs building every form input and modal from scratch. Claude Code knows it well. May 15 deadline doesn't leave room for custom UI work.

## DEC-010: Manual makeup scheduling for V1
**Decision:** Admin manually creates makeup sessions and assigns students. No automation.
**Why:** Automated suggestions require understanding availability, cross-course compatibility, and student preferences — complex logic that can wait. Manual flow covers the need for season one. Automated is a fast-follow.

## DEC-011: Price display only, no payment processing
**Decision:** `price` field on courses for display. No checkout, no Stripe, no payment status tracking.
**Why:** Shipping by May 15. Payment processing adds Stripe integration, webhook handling, refund logic, and PCI compliance concerns. The school can collect payment outside the app (cash, Venmo, check) for season one. Schema can accommodate payment fields later without refactoring.

## DEC-012: Vercel for hosting
**Decision:** Vercel free tier for frontend hosting.
**Why:** Built Next.js, zero-config deployment, auto-deploy from GitHub, free tier sufficient for MVP traffic. Best DX available.

## DEC-013: experience_level is static in V1
**Decision:** `profiles.experience_level` is set at registration and never updated automatically.
**Why:** Automatically updating skill level based on completed courses is non-trivial — it requires defining progression rules per course type, handling partial completions, and surfacing it meaningfully in the UI. Out of scope for May 15.
**Known limitation:** A student who completes ASA 101 still shows as 'beginner' until manually updated. Admin can edit profiles directly in Supabase for now.
**V2 path:** This field is the seed of the student skill tracking feature already on the V2 list. When that ships, completed enrollments drive automatic level progression.

## DEC-014: Enrollment status lifecycle — manual confirmation in V1
**Decision:** Enrollment statuses are `registered → confirmed → cancelled / completed`. In V1, admin manually moves a student from `registered` to `confirmed` after receiving payment (cash, Venmo, check). `confirmed` is the payment signal for V1 — no separate `paid` boolean needed.
**Why:** Payment processing is out of scope for May 15. The status column provides the right hook for a future payment integration without any schema change — a Stripe webhook would simply set `status = 'confirmed'` on successful charge.
**V2 path:** Payment flow sets `confirmed` automatically. A 24-hour hold period (registered but not yet confirmed/charged) is a natural extension of this model.

## DEC-015: Server action error handling — two patterns, both return errors
**Decision:** Two error patterns based on how the action is called. No `throw` in server actions.

1. **Form actions** (used with `useActionState`, accept `prevState`): return `string | null`. `null` means success. A string is the error message displayed inline by the form.
2. **Button-triggered actions** (called via `useTransition`): return `{ error: string | null }`. Callers check the result and show inline feedback.

**Why:** The previous codebase had three patterns — the two above plus `throw new Error(...)`. Throwing sends the user to an error boundary with no recovery path except refreshing the page. For a button click that fails (RLS denial, network blip, race condition), that's a dead end. Returning errors lets components show inline feedback and keep the user in context.

The `string | null` form pattern stays because it's React's own `useActionState` convention — changing it would mean fighting the framework.

**Applies to:** All files in `src/actions/`. Seven existing actions using `throw` need migration: `publishCourse`, `completeCourse`, `cancelCourse`, `toggleCourseTypeActive`, `confirmEnrollment`, `cancelEnrollment`, `deleteSession`, `toggleInstructorActive`.
