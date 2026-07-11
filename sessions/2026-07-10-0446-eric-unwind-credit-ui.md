---
session: 140
dev: eric
slug: unwind-credit-ui
branch: task/unwind-credit-ui
started: 2026-07-10T04:46:33Z
ended:
points:
pr_numbers: [131, 132, 134, 135]
status: open
transcript: /home/eric/.claude/projects/-home-eric-sailbook/f75a1782-10fd-4f41-81ff-39d21865a258.jsonl
---

# Session 140 — unwind-credit-ui

<!-- Task blocks appended by /kill-this, one per task. -->

## Task 1: Link student names in Users list to their profile page (#127)

**Completed:**
- Scoped #127 ("Student Profiles") and found ~90% already built: `/admin/users` has a first-class Users list (`users-list.tsx`) with name/email search, role-filter pills (All/Admin/Instructor/Student), and sortable columns; `/admin/students/[id]` is a full profile page rendering course history via `fetchStudentHistory` → `student-history-list.tsx` (Enrolled/Completed/Cancelled/Attended/Missed). Confirmed with Eric to cut scope to the one real gap.
- The gap: the Users list linked a student's **name** to `/admin/students/[id]/edit` (edit form), so the profile+history page was only reachable via the row ⋯ menu's "Experience" item — off the "click a student → see their courses" path Eric expected.
- `src/components/admin/users-list.tsx` — added a `nameHref` (students → `/admin/students/${id}`, other roles → their existing `editHref`); `editHref` still flows to `UserRowActions` so Edit stays reachable via the ⋯ menu and the profile's own Edit link.
- `tests/admin-users.spec.ts` — new test: filter to Student, click a student name, assert URL lands on `/admin/students/[id]` (not `/edit`), Course History heading visible, Edit link present.
- Verified: build green; `admin-users.spec.ts` 5/5 desktop; 375px screenshot of the profile page (the new landing target) renders cleanly. No migration, no RLS change.

