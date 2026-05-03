# SailBook V2 — Phase Retrospectives

Written at each phase boundary. See Phase Boundary Checklist in `PROJECT_PLAN.md`.

Format per entry: velocity, scope changes, what worked, what didn't, forecast update.

---

## Phase 5 — Pricing & Enrollment
**Completed:** 2026-05-03 (retroactive close)
**Sessions:** overlapping with Phase 4 and Phase 6 sprint toward May 4 launch

### Velocity

| Metric | Value |
|--------|-------|
| Effort points | 39 pts (was 50; −11 for 5.1/5.3/5.5/5.6 cut to V3) |
| Projected hours | ~13 hrs |
| Actual hours | not separately tracked (merged into multi-phase sprint sessions) |

### Scope Changes
- **Cut to V3:** 5.1 (per-session pricing override), 5.3 (coupon/promo codes), 5.5 (refund policy enforcement), 5.6 (duplicate same-type enrollment behavior). All safely deferrable.
- **Added:** 5.2 (Open Sailing drop-in, promoted from V3), 5.4 (prerequisite flagging, promoted), 5.7 (waitlist, promoted), 5.8 (low enrollment warning, promoted).
- **Carried forward:** 5.11 (bulk price update) — elevated to high priority; expected day-1 use.

### What Worked
- Promoting the drop-in model (5.2) early was the right call — it forced a clean DEC-027 with zero schema changes to enrollment/payments.
- Waitlist notify-all-on-opening model (race-to-enroll) avoided the complexity of a queue; correct for a small school.
- Prerequisite flagging kept strictly informational (warning, not blocking) — avoided a rabbit hole of approval flows.

### What Didn't Work
- Retrospective was skipped at the time. Sprint pace toward May 4 launch was the reason. Acceptable tradeoff.
- Phase 5 tasks shipped interleaved with Phase 4 and 6, making velocity per-phase harder to attribute. Future multi-phase sprints: note the phase boundary in the session log.

---

## Phase 4 — Identity & Profiles
**Completed:** 2026-05-03 (retroactive close)
**Sessions:** overlapping sprint sessions; core work in sessions 94, 107–110

### Velocity

| Metric | Value |
|--------|-------|
| Effort points | 42 pts (−3 for 4.7 cut to V3; +2 for 4.11 substitute-instructor bug) |
| Projected hours | ~10 hrs |
| Actual hours | not separately tracked (merged into multi-phase sprint sessions) |

### Scope Changes
- **Cut to V3:** 4.7 (bulk student import).
- **Added:** 4.10 (ui-reviewer agent recreated), 4.11 (substitute-instructor bug + DEC-007 pgTAP).
- **4.3 closed as delivered:** student profile expansion was delivered across 1.5/1.6/1.7/1.23 — no residual scope.
- **4.5 not required:** admin-created students use Forgot Password to set their own password. No code needed.

### What Worked
- Reusable invite link design (4.1) paid off immediately when wiring admin invite (4.2) — same RPC, same component pattern.
- `handle_new_user` SECURITY DEFINER trigger (from 3.11) unified profile creation across all auth paths — no special-casing in invite or admin-create flows.
- Splitting 4.2 into two sub-tasks (consolidation + deletion of old routes) made the PR reviewable.

### What Didn't Work
- 4.2 was scoped at 2 pts, shipped at ~11. The consolidation scope (delete routes, migrate invite pages, branch edit by role) wasn't visible at estimate time. Better to spike the deletion surface first.
- Retrospective was skipped at the time. Same reason as Phase 5: sprint pace toward launch.

---

## Phase 3 — Notifications + Auth Hardening
**Completed:** 2026-04-29
**Sessions:** 92, 93, 95–100, 102–106 (13 sessions; sessions 96–97 were 0-pt maintenance/triage)

### Velocity

| Metric | Value |
|--------|-------|
| Effort points (original plan) | 42 pts |
| Effort points (after 3.4 re-estimate + 3.15 add) | 48 pts |
| Projected hours | ~18 hrs |
| Actual hours | ~18.0 hrs |
| **Hrs/point** | **0.38** |
| vs. Phase 2 actual (0.22 hrs/pt) | 73% slower |
| vs. V1 baseline (0.38 hrs/pt) | on baseline |

