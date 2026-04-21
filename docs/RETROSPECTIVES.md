# SailBook V2 — Phase Retrospectives

Written at each phase boundary. See Phase Boundary Checklist in `PROJECT_PLAN.md`.

Format per entry: velocity, scope changes, what worked, what didn't, forecast update.

---

## Phase 2 — Payments (Stripe)
**Completed:** 2026-04-21  
**Sessions:** 67–85 (minus Phase 1 sessions 71, 73–76; minus tooling session 78)

### Velocity

| Metric | Value |
|--------|-------|
| Effort points (original plan) | 38 pts |
| Effort points (after 2.8 partial-refund expansion) | 40 pts |
| Projected hours | ~14 hrs |
| Actual hours | ~8.7 hrs |
| **Hrs/point** | **0.22** |
| vs. Phase 1 actual (0.26 hrs/pt) | 15% faster |
| vs. V1 baseline (0.38 hrs/pt) | 42% faster |

**Why faster than Phase 1:** Phase 2 had fewer small 2-pt tasks inflating the point count — it was mostly 5-pointers with real density. The Playwright helpers and Stripe test-mode patterns also paid off fast once established. The deferred-CR pattern added a tax at every session start, but not enough to drag the average up significantly.

### Weekly Pace

| Date range | Hours |
|------------|-------|
| Apr 15 (Phase 2 kickoff, mixed with Phase 1) | ~0.6 |
| Apr 17–18 (2.4–2.5) | ~2.7 |
| Apr 19 (2.8) | ~1.0 |
| Apr 20 (2.9–2.11) | ~1.7 |
| Apr 21 (2.12 + CR close) | ~1.3 |

Phase 2 ran April 15–21 across 7 days. Work was uneven — heavily front-loaded Apr 15 and then Apr 17–21. Not a sustainable daily pace, but it shipped cleanly.

### Scope Changes

Tasks added or expanded during Phase 2:
- **2.8 expanded** — partial refund support (+2 pts; partial refunds are a legitimate admin need, worth it)
- **6.15 added** (admin pending cancellation widget) — discovered need during 2.7; parked in Phase 6
- **6.16 added** (show refund amount to student) — discovered during 2.8; parked in Phase 6

No tasks were added to Phase 2 itself. New discoveries were pushed to Phase 6 rather than scope-creeping the current phase — this is the right pattern.

Original: 38 pts. Final: 40 pts (+2, +5%). Tighter than Phase 1 (+45%).

### What Worked

- **E2E Playwright payment test (2.10)** — intercepting the Stripe redirect to capture `cs_test_` session ID without actually navigating to Stripe was elegant. The test covers the entire confirm→cancel→refund chain with a real Stripe test charge. High confidence on the most critical flow in the app.
- **DB-level idempotency backstop** — UNIQUE constraint on `payments.stripe_checkout_session_id` is the right backstop for concurrent webhook delivery. Application-layer guard handles the common case; DB handles the race.
- **DEC-022 decision** (admin-controlled refund) — making refund processing an admin action rather than automatic simplified 2.7 significantly. The decision doc pattern paid off: having an explicit DEC prevented scope drift.
- **Code review cadence** — still catching real bugs: WITH CHECK gap on enrollments (security), missing idempotency key on refunds (correctness), AlertDialogAction auto-dismiss issue (UX bug), processRefund missing admin guard (security). Four genuine catches across the phase.
- **Scope containment** — both 6.15 and 6.16 could have crept into Phase 2. They didn't. Clean ejection point.

### What Didn't Work

- **Deferred code review pattern is structural** — every single session started with "fix N CR items from last session." Phase 1 retro flagged this. Phase 2 didn't fix it. The overhead is real but apparently tolerable. Consider making a standing agreement: CR items either get fixed in-session or they don't block the next session's start.
- **Dirty pgTAP DB at phase close** — 02/03/06 count failures at end of Phase 2. This is a known "run `supabase db reset` before next pgTAP work" gotcha that keeps recurring. Worth just running it at every `/its-alive` as a habit.
- **Mixed-phase session attribution** — Sessions 67–68 straddled Phase 1 and Phase 2. Velocity math required estimation. Same issue as Phase 1. It's inherent to kicking off the next phase while wrapping up the prior one; probably just accept it and document the mixed sessions.

### Code Review Debt (carry into Phase 3)

Phase 2 ended with a clean bill of health (session 85). No outstanding code review items.

### Forecast Update (as of 2026-04-21)

**Deadline:** May 15, 2026 (24 days remaining)  
**Remaining work:** ~138 pts across Phases 3–6

| Phase | Pts remaining |
|-------|--------------|
| Phase 3 (Notifications + Auth) | 42 |
| Phase 4 (Identity + Profiles) | 34 |
| Phase 5 (Pricing + Enrollment) | 34 |
| Phase 6 (Polish + UX) | 54 |
| **Total** | **164** |

Phase totals were corrected after retro: end-of-phase close tasks (3.14, 4.9, 5.9, 6.17) re-estimated from 2 → 5 pts each (+14 pts total) to account for full scope: @ui-reviewer, lint, test green, code review, and retrospective.

| Scope | Hrs needed | Hrs/day needed | Verdict |
|-------|-----------|----------------|---------|
| Full scope (164 pts @ 0.22) | ~36 hrs | ~1.5 hrs/day | Achievable at current pace |
| Full scope (164 pts @ 0.30) | ~49 hrs | ~2.0 hrs/day | Tight but feasible |
| **Critical path** (Phase 3 core ~25 pts) | ~6 hrs | ~15 min/day | Zero risk |

**Outlook significantly better than Phase 1 retro projected.** At Phase 1 close, the forecast was "needs sustained sprint pace" for full scope. At Phase 2 close, full scope is achievable at a modest ~1.25 hrs/day. The velocity trend is holding or improving.

**Recommendation:** Stay on critical path (Phase 3) but full scope is no longer a stretch goal — it's a reasonable target. Watch for Phase 4.4 (admin-created students, 8 pts) as the single highest-risk task remaining.

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