**Code review:** @code-review — Clean bill of health. `nameHref` branches only for students, `editHref` unchanged for the row actions, no dead end to Edit (three paths), test selectors match source with no flakiness.
**PR:** [#131](https://github.com/mobiustripper42/sailbook/pull/131)
**Points:** 1
**Branch:** task/127-student-profile-link
**Opened at:** 2026-07-10T11:28:55Z

## Task 2: Add student filter to admin Calendar/List (#111)

**Completed:**
- The blocker (flagged in session 139's Next Steps): `SessionEvent` carried no per-session student info and the calendar query never joined enrollments — a student filter needs a data change, not just a dropdown.
- `src/app/(admin)/admin/calendar/page.tsx` — after building the session list, a second flat query on `session_attendance` (joined `enrollments → profiles` via `enrollments_student_id_fkey`), keyed on the loaded session IDs, builds each session's roster into a `Map<sessionId, SessionEvent>`; attaches `studentNames[]`. Excludes cancelled enrollments (effective roster). Chose the flat-second-query shape over a 4-level nested embed — matches the `makeupCounts` pattern in `admin/courses/[id]/page.tsx`.
- `src/components/shared/sessions-calendar.tsx` — `studentNames?: string[]` added to `SessionEvent`.
- `src/components/admin/admin-calendar-view.tsx` — third "All students" `Select`, mirroring the instructor filter exactly (name-based `useMemo` dedupe, sorted; extends the shared `filtered` memo so Calendar and List both filter). `data-testid="filter-student"`.
- `tests/admin-instructor-calendar.spec.ts` — filter-presence assertion + a deterministic include/exclude test (two fresh courses, one student each, via two browser contexts to sidestep `createTestCourse`'s non-idempotent `loginAs`; asserts each student filter shows only its own course). 7/7 desktop.
- Verified: build green; full spec 7/7 desktop; 375px screenshot confirms the three filters stack cleanly. No migration, no RLS change (read-only join; admin reads all).

**Code review:** @code-review — one fix taken before merge (roster query dropped its `error` silently → now logged non-fatally, matching the sibling query; comment corrected to match exclude-cancelled logic), split into a follow-up commit rather than force-pushing. Noted by design: name-based filter can collide on duplicate names — inherited from the instructor filter per Eric's "match the instructor filter" call; student-id switch is a possible future follow-up. Unbounded whole-calendar roster fetch is fine at current scale.

**PR:** [#132](https://github.com/mobiustripper42/sailbook/pull/132)
**Points:** 3
**Branch:** task/111-calendar-student-filter
**Opened at:** 2026-07-10T16:33:41Z

## Task 3: Make phone required for students (#129 — PR A of two)

**Completed:**
- #129 ("addresses for book shipping") split with Eric into PR A (phone required, no migration) + PR B (address at ASA enrollment, migration). This is PR A. Decisions: address is NOT on the registration form — it's collected/confirmed at ASA-class enroll (student self-enroll only); phone required at registration + admin forms + OTP; "shipped" checkbox deferred.
- Phone now required (form-layer, no DB `NOT NULL` — existing null-phone rows untouched) at: `register-form.tsx` + `register` action, `requestRegisterCode` (OTP register), `create-admin-student-form.tsx` + `createAdminStudent`, `user-edit-form.tsx` + `updateUserProfile` (gated on `is_student` so admin/instructor-only accounts stay optional), and — review catch — `student-account-form.tsx` + `updateStudentProfile` (student's own account edit).
- Tests: new required-phone tests (`auth.spec.ts`, `admin-students.spec.ts`, `form-field-preservation.spec.ts`). Fixed full-suite landmines my change created: `auth-email-verification.spec.ts` (3 registration submits) + `passwordless-register.spec.ts` (`fillProfile` helper) + the duplicate-email test now supply a phone; corrected an over-eager replace_all that wrongly added phone to two `/login` steps.
- Verified: build green; ran auth/admin-students/auth-email-verification/form-field-preservation/instructor-notes/member-pricing/unsaved-changes/asa-number desktop — all green (passwordless skips locally, flag off; fix is in for CI). 375px Add Student form clean.

**Code review:** @code-review — two real gaps, both "where can a student still lack a phone": (1) FIXED — student self-service account form let them blank their own phone (guarded + test, shipped as a follow-up commit); (2) DEFERRED + tracked as **#133** — Google OAuth signup collects no phone (needs a post-OAuth onboarding gate, a new flow, not a validation tweak). Four originally-touched surfaces reviewed clean.

**PR:** [#134](https://github.com/mobiustripper42/sailbook/pull/134)
**Points:** 2
**Branch:** task/129a-phone-required
**Opened at:** 2026-07-10T19:56:03Z

## Task 4: Require a mailing address to enroll in ASA courses (#129 — PR B of two)

**Completed:**
- ASA courses ship a textbook → student must have a mailing address before self-enroll. ASA detection: `course_types.certification_body === 'ASA'` (normalized case/whitespace).
- `supabase/migrations/20260710200000_add_address_to_profiles.sql` — 5 nullable address columns on `profiles` (no RLS change; inherit existing policies — the self-update WITH CHECK only guards role flags + auth_source). `src/lib/supabase/types.ts` updated (Row/Insert/Update).
- `src/lib/address.ts` (`hasCompleteMailingAddress`), `src/actions/address.ts` (`getMyAddress`/`updateMyAddress`, self-update, 2-letter state validation).
- Gate in `createCheckoutSession` (`student/courses/[id]/actions.ts`): loads profile early and returns `{ error, needsAddress: true }` before the hold-reuse branch + all Stripe work when ASA + address incomplete. `enroll-button.tsx` opens `address-dialog.tsx` on `needsAddress` (pre-fills existing address to confirm; only sets non-empty fields to avoid clobbering) → retries checkout. Admin student profile page shows the address read-only. Dev-only `/api/test/set-address` for test setup.
- `tests/asa-address.spec.ts` — ASA gate→dialog→retry-to-Stripe (abort-navigation + assert `cs_test_` request, payment-e2e pattern) + non-ASA pass-through. The test caught a real race bug (async pre-fill clobbering typed input) — fixed. Verified: build green; 2/2 ASA tests; 24 checkout/enroll regression tests; admin profile/history specs; 375px dialog clean (needed a local `supabase db reset` for the new columns).

**Code review:** @code-review — two findings: (1) FIXED — hold-reuse branch could return a reused Stripe session before the gate (course re-tagged ASA after a hold); moved the gate above it (follow-up commit, retested green). (2) NOTED — `certification_body` free-text means a non-`ASA` spelling silently disables the gate; already normalizes case/whitespace, full enum is course-type-editing scope, reasonable follow-up. RLS/dead-code/dev-gate all confirmed clean.

**PR:** [#135](https://github.com/mobiustripper42/sailbook/pull/135)
**Points:** 5
**Branch:** task/129b-asa-address
**Opened at:** 2026-07-11T17:59:46Z

**Next Steps:**
- #133 (new): post-OAuth phone collection — the one student-creation path PR A can't cover form-side.
- Possible follow-up (from PR B review): constrain `course_types.certification_body` to an enum/select so an ASA typo can't silently disable the address gate.
- 5 PRs open this session (#131, #132, #134, #135 + #128 already merged) — merge whenever; #134 (phone) and #135 (address) are independent halves of #129.

**Context:**