**Why slower than Phase 2:** Phase 3 had many small tasks (3.1, 3.2, 3.3, 3.5, 3.6, 3.8, 3.9 — all 2–3 pts). Each one carried full per-session overhead (context reload, build, code review, log entry) regardless of task size. Same dynamic Phase 1 had. Two tasks were also genuinely larger than scored: 3.4 was re-estimated 5→8 mid-phase, and 3.11 OAuth was scored 2 but ran ~5 in actual scope (logged as a standing disagreement, not retro-bumped). Off-plan work (test isolation, mobile/Tailscale fix, carryover open-redirect fix, safeNextPath extraction) consumed time but didn't tally to plan tasks — at least 4 hours of "real" work outside the points table.

### Weekly Pace

| Date range | Hours |
|------------|-------|
| Apr 24 (3.3) | 0.75 |
| Apr 25 (3.1, 3.2, 3.4 + 0-pt sessions 96–97) | 4.59 |
| Apr 25–26 (3.5, 3.6, 3.7, 3.8) | 4.16 |
| Apr 26 (3.9) | 1.25 |
| Apr 27 (3.10) | 0.83 |
| Apr 28–29 (3.11, 3.12) | 3.25 |
| Apr 29 (3.13, 3.14, 3.15 + carryovers) | ~3.5 |

Phase 3 ran April 24–29 across 6 days. Hot streak vs. Phase 2's 7-day pace, but a lot of the days were short sessions sandwiched around Eric's life (boat day, mobile testing, parallel-thread work).

### Scope Changes

Tasks added or expanded during Phase 3:
- **3.4 re-estimated 5 → 8 pts** (session 93) — scope included a new cron route + vercel.json entry + threshold logic + both Stripe webhook and admin-enroll trigger paths. Re-estimate happened before work started; clean.
- **3.15 added** (logged-in password change, +3 pts) — discovered during 3.10 session as a real gap (no in-app way for an authenticated user to change password). Slot found in same phase rather than punting to Phase 4.
- **6.18 added** (CI + iOS testing, +5 pts in Phase 6) — surfaced by the parallel-thread mobile bug class on Apr 29; phone-only failure that desktop tests didn't catch. Pushed to Phase 6 rather than scope-creeping Phase 3.

Original: 42 pts. Final: 48 pts (+6, +14%). Cleaner than Phase 1 (+45%); on par with Phase 2 (+5%).

### What Worked

- **Trigger-based profile creation (3.11)** — once the `handle_new_user` SECURITY DEFINER trigger landed, all three auth paths (email/password, Google OAuth, admin-createStudent) flowed through one place. Saved real coordination work in 3.13/3.15 where new auth-adjacent code didn't have to think about the path.
- **DEC-015 form-action shape consistency** — `Promise<string | null>` for forms, `{ error: string | null }` for buttons. Most forms migrated this phase (some still pending in next-steps). Code reviewers caught the deviations early.
- **Mock buffer for notifications** (3.3) — single `/api/test/notifications` endpoint with a runId-scoped JSON buffer made all the dispatcher gating tests possible. First end-to-end automated coverage of channel suppression. Test pattern carried through 3.5, 3.6, 3.7, 3.9 cleanly.
- **Pre-Launch Checklist as a destination** — every "this needs Dashboard config in prod" finding got a checklist line instead of being lost in commit messages. Now 8 lines: SMTP, custom email template, password policy, OAuth provider, Site URL + Redirect URLs, etc. Real value at deploy time.
- **Memory file for Hetzner quirks** — `supabase stop --project-id sailbook`, VS Code Remote-SSH random-port forwarding, allowedDevOrigins-causes-hydration-failure, Tailscale-SSH-breaks-Termius. Each one would have wasted 30+ minutes on re-discovery. Saved as memory.
- **`/its-dead` skill simplification** — removed PM-agent step (PM runs at `/its-alive` next session anyway), added `git pull --rebase` before push to absorb out-of-band commits. Eric explicitly raged about this, the fix landed same session.

### What Didn't Work

