---
session: 142
dev: eric
slug: ui-redesign
branch: feature/ui-redesign
started: 2026-07-19T01:05:07Z
ended: 2026-07-20T14:52:15Z
points: 20
pr_numbers: [167, 168, 170, 172]
status: closed
transcript: /home/eric/.claude/projects/-home-eric-sailbook/09831fad-c94f-4942-a5a4-fbc7c25e4e77.jsonl
---

# Session 142 — ui-redesign

<!-- Task blocks appended by /kill-this, one per task. -->

## Task 1: Muster design-system foundation (10.1, #156)

**Completed:**
- Session setup first: merged `origin/main` (v2.0.1, session 141's 16 commits) into `feature/ui-redesign`, then merged the mockup commit (`docs/design/mockups/sailbook-redesign.html`, was one commit ahead on `claude/sailbook-ui-redesign-dh9chf`). Materialized Phase 10 → issues #156–#166 (created phase:10 + points labels; wrote links into PROJECT_PLAN.md).
- **@architect ratified the token architecture** (DEC-040): Muster palette authored in **hex as source of truth**, shadcn tokens as thin aliases over it — shipped components re-skin with no markup change.
- `src/app/layout.tsx` — IBM Plex Sans (`--font-sans`) + IBM Plex Mono (`--font-mono`) via `next/font`.
- `src/app/globals.css` — Muster palette (`:root` light + `.dark`); shadcn aliases **restated in both scopes** so `var()` re-resolves per theme (fixed a frozen-light-alias bug I caught in my own first pass); system `:focus-visible` token + quiet mouse focus; two shadow levels; 12px radius.
- Resolved two hard CSS-property collisions vs the mockup: mockup `--accent`→`--brand`, `--accent-ink`→`--brand-ink`, `--muted`(text)→`--muted-ink`; shadcn keeps `--accent`=hover(`--sink`), `--muted`=bg(`--rail`).
- `docs/DECISIONS.md` DEC-040; `docs/BRAND.md` faint→AA values; `.claude/ui-context.md` full Muster rewrite; `@ui-reviewer` both-themes/viewport note.
- `tests/design-system.spec.ts` (new) — font, mono, `:focus-visible` ring, theme-split, WCAG-AA contrast. Verified: build green; 5/5 design-system + 6/6 theme pass (desktop); login (light) + admin/courses (**dark**) + admin 375px screenshots confirm re-skin with no regression.

**Code review:** @code-review — clean bill on the diff (all shadcn tokens restated in `.dark`; hex matches mockup both themes; collisions correct; AA contrast independently confirmed). Two out-of-scope advisories: active nav flattens until **10.2/#157** rewires it (still uses `bg-accent`); email templates still say Nunito (pre-existing follow-up).
**PR:** [#167](https://github.com/mobiustripper42/sailbook/pull/167) — base `feature/ui-redesign` (phase integration branch, not main; #156 auto-closes when Phase 10 lands on main)
**Points:** 8
**Branch:** task/10.1-design-system-foundation
**Opened at:** 2026-07-19T04:20:00Z

## Task 2: App-shell unification + lucide standardization (10.2, #157)

**Completed:**
- Collapsed the three copy-paste role shells into one config-driven shell under `src/components/shell/`: `nav-config.ts` (role-keyed items w/ lucide icons), `app-shell.tsx` (server guard + one profiles query for all flags), `app-sidebar.tsx` + `app-mobile-drawer.tsx` + `nav-links.tsx` + `sidebar-footer.tsx` (shared), `layout-metadata.ts`. The 3 route-group layouts are now one-liners (`<AppShell role=…>`).
- Deleted the 6 old nav/drawer components. RoleToggles derived generically from the flags the user holds (consistent admin→instructor→student order across shells; old order was ad-hoc per shell — cosmetic only, flagged in PR).
- **Fixed the 10.1 flattened-active-nav regression:** active nav → `bg-info-bg text-brand-ink` + `aria-current`. Adopted mockup shell details (brand square, "Learn to Sail Cleveland" subtitle, footer avatar).
- **Standardized the app on lucide-react** (shadcn default, ~143× the npm adoption of Hugeicons — 85.8M vs 598K/wk, fetched live). Migrated `theme-toggle` + shadcn `select`/`dropdown-menu` off `@hugeicons`; removed the dep. Filed Muster issue [#479](https://github.com/mobiustripper42/muster/issues/479) to do the same on the shared side.
- Mobile drawer keeps its DOM contract (aria-labels, `.fixed` drawer, overlay) so nav specs stay green. New `tests/app-shell.spec.ts` asserts per-role nav render + active state.
- Verified: build green; desktop 39/39, mobile 14/14 (1 skip) — auth cross-role, dual-role toggle, mobile drawer, theme (post-migration), design-system, app-shell; screenshots of unified shell light/dark + mobile drawer confirm icons + active-nav highlight.

**Code review:** @code-review — clean bill. One cosmetic note (role-toggle order now consistent across shells vs old ad-hoc order) — intentional, no behavior/label change, no test asserts order.
**PR:** [#168](https://github.com/mobiustripper42/sailbook/pull/168) — base `feature/ui-redesign`
**Points:** 5
**Branch:** task/10.2-app-shell-unification
**Opened at:** 2026-07-19T05:10:00Z

## Task 3: Schedule consolidation — /calendar + /courses → /schedule (10.3, #158)

**Completed:**
- New `/admin/schedule` with a Month/List toggle: `src/app/(admin)/admin/schedule/page.tsx` (two fetches — all courses for the table + active-course session events for the calendar) + `src/components/admin/schedule-view.tsx` (Month = calendar with course-type/instructor/student filters + hue legend; List = `CoursesList` table).
- `/admin/calendar` + `/admin/courses` now `redirect('/admin/schedule')`; `/admin/courses/[id]` detail/edit/attendance/new unchanged. Deleted `admin-calendar-view.tsx`.
- Single "Schedule" nav item (Calendar + Courses collapsed) with a `match` prefix so it stays active on the course-detail subtree; breadcrumbs "Courses"→"Schedule" (4 pages) + dashboard quick link.
- Calendar pills tinted by course-type hue (`--t-*`, cycled for >5 types, **dark text for AA**) + legend. `SessionsViewSwitcher` labels parameterized (Month/List here; instructor calendar keeps Calendar/List — unaffected).
- **#140:** courses list defaults to earliest-session-date order (`earliestSessionDate` + compareCourses 'date'; no-session courses sort last).
- **Caught + fixed a 10.1 a11y regression:** Muster `--warn` (`#b45309`) was only 3.91:1 on the dashboard warning/10 tint → darkened to `#8a3d02` (globals + BRAND). Surfaced by running `accessibility.spec` (10.1/10.2 hadn't).
- Verified: build green; desktop specs (calendar/schedule/courses-list/app-shell/dashboard/accessibility/time-select[isolated]/instructor-cascade/unsaved-changes/student-courses-calendar) + mobile admin-mobile all pass; screenshots of Month (legend + hued pills) and List (date-ordered table) confirm.

**Code review:** @code-review — clean bill on load-bearing code. Took the one actionable finding: repointed `revalidatePath('/admin/courses')` → `/admin/schedule` (harmless via force-dynamic, but a landmine). Deferred: courses-list.tsx >200 lines (pre-existing); hued pills lack hover (cosmetic).
**PR:** [#170](https://github.com/mobiustripper42/sailbook/pull/170) — base auto-moved to `feature/ui-redesign` after #168 merged; MERGEABLE/clean
**Design correction (commit 9ce37ee, post-review):** first pass wrongly made Schedule's List = the courses table (per mockup). Corrected: **Schedule = sessions** (Month calendar / List agenda, filters narrow both); **Courses = separate** table + nav item. `/admin/calendar`→`/admin/schedule` redirect kept; `/admin/courses` restored. Kept type-hue pills/legend, #140, --warn fix. Verified green after rework.
**Points:** 5
**Branch:** task/10.3-schedule-consolidation
**Opened at:** 2026-07-20T00:00:00Z

## Task 4: Input-border contrast — WCAG 1.4.11 (#171)

**Completed:**
- Bug found while polishing 10.3: text inputs nearly invisible in light mode (`--input` aliased the `--line` hairline, ~1.2:1 on white). `accessibility.spec`'s axe pass missed it — axe checks text contrast, not component borders (1.4.11).
- `globals.css`: new `--field-border` token (both palettes: `#7e8792` light ~3.6:1 / `#66707f` dark ~3.3:1); `--input` aliases it, decoupled from `--line` so card/table hairlines stay subtle.
- `input/select/textarea`: fill `bg-input/30` → `bg-transparent` (darkening the border darkened the fill too, dropping the select's muted placeholder to 3.82:1). Select `dark:hover:bg-input/50` → `dark:hover:bg-muted`.
- `button` outline: fill `bg-input/30` → `bg-muted/50` (kept subtle, not a side-effect of the border change).
- `design-system.spec.ts`: **measured** non-text-contrast test (input border ≥3:1 on surface + bg, both themes) as a regression guard.
- Verified: build green; design-system 6/6 (incl. new #171 test) + accessibility 14/14; login screenshot confirms clearly-bounded fields.

**Code review:** @code-review — core fix solid (both-palette alias, 3.24–3.71:1 margins, safe button swap, correct test). Took the one finding: leftover `dark:hover:bg-input/50` on the select → `bg-muted`. No `bg-input` usages remain.
**PR:** [#172](https://github.com/mobiustripper42/sailbook/pull/172) — base `feature/ui-redesign`
**Points:** 2
**Branch:** task/171-input-contrast
**Opened at:** 2026-07-20T02:00:00Z

**Next Steps:**
- **10.3b** (#122): click a calendar day → `/admin/courses/new?date=…` with the date seeded in CourseForm.
- Phase 10 continues: 10.4 (section_label/schedule model), 10.5–10.11.
- Open PRs to merge: #172 (input contrast). Stack #168/#170 already merged into feature/ui-redesign.

**Context:**
- ui-redesign work lives in a dedicated worktree: `/home/eric/sailbook-redesign` on `feature/ui-redesign` (4 docs/planning commits ahead of main, no PR yet — BRAND.md Muster identity, V3 phase/decisions, Account single-save AC, #152 print-addresses folded into Phase 10). Session anchor branch is `feature/ui-redesign`; primary checkout is on `main`.
