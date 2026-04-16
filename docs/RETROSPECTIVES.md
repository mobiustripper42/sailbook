# SailBook V2 — Phase Retrospectives

Written at each phase boundary. See Phase Boundary Checklist in `PROJECT_PLAN.md`.

Format per entry: velocity, scope changes, what worked, what didn't, forecast update.

---

## Phase 1 — V1 Fixes & Gaps
**Completed:** 2026-04-16  
**Sessions:** 48–76 (plus mixed-phase work in 67–68)

### Velocity

| Metric | Value |
|--------|-------|
| Effort points (tasks) | 58 pts |
| Effort points (incl. session 49 polish credit) | 66 pts |
| Projected hours | ~19 hrs |
| Actual hours | ~14.9 hrs |
| **Hrs/point (task pts)** | **0.26** |
| Hrs/point (all-in incl. polish) | 0.23 |
| vs. V1 baseline (0.38 hrs/pt) | 32% faster |

**Why faster than baseline:** Phase 0 infrastructure paid off immediately. Migration protocol, pgTAP patterns, Playwright helpers, and established component conventions all reduced per-task friction. Short 2-pt tasks (1.16, 1.17, 1.18, etc.) also inflated point count relative to effort — Phase 2's heavier 5-pointers will likely regress velocity toward 0.30–0.35.

### Weekly Pace (observed)

The entire project (Phase 0 + Phase 1) ran April 11–16: 6 days, ~28 hours total. This is the only data we have. Daily breakdown:

| Date | Hours |
|------|-------|
| Apr 11 | 0.9 |
| Apr 12 | 6.3 |
| Apr 13 | 2.6 |
| Apr 14 | 4.1 |
| Apr 15 | 7.6 |
| Apr 16 (partial) | 1.5 |

No reliable "steady state" weekly number yet — this was a sprint. Use with caution for forecasting.

### Scope Changes

Tasks added during Phase 1 (not in original plan):
- **1.16** — Admin mobile hamburger (regression from theme work)
- **1.17** — Session row Action dropdown (consolidation)
- **1.18** — Logo + favicon
- **1.19** — /dev dark mode
- **1.20** — Instructor mobile hamburger
- **1.21** — Dev login helper
- **1.22** — @ui-reviewer audit (renumbered as 6.3/6.4, done early)
- **1.23** — Student account page

Original estimate: 40 pts. Final: 58 pts (+18 pts, +45%). Most additions were small (2 pts), legitimately discovered during development. None are scope creep — all were gaps in the original V1 gap analysis.

### What Worked

- **Code review after every commit** caught real bugs early (RLS gaps, security issues in password reset, silent enrollment write errors). Worth the overhead.
- **pgTAP before Playwright** — having RLS tests as a baseline made it much faster to reason about instructor access changes in 1.5.
- **Session log continuity** — `/its-alive` → `/kill-this` → `/its-dead` rhythm worked well. No "where was I?" overhead at session starts.
- **Tasks 6.3/6.4 (ui-reviewer) done early** — doing the full UI audit before Phase 2 meant Phase 2 builds on a clean visual foundation rather than polishing at the end.

### What Didn't Work

- **Phase 1 point total kept growing** — 7 tasks added. Fine individually, but the plan underestimated "gap filling" work. Future phases should build in a 20% buffer for discovered tasks.
- **Mixed-phase sessions** — Sessions 67–68 split between Phase 1 and Phase 2 work, making velocity attribution messy. Try to finish a phase cleanly before starting the next.
- **Code review debt** — Multiple sessions started with "fix N code review deferrals from last session" before doing new work. The deferred-fix pattern adds overhead. Consider: fix in the same session or don't defer at all.

### Forecast Update (as of 2026-04-16)

**Deadline:** May 15, 2026 (29 days remaining)  
**Remaining work:** ~161 pts across Phases 2–6

| Scope | Hrs needed | Hrs/wk needed | Verdict |
|-------|-----------|---------------|---------|
| Full scope (161 pts @ 0.26) | ~42 hrs | ~20 hrs/wk | Needs sustained sprint pace |
| Full scope (161 pts @ 0.35) | ~56 hrs | ~27 hrs/wk | Requires current intensity |
| **Critical path** (Phase 2 + core Phase 3, ~46 pts) | ~12–16 hrs | ~6–8 hrs/wk | Easily achievable |

**Recommendation:** Target critical path (payments live + core notifications) for May 15. Defer Phases 4, 5, and most of 6 to post-launch. See "Cuttable Tasks" in `PROJECT_PLAN.md`.

### Code Review Debt (carry into Phase 2)

From session 76 Next Steps — do before Phase 2 features:
1. `updateStudentProfile` — add ~2000 char length cap to `instructor_notes`
2. pgTAP test — assert students can't read other students' notes
3. Confirm with Andy: is instructor access to student email in session roster intentional?

---

## Phase 0 — Infrastructure
**Completed:** 2026-04-12  
**Sessions:** 31–47 + retroactive credit

### Velocity

| Metric | Value |
|--------|-------|
| Effort points | 70 pts |
| Projected hours | ~27 hrs |
| Actual hours | ~5.1 hrs |
| Hrs/point | 0.07 |

**Note:** Phase 0 is setup work against a pre-built V1. The 0.07 hrs/pt figure is not a velocity signal — it reflects that Docker install, supabase init, pgTAP setup, and Playwright install are all inherently fast when you know what you're doing. Use Phase 1+ for forecasting. The V1 baseline (0.38 hrs/pt) was from feature development, not infrastructure.