- **3.11 OAuth Google estimate (2 → 5 effective)** — looked like a config flip, was actually an end-to-end auth integration. Trigger refactor across 4 auth paths, host-header callback fix, Google name-key surprise (`name`/`full_name`, not `given_name`/`family_name`), proxy role-flag mismatch on OAuth users, VS Code Remote-SSH port-forwarding rabbit hole. Eric flagged he had an instinct to push back on the 2 and didn't. **Lesson:** provider integrations default to 5+ unless the pattern is already established.
- **Cross-file Playwright test isolation still flaky.** Pre-existing pattern from session 102 still unresolved at phase close. Cancellation-request test failed in full-suite, passed in isolation. Mock buffer + shared seed-user state. Earmarked as Phase 6 task (~5–8 pts) but it bites every full-suite run.
- **The /its-dead PM-agent step burned a 30-minute end-of-session wait at session 104.** Skill is now fixed but the friction shipped before being caught. Bigger lesson: skills with slow auxiliary steps need explicit "log off now, opt-in for the slow step" affordances.
- **Parallel-thread work fragmenting velocity math.** Eric ran a parallel CC tab during sessions 101 and 105, and the work commits landed in this branch's history without being attributed to plan tasks. The wall-clock vs. effective-hours gap is now significant — session 105 was logged 8 hours then corrected to 2. Velocity tracking should account for "wall clock" vs. "active" or it will keep over-stating duration.
- **Carryover code-review pattern persists.** Same complaint as Phases 1 and 2: every session opens with "fix N CR items from last session." Three phases in, this is just how the project runs. Stopping to call it out instead of fixing it.

### Code Review Debt (carry into Phase 4)

- **Pre-existing: invited instructors get bounced from `/instructor/dashboard` until JWT refresh.** `accept_invite` writes `is_instructor=true` to public.profiles but does NOT touch auth.users.raw_user_meta_data. The proxy reads from JWT metadata. Was exposed (not introduced) by 3.11's trigger work. Filed as 4.x bug — fix during Phase 4 invite consolidation.
- **Pre-existing: register() role-flag spoof surface.** Hand-crafted client could submit `is_admin: true` via signUp options.data; the trigger trusts user_metadata for defaults. Defense-in-depth: trigger or post-insert step should force `is_admin = is_instructor = false` for `auth_source = 'self_registered'`. Captured as 3.x code-review #2 carryover.
- **Long-running: `useTransientSuccess(pending, state)` hook extraction.** Pattern duplicated in 4 forms now (admin notif, student notif, student profile, change-password). 1 pt cleanup.
- **Long-running: DEC-015 cleanup of `updateProfile` / `updateUserProfile`.** Still on `{ error: string | null }` shape; should be `Promise<string | null>`. ~1 pt.
- **Phase 7 leftover: `~/.claude/agents/ui-reviewer.md` was lost in the dev-box migration.** Re-created as a follow-up; the spec was never committed to git. Either rewrite from scratch or extract from session 38 history.

### Forecast Update (as of 2026-04-29)

**Deadline:** May 15, 2026 (16 days remaining)
**Remaining work:** ~123 pts across Phases 4–6

| Phase | Pts remaining |
|-------|--------------|
| Phase 4 (Identity + Profiles) | 27 (was 27 before phase close — no change) |
| Phase 5 (Pricing + Enrollment) | 47 |
| Phase 6 (Polish + UX, includes new 6.18) | 49 (was 54; minus 5.10 already shipped, plus 6.18 +5) |

At Phase-3-actual velocity (0.38 hrs/pt), remaining = ~46.7 hrs. At 8 hrs/week sustainable pace, that's 5.8 weeks. Deadline is 2.3 weeks away.

**Status: behind plan unless velocity recovers to Phase 2 pace (0.22 hrs/pt → 27 hrs remaining → 3.4 weeks).** Phase 4 and 5 have larger task sizes that historically run faster, so Phase-2-pace recovery is plausible. Cuttable list (5.6, 5.11, 6.7, 6.11, 6.6, 6.9 — see PROJECT_PLAN.md "Cuttable Tasks") covers ~22 pts; if all cut, remaining drops to ~101 pts → ~38 hrs at baseline → 4.7 weeks. Still tight.

**Recommendation:** Re-baseline at Phase 4 close. Phase 4 will reveal whether the larger-task velocity recovery materializes. If it does, ship full V2 by May 15. If it doesn't, cut 5.11, 6.6, 6.7, 6.9, 6.11 immediately at Phase 4 close.

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
