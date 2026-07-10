---
session: 140
dev: eric
slug: unwind-credit-ui
branch: task/unwind-credit-ui
started: 2026-07-10T04:46:33Z
ended:
points:
pr_numbers: [131]
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

**Next Steps:**

**Context:**
