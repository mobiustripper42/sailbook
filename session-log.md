# SailBook — Session Log

Session summaries for continuity across work sessions.
Format: prepend newest entry at the top.

## Session 104 — 2026-04-28 14:58 [open]

## Session 103 — 2026-04-27 10:51–11:39 (0.83 hrs)
**Duration:** 0.83 hrs | **Points:** 3 (3.10: 3)
**Task:** Phase 3.10 — Password strength + email verification

**⚠ TOP REMINDER FOR NEXT SESSION:**
**Manual smoke test was NOT performed this session.** Eric stopped before exercising the new register → email confirm → login flow in a real browser. Before doing anything else next session: spin up dev, register a new user, find the confirmation email in Mailpit (http://127.0.0.1:54324), click the link, verify landing on /student/dashboard. If it breaks, code review's `cleanup #1` (rollback auth user on profile-insert failure) becomes load-bearing.

**Completed:**
- **Password policy.** `supabase/config.toml`: `minimum_password_length = 12`, `password_requirements = "lower_upper_letters_digits"`. `minLength={12}` + helper text on register and reset-password forms.
- **Email verification (local).** `enable_confirmations = true`. New `src/app/auth/callback/route.ts` exchanges code → session, sanitizes `next` against open-redirect, falls back to `/login?error=...`. New `src/app/(auth)/register/check-email/page.tsx` landing. Register action in `src/app/(auth)/actions.ts` switches profile insert to `adminClient` (signUp returns no session with confirmations on — same pattern as admin-created students). Redirects to `/register/check-email?email=...`. `src/proxy.ts` adds `/auth/` as a public prefix.
- **Custom email template.** `supabase/templates/confirmation.html` — SailBook-branded, Sky/Mist palette, inline-styled (email clients), wired via `[auth.email.template.confirmation]`.
- **Resend SMTP stub.** Commented `[auth.email.smtp]` block in config.toml pointing at `smtp.resend.com:587` with a comment that auth panel doesn't sync from config.toml — production wires in the Supabase Dashboard.
- **Seed password rotated** `qwert12345` → `Sailbook12345` across 7 canonical files: `supabase/seed.sql`, `src/components/dev-login-helper.tsx`, `src/app/dev/page.tsx`, `tests/helpers.ts`, `tests/auth.spec.ts`, `tests/codes.spec.ts`, `docs/QA.md`. Historical archives left alone.
- **Pre-Launch Checklist** in `docs/PROJECT_PLAN.md` gains five lines for remote auth-config rollout (enable_confirmations, custom SMTP, template upload, password policy, Site URL + Redirect URLs — all Dashboard-only).
- **Test API.** New `src/app/api/test/confirm-email/route.ts` (devOnly-gated) force-confirms a user via the admin API so specs can simulate clicking the confirmation link without scraping Mailpit.
- **Tests.** `tests/auth-email-verification.spec.ts` — 5 desktop tests: rejects password missing required character classes, valid registration lands on check-email, unconfirmed user gated from login until force-confirmed, callback with missing code → /login?error=missing_code, callback with invalid code → /login?error=invalid_link.
- **Targeted runs (all green):**
  - `auth-email-verification.spec.ts`: 5/5 desktop
  - `auth.spec.ts`: 36/36 across 3 viewports (verifies new seed password works)
  - `codes.spec.ts`: 9/9 across 3 viewports (uses new seed password)
  - `password-reset.spec.ts`: 18/18 across 3 viewports
- Build green. tsc clean. Lint clean.
- Commit `02305b9`.

**In Progress:** Nothing.

**Blocked:**
- 3.5/3.6/3.7 SMS smoke-test failure carryover from session 102 — Twilio Toll-Free Verification still pending; need to pull Twilio logs.
- Remote rollout of email confirmations + SMTP wiring + template upload — all listed in Pre-Launch Checklist for the deploy session.

**Next Steps:**
1. **Manual smoke test of 3.10 in a browser** (top reminder above). Register a new user, find the confirmation email in Mailpit, click the link, verify dashboard landing. Test path: http://localhost:3000/register → submit → /register/check-email → http://127.0.0.1:54324 → click confirm link → /auth/callback → /student/dashboard.
2. Carry forward from session 102: investigate 3.5/3.6/3.7 SMS smoke-test failure (Twilio logs).
3. Carry forward from session 102: cross-file Playwright test isolation hardening (~5–8 pts, Phase 6).
4. Carry forward from session 102: DEC-015 cleanup of `updateProfile` + `updateUserProfile` (~1 pt).
5. Carry forward from session 102: extract `useTransientSuccess(pending, state)` hook (~1 pt).
6. Code review cleanup #1 (rollback auth user on profile-insert failure in `register()`) becomes higher priority if step 1 reveals the broken-state path is reachable. ~1 pt.
7. Code review cleanup #2 (extract `PASSWORD_RULES_HELP` constant — duplicated in register-form.tsx, reset-password/page.tsx, config.toml). ~1 pt.
8. **3.11 — OAuth login (Google), 2 pts.** Or 3.12 — Security audit, 3 pts. Both are still in Phase 3.

**Context:**
- **adminClient on register is the right call.** With `enable_confirmations = true`, `signUp` does NOT create a session, so the user has no auth context to satisfy RLS on the profiles insert. Service-role bypass mirrors the admin-created-student pattern in `src/actions/profiles.ts` (around line 175). Code review confirmed no new exposure: role flags are hardcoded server-side, only the just-created `data.user.id` is touched.
- **Supabase auth panel does NOT sync from config.toml on remote.** `supabase config push` syncs project settings but the Authentication panel (providers, email templates, SMTP, password policy, URL configuration) is Dashboard-only. Captured in five Pre-Launch Checklist lines so the prod rollout is explicit.
- **Seed password (`Sailbook12345`) bypasses Supabase's password policy.** Supabase enforces password rules only at the API surface (`signUp`, `updateUser`). Direct `INSERT INTO auth.users (encrypted_password)` via SQL bypasses the check. The new seed password meets the policy regardless, for consistency with what users will see in the register form.
- **Hetzner box has no git identity configured.** The Phase 7 dev tooling script didn't set `user.email` / `user.name`. Worked around with one-off `git -c user.email=... -c user.name=...` flags on this commit (no persistent config change). Add to dev-tooling script or `git config --global` on the box; either is fine. Used `mobiustripper42 / mobius5kcrypto@gmail.com` to match prior history.
- **HTML5 `minLength={12}` blocks short passwords client-side.** Server enforces classes-required policy. Tests verify the *missing-classes* path (server-side) by submitting a 14-char all-lowercase password — HTML5 doesn't catch missing uppercase, so the request hits the server.
- **Mailpit is at http://127.0.0.1:54324 on this box.** Replaces Inbucket (older Supabase CLI versions); same role.
- **Co-author tag in this repo is `Claude Opus 4.7 (1M context)`** matching the three prior commits — the kill-this skill template still says "Sonnet 4.6" but the repo convention is Opus 4.7. Worth a one-line fix to `.claude/skills/kill-this/SKILL.md` if you want consistency with the actual tooling.

**Code Review:** 5 advisory cleanups, 0 bugs. (Findings via @code-review against 02305b9.)
1. **consistency** `actions.ts:65` — profile-insert failure leaves orphan `auth.users` row. Same race exists for admin-created students; not new. Either rollback via `admin.deleteUser` on profile error, or document. Captured as next-steps #6.
2. **consistency** Password rules text duplicated in register-form.tsx, reset-password/page.tsx, config.toml. Extract `PASSWORD_RULES_HELP` constant. Captured as next-steps #7.
3. **cleanup** `confirm-email/route.ts:32` — `listUsers({ perPage: 1000 })` silently fails if seed exceeds 1000 users. Iterate pages or add a loud assertion. Local-dev-only, low priority.
4. **cleanup** `auth/callback/route.ts:10` — `next` rejects `//` (good) but not `/\` (backslash). Defense-in-depth: parse with `new URL(...)` and check the origin matches.
5. **cleanup** `proxy.ts` — `/auth/` PUBLIC_PREFIX is broad; only `/auth/callback` exists. Add a comment or be explicit with `/auth/callback`.

## Session 102 — 2026-04-26 20:31–21:46 (1.25 hrs)
**Duration:** 1.25 hrs | **Points:** 2 (3.9: 2)
**Task:** Phase 3.9 — Student notification preferences + DEC-015 migration of updateStudentProfile

**Completed:**
- **DEC-015 pre-work migration of `updateStudentProfile`.**
  - `src/actions/profiles.ts` — return type changed from `Promise<{ error: string | null }>` → `Promise<string | null>` (DEC-015 form-action shape). The lone outlier among student-side form actions; resolved before 3.9 forks the pattern further.
  - `src/components/student/student-account-form.tsx` — reads state directly. "Profile updated." success banner preserved via a transient `pending → idle && state === null` flag. All 4 `instructor-notes.spec.ts` tests still pass against the new shape.
- **Phase 3.9 — Student notification preferences (2 pts).**
  - `src/lib/notifications/preferences.ts` — `STUDENT_GLOBAL_KEY`, `isStudentChannelEnabled(prefs, channel)`, `normalizeStudentPreferences(prefs)`. Same defensive defaults as admin helper (any non-bool / null / missing → enabled).
  - `src/lib/notifications/triggers.ts` — all 4 student fan-outs gated per-channel: `notifyEnrollmentConfirmed`, `notifySessionCancelled`, `notifyMakeupAssigned`, `notifyUpcomingSessionReminders`. Profile selects extended.
  - `src/actions/notification-preferences.ts` — new `updateStudentNotificationPreferences` (DEC-015 shape). **Both admin and student actions now MERGE with existing JSONB instead of replacing**, fixing a latent dual-role bug where saving one role's prefs would erase the other's. New `readExistingPrefs` helper.
  - `src/components/student/notification-preferences-section.tsx` — client form, two checkboxes (SMS / email), same transient success pattern.
  - `src/app/(student)/student/account/page.tsx` — loads `notification_preferences`, mounts new section below the profile form.
  - `src/app/api/test/set-notification-prefs/route.ts` — dev-only test API behind `devOnly()`. Lets dispatcher gating tests set arbitrary prefs without UI navigation.
- **Tests** — `tests/student-notification-preferences.spec.ts`. 5 desktop tests: section renders, save+reload persist, SMS-off → email only, email-off → SMS only, both-off → no student notifications. **First automated coverage of the channel-suppression dispatcher path** — possible because Eric flipped `NOTIFICATIONS_ENABLED=false` for this session.
- **Full-suite triage** of 4 failures Eric ran into:
  - `enrollment-hold:115` cron expires holds — flake (3/3 pass isolated). Parallel-load.
  - `enrollment-notifications:17` 3.4 — flake (3/3 pass isolated). Mock buffer cross-spec contention.
  - `instructor-notes:26` update name — flake (3/3 pass isolated). `pw_student` profile contention.
  - `member-pricing:52` strikethrough — flake (passes when full file runs serial). Inter-test dependency on `is_member` flag set in prior test of the same describe; cross-spec parallel writes to `pw_student.is_member` race against it.
  - **All four are pre-existing test-isolation issues, not regressions from today.** Captured in next steps as a Phase 6 hardening task.
- Commit `ef82ac6`.

**In Progress:** Nothing.

**Blocked:**
- 3.5/3.6/3.7 SMS production smoke test failure — Eric reported: 3.4 SMS+email worked, 3.5/3.6/3.7 email worked but SMS did not. Punted to next session per Eric. Possible causes: Twilio toll-free unverified rate limit, content filter on body (URLs / STOP disclosure), template-specific encoding. Need to check Twilio logs with the actual rejected message SIDs.
- Twilio Toll-Free Verification still pending submission/approval.
- Parallel CC running session 101 (Phase 7 — Hetzner remote dev). Independent.

**Next Steps:**
1. **Investigate 3.5/3.6/3.7 SMS smoke-test failure (Eric's first thing).** Pull Twilio logs for the failed message SIDs from this evening's smoke-test run to see actual rejection reason. Hypotheses to check first: (a) toll-free unverified content filter on URL or "STOP" string, (b) GSM-7 vs UCS-2 segment encoding, (c) per-recipient throttle. 3.4 worked, so account/number basics are fine — it's content-shape specific.
2. **Cross-file Playwright test isolation hardening (Phase 6 task, ~5–8 pts).** Tests collide on shared seed users (`pw_student` mostly) and the module-level mock buffer. Recommended fixes: (a) mock-buffer specs should scope assertions by `runId()` substrings so cross-spec dirtying doesn't cause false positives; (b) `is_member`-mutating tests should use a dedicated alt user (e.g. `pw_student2`); (c) `member-pricing.spec.ts` afterAll should verify reset; (d) consider a per-test transactional fixture if the pattern keeps biting. **Race tests will keep coming up as more concurrent-write features ship — worth investing.**
3. Code review cleanup: `updateProfile` + `updateUserProfile` in `src/actions/profiles.ts` still use `{ error }` shape — DEC-015 cleanup task, ~1 pt. Slot before any admin-form change.
4. Code review cleanup: `useTransientSuccess(pending, state)` hook to dedupe the pending-transition pattern now duplicated across 3 forms (admin notif, student profile, student notif). ~1 pt.
5. **3.10 — Password strength + email verification (3 pts).** Now unblocked since Resend is live (Eric did Phase 3.2 in session 95+) and `NOTIFICATIONS_ENABLED` is back to false-for-tests. Custom email template via Resend, Supabase Auth password requirements config.
6. `supabase db push` to remote — confirm `20260426232739_admin_notification_preferences.sql` is on remote (Eric pushed at start of session 100; this session's 3.9 reuses the existing column so no new migration needed).

**Context:**
- **Latent dual-role JSONB-clobber bug fixed in session 102.** Admin AND student actions both wrote `notification_preferences` by replacing the whole object. Profiles can be `is_admin && is_student` (1.13 dual-role pattern). Saving one role's prefs would silently erase the other's. New shallow-merge pattern via `readExistingPrefs` keeps both intact. Read-modify-write race window exists in theory; acceptable for V1 single-user single-form.
- **Shallow merge depth is load-bearing.** Top-level keys (`admin_enrollment_alert`, `admin_low_enrollment`, `student_global`) are disjoint, so `{ ...existing, ...newBlock }` replaces only the changed block. If a future event nests deeper, the merge silently wipes — comment in the code calls this out.
- **Transient-success pattern.** `useState + useRef + useEffect` to flip a `hasSubmitted` flag on the `pending → idle` transition, then derive `showSuccess` from `hasSubmitted && state === null && !pending`. Survives Strict Mode double-renders (refs persist, effect fires on falling edge). Now duplicated across 3 forms; ripe for extraction into a `useTransientSuccess` hook (next-steps #4).
- **Dispatcher gating tests are flaky against `NOTIFICATIONS_ENABLED=true`.** They use `notify=true` against `/api/test/enroll` — would fire real Twilio/Resend. Tests should add `test.skip(process.env.NOTIFICATIONS_ENABLED === 'true', 'requires mock buffer')` at the top of each gating test (code review flagged; not addressed this session).
- **Cross-spec parallel race patterns are accumulating.** Mock buffer + shared seed user state are concurrent-write hotspots. Workers=4 surfaces the races. Symptom: tests pass in isolation, fail intermittently in full suite. As notifications/preferences/etc. add more shared mutation, this bites harder. Earmarked as a real Phase 6 task (~5–8 pts).
- **Filter SMS test entries by template-specific phrase, not just title.** Student SMS template uses "you're enrolled in {title}"; admin SMS uses "{name} enrolled in {title}". Both contain the title — filtering on `title + "you're enrolled"` disambiguates student vs admin entries in the mock buffer. Discovered while debugging the first-run dispatcher test failure.

**Code Review:** 6 cleanups, 0 bugs. The dual-role JSONB merge fix is the real win.
1. **cleanup** `notification-preferences.ts:17` — `readExistingPrefs` uses `any` for the supabase client param. Adds to existing `project_types_debt` MEMORY. Type as `Awaited<ReturnType<typeof createClient>>` or extract a shared alias.
2. **cleanup** Shallow-merge depth is intentional; comment in code recommends documenting that top-level key disjointness is the load-bearing assumption.
3. **cleanup** `updateProfile` + `updateUserProfile` still on old shape; file a DEC-015 cleanup ticket. (Captured in next steps #3.)
4. **consistency** Read-modify-write race window noted; acceptable for V1, document the assumption in the code.
5. **cleanup** Extract `useTransientSuccess(pending, state)` hook now that 3 forms duplicate the pattern. (Captured in next steps #4.)
6. **consistency** Add `test.skip(process.env.NOTIFICATIONS_ENABLED === 'true')` guard to dispatcher gating tests so a stray env flip doesn't fire real Twilio/Resend.

RLS unchanged — existing self-update policy on `profiles` covers the new column writes. Test API route correctly gated behind `devOnly()`.

## Session 101 — 2026-04-26 20:03 → 2026-04-27 00:30 (~4.5 hrs, exact time TBD)
**Duration:** ~4.5 hrs | **Points:** 18 (7.1: 3, 7.2: 3, 7.3: 3, 7.4: 5, 7.5: 2, 7.6: 2)
**Task:** Phase 7 — Remote Dev Environment. Move dev off the laptop onto a Hetzner Cloud box accessed over Tailscale, edited via VS Code Remote-SSH.

**Completed:**
- **7.1 — Hetzner provisioning.** `hcloud` CLI installed to `~/.local/bin`, ed25519 key `~/.ssh/sailbook_hetzner` generated, project `sailbook` + R/W token configured (token in `~/.config/hcloud/cli.toml`, mode 600, gitignored). SSH key registered as `sailbook-laptop`. Cloud Firewall `sailbook-dev-fw` created with SSH-from-anywhere + ICMP. Server provisioned at `5.161.209.160` after CPX41 turned out to be retired across all locations — landed on **ccx23** (4 dCPU / 16 GB / 160 GB SSD / Ashburn / Ubuntu 24.04, $40/mo). Took 3 placement attempts; Hetzner's "Available: yes" lies during capacity crunches.
- **7.2 — Server hardening + Tailscale.** `scripts/hetzner-bootstrap.sh` (idempotent, two-pass): apt upgrade, sudo user `eric` (passwordless, key-only), 4 GB swap (swappiness=10), ufw default-deny + OpenSSH, fail2ban sshd jail, unattended-upgrades, Tailscale install. Pass 2 (`TAILSCALE_UP=1`) hardens sshd via `/etc/ssh/sshd_config.d/99-sailbook-hardening.conf` (root login + password auth disabled). Hetzner Cloud Firewall stripped to ICMP only — **public port 22 closed**, only the tailnet routes in. Box reachable as `100.118.147.49` / `sailbook-dev` on tailnet.
- **7.3 — Dev tooling.** `scripts/hetzner-dev-tooling.sh` (idempotent): fnm + Node 22.22.2, Docker CE 29.4.1 + Compose 5.1.3 (eric in `docker` group, no sudo needed), Supabase CLI 2.90.0 (matches laptop), gh 2.91.0, Playwright system deps + all 5 browsers (chromium, chromium-headless-shell, firefox, webkit, ffmpeg). Critical fix: symlinks `node`/`npm`/`npx`/`corepack`/`supabase` into `/usr/local/bin` so non-interactive SSH (`ssh host 'cmd'`) finds them — Ubuntu's `.bashrc` early-returns for non-interactive shells, and SSH cmd-exec doesn't source `.profile` either.
- **7.4 — Repo bring-up.** `gh auth login` interactively, repo cloned, `.env.local` scp'd over the tailnet, `supabase start` (15 containers, ~3 min cold), `npm install`, `npx playwright install`. **9/9 tests passed** on `tests/codes.spec.ts`, full pgTAP suite green. Dev URL forwarded to Windows browser through VS Code Remote-SSH later in 7.5.
- **7.5 — VS Code Remote-SSH.** SSH config block added to WSL `~/.ssh/config`. Walked Eric through Windows-side setup: Tailscale for Windows install + tailnet join, Remote-SSH extension, `sailbook_hetzner` key copied to `C:\Users\eric\.ssh\` with `icacls` permissions tightened, host block in `C:\Users\eric\.ssh\config`. Notepad's "save as .txt" gotcha bit; `Move-Item config.txt config -Force` fixed it. End-to-end loop closed: VS Code on Windows edits files on Hetzner over Tailscale, port 3000 auto-forwarded, browser hits Next dev served from Ashburn.
- **7.6 — Document.** `docs/HETZNER_DEV.md` (architecture / daily workflow / pause-stop / first-time-from-new-device / rebuild-from-scratch / troubleshooting). `scripts/hetzner-provision.sh` wraps the initial hcloud calls with retry on placement failure. `scripts/firewall-locked.json` is the post-bootstrap firewall rule set. README pointer added.

**In Progress:** None.

**Blocked:** None.

**Next Steps:**
1. Resume Phase 3.10 (password strength + email verification) on the new remote box. Now unblocked since Resend is live.
2. Carry forward from session 102: investigate 3.5/3.6/3.7 SMS smoke-test failure (Twilio logs).
3. Carry forward from session 102: cross-file Playwright test isolation hardening (~5–8 pts, Phase 6 task).
4. **Snapshot + delete the server** when stepping away for weeks (`hcloud server create-image --type snapshot ...` then `hcloud server delete`). Hetzner bills hourly whether on or off — `poweroff` does NOT save money, my earlier suggestion was wrong. Snapshot-and-delete drops the cost from $40/mo running to ~$2/mo (snapshot only); restore is ~5 min.
5. Update PROJECT_PLAN.md Velocity Tracking table with Phase 7 actuals next time the plan gets a refresh (Phase 7 not on the critical V1 path so the table didn't get a row, but actuals are: 18 pts / ~4.5 hrs / 0.25 hrs/pt).

**Context:**
- **CPX41 is retired everywhere.** Hetzner's listing showed pricing on `cpx41` but `Available: no` in every region. The new generation (`cpx42`) is EU-only. For US, the working 16 GB option is `ccx23` (dedicated vCPU, $40/mo, 160 GB). We had to retry 3x to get capacity even after switching off CPX41.
- **Local Supabase publishable keys are deterministic.** `supabase status -o env` shows the same `sb_publishable_*` and `eyJ...` ANON/SERVICE_ROLE keys on the laptop and the new Hetzner box — `.env.local` Just Works once copied. Earlier confusion came from a sloppy diff that compared two ANON-prefixed lines from the laptop's file.
- **Non-interactive SSH doesn't source shell init files.** `ssh host 'cmd'` runs with `/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin` — neither `.bashrc` (interactive guard returns early) nor `.profile` (login-only) is read. The fix is symlinks into `/usr/local/bin`. Same trap will bite VS Code Remote-SSH bootstrap (it runs commands non-interactively to install its server bits).
- **Tailscale SSH is the auth backstop.** With `tailscale up --ssh`, the box accepts SSH from any tailnet member without keys. When Eric's Windows SSH config was busted (empty `config`, content in `config.txt`), `ssh sailbook-dev hostname` still worked from PowerShell — Tailscale identity was doing the auth. Worth knowing: if you ever brick the SSH key/config story, you can still get in via Tailscale.
- **Hetzner placement reliability is mediocre.** "Available: yes" in `hcloud server-type describe` ≠ guaranteed placement. Both `ccx23` in `ash` and `hil` failed back-to-back during the same minute. `scripts/hetzner-provision.sh` now retries 3x with 30s sleep. For initial provisioning, advise picking a non-peak window.
- **Ubuntu 24.04 base image is missing `unzip`.** fnm's installer needs it. `scripts/hetzner-dev-tooling.sh` step 0 now apt-installs unzip + git + build-essential + pkg-config.
- **Notepad on Windows saves with `.txt` by default** even when you typed `config` as the filename (it appends an extension based on the file type). `Get-ChildItem $HOME\.ssh\` reveals it; `Move-Item` fixes it. Worth a one-liner in HETZNER_DEV.md troubleshooting.
- **Cost reality.** Server is hourly-billed ($0.064/hr ≈ $46/mo at full uptime; "$40/mo" is the listed monthly cap). Leaving it running 24/7 = $40/mo. Powering off when away = ~$20/mo. Deleting the server entirely while keeping the SSH key + firewall = $0 until next provision.
- **Plan renumbering.** Old "Phase 7: Skills & Tracking" pushed to Phase 8 to make room. Summary table updated.

**Code Review:** Skipped — infra/docs only, no app code touched. Two scripts (`hetzner-bootstrap.sh`, `hetzner-dev-tooling.sh`, `hetzner-provision.sh`) are idempotent and were exercised end-to-end during the session.

## Session 100 — 2026-04-26 19:09–20:13 (1.08 hrs)
**Duration:** 1.08 hrs | **Points:** 3 (3.8: 3)
**Task:** Phase 3.8 — Admin notification preferences (settings/UI shift away from triggers)

**Completed:**
- **Phase 3.8 — Admin notification preferences (3 pts).**
  - Migration `20260426232739_admin_notification_preferences.sql` — `notification_preferences jsonb` column on profiles, default NULL, comment documents the shape.
  - `src/lib/notifications/preferences.ts` — `ADMIN_NOTIFICATION_EVENTS` const (`admin_enrollment_alert`, `admin_low_enrollment`), `isAdminChannelEnabled()` (defensive: any non-bool / non-object / null / undefined → enabled), `normalizeAdminPreferences()` for form initial state.
  - `src/lib/notifications/triggers.ts` — admin fan-outs in `notifyEnrollmentConfirmed` and `notifyLowEnrollmentCourses` now read each admin's `notification_preferences` and gate per-channel sends. Profile selects extended to include the column.
  - `src/actions/notification-preferences.ts` — `updateAdminNotificationPreferences` server action, admin-only check + own-row write only. DEC-015 form-action shape (`Promise<string | null>`).
  - `src/app/(admin)/admin/notification-preferences/page.tsx` + `src/components/admin/notification-preferences-form.tsx` — server page + client form, four checkboxes (2 events × 2 channels).
  - Sidebar nav links added in `admin-nav.tsx` + `admin-mobile-nav-drawer.tsx`.
  - DEC-026 in `docs/DECISIONS.md` — JSONB on profiles over a separate table; resolved the TBD row.
  - `tests/admin-notification-preferences.spec.ts` — 4 desktop tests (page loads with defaults, save + reload persistence, non-admin redirect, sidebar link). All green.
- Commit `45714b9`.

**In Progress:** Nothing.

**Blocked:**
- `NOTIFICATIONS_ENABLED=true` for ongoing smoke testing → dispatcher-firing Playwright tests are paused for "a few sessions" per Eric. Will surface as test debt in the meantime.
- Twilio Toll-Free Verification still pending submission/approval.
- Parallel CC running session 101 (Phase 7 — Hetzner remote dev environment). Independent from 3.8 scope; worked around at commit time by staging files explicitly instead of `git add -A`.

**Next Steps:**
1. **3.9 — Student notification preferences (2 pts).** Reuses the same `notification_preferences` column on profiles. Spec calls for "opt out of SMS, email-only option" — simpler shape than admin (single global toggle vs per-event matrix). 3.9 is the natural next bite; DEC-026's "preferences will reuse the same column" claim gets exercised here.
2. Eric to finish smoke testing 3.4–3.8 with `NOTIFICATIONS_ENABLED=true` and a single test number. Confirm preferences toggles actually suppress channels in real Twilio/Resend output.
3. Code review test-debt follow-up: when notification env settles, add (a) unit tests for `isAdminChannelEnabled` covering the realistic JSON shapes, and (b) a triggers-level test asserting `mockBuffer` respects per-recipient prefs.
4. Form-action return-shape inconsistency: `updateAdminNotificationPreferences` returns `Promise<string | null>` (DEC-015 form-action shape), while existing `updateStudentProfile` returns `Promise<{ error: string | null }>`. Pick a winner before 3.9 reuses this column and forks the pattern further. Recommendation: standardize on `string | null` for form actions (matches DEC-015 explicitly).
5. `supabase db push` to remote (still overdue, but Eric did push earlier today — confirm whether the migration landed on remote).

**Context:**
- **Pattern shift in Phase 3.** Sessions 92–99 were notification-trigger work — every task was "new template + new trigger function + wire into action + test route". 3.8 is the first task that operates on the dispatcher itself rather than adding to it. 3.9 will follow the same pattern: read prefs in the recipient fan-out, gate channels.
- **JSONB-on-profiles design (DEC-026).** Null/missing keys mean enabled. This preserves historical behavior for any profile predating the column. The defensive helper (`isAdminChannelEnabled`) is the load-bearing piece — accidentally muting an admin is worse than accidentally sending, so any malformed value defaults to enabled. The OPPOSITE direction would be a bug.
- **Parallel CC commit hygiene.** When two CC sessions are running in the same working tree, `/kill-this`'s default `git add -A` would cross-contaminate. Stage explicit file paths to keep commits scoped to the current session's task. Both sessions can write to `session-log.md` (each prepends its open marker — order is whatever wins the race).
- **Types regen gotcha.** `npx supabase gen types typescript --local > types.ts` includes npm warnings from stderr if the supabase CLI isn't already installed. Add `2>/dev/null` to the redirect, or the file gets corrupted with `npm warn exec ...` lines that break tsc.
- **Dispatcher gating is the load-bearing logic.** UI tests pass; dispatcher behavior is currently only manual-smoke confirmed. Acceptable risk for V1, flagged as test debt in next steps.

**Code Review:** 4 cleanups, 0 bugs. RLS check confirmed the existing self-update policy covers the new column (DEC-026 claim holds).
1. **consistency** Form-action return-shape inconsistency between `updateAdminNotificationPreferences` (`string | null`) and `updateStudentProfile` (`{ error: string | null }`). Standardize before 3.9 forks further.
2. **cleanup** Add a one-line comment in `preferences.ts:38` that "default to enabled on any non-bool" is intentional (corrupted JSON wins by sending, not by muting).
3. **cleanup** Action validates FormData correctly — only iterates known events, drops extras. No change needed.
4. **cleanup** Test debt — dispatcher gating not automated. Add unit tests for `isAdminChannelEnabled` + triggers-level test once `NOTIFICATIONS_ENABLED` settles.

## Session 99 — 2026-04-26 07:42–08:32 (0.83 hrs)
**Duration:** 0.83 hrs | **Points:** 5 (3.7: 5)
**Task:** Phase 3.7 — Session reminders + 3 carryover cleanups from session 98 code review

**Completed:**
- **Phase 3.7 — Session reminders (5 pts).**
  - `src/lib/notifications/templates.ts` — `sessionReminder()` template + `SessionReminderData` type. Single template parameterized by `leadTimeLabel` ("tomorrow" or "in 1 week").
  - `src/lib/notifications/triggers.ts` — `notifyUpcomingSessionReminders(referenceDate?: Date)`. Lead-time table at top of file (`SESSION_REMINDER_LEAD_TIMES = [{daysOut: 7, label: "in 1 week"}, {daysOut: 1, label: "tomorrow"}]`). UTC-safe date math via `isoDateOffset()`. Idempotency from exact-date filter — each session fires reminders exactly once per slot. Optional `referenceDate` lets tests simulate "today".
  - `src/app/api/cron/session-reminders/route.ts` — daily cron route, mirrors `expire-holds` and `low-enrollment`. CRON_SECRET auth, returns `{ fired: N }`.
  - `vercel.json` — third cron entry, daily at 14:00 UTC.
  - `src/app/api/test/run-session-reminders/route.ts` — dev-only test route.
  - `tests/session-reminders.spec.ts` — 5 desktop tests (7-day fires, 24-hour fires, off-target dates skip, cancelled sessions skip, cron route smoke). All green.
- **Carryover cleanups from session 98 code review.**
  - `sessionCancellation` SMS body: `on {date} at {time} at {location}` → `on {when} ({where})` to avoid the awkward double "at" (also matches new `sessionReminder` formatting).
  - `notifyMakeupAssigned`: `courseResult` + `enrollments` lookups parallelized via `Promise.all` (matches `notifyEnrollmentConfirmed` pattern).
  - New `src/lib/dev-only.ts` helper exporting `devOnly()`. Refactored all 8 `/api/test/*` routes to use it. Now blocks on `NODE_ENV !== 'development' || VERCEL_ENV` — defense in depth against a misconfigured Vercel deploy exposing service-role writes.
- **Vercel plugin queued for next-session cleanup** (Eric will disable it via `/plugins`). Currently injecting ~5k tokens of skill descriptions on session start; trims fast-burn context budget.
- **Manual cron test commands documented** for all 3 crons (expire-holds, low-enrollment, session-reminders).
- Commit `00c0d56`.

**In Progress:** Nothing.

**Blocked:**
- `supabase db push` to remote — still uncertain if today's seed/migration changes are reflected.
- Smoke testing 3.7 cron live (Eric is doing this immediately after session close).

**Test failures from full suite:** Eric ran the full suite and confirmed everything passed.

**Next Steps (in order):**
1. **Manual smoke tests (Eric will do these post-close):**
   - 3.4 enrollment notification — already verified live, re-confirm
   - 3.5 cancellation notice — admin cancels a session with enrolled students → expect SMS+email per student
   - 3.6 makeup assignment — admin creates a makeup → SMS+email per affected student
   - 3.7 session reminder — `curl -X POST /api/test/run-session-reminders -d '{"referenceDate":"2026-05-02"}'` against a real seed enrollment to fire a 1-week reminder
2. **Vercel plugin disable** (next session start). Eric to run `/plugins` and disable. Should reduce session-start context by ~5k tokens.
3. **Phase 3 mode shift** — next phase 3 task is **3.8 Admin notification preferences (3 pts).** No more triggers/templates from here on; this is settings/UI work. DEC needed: settings table vs JSON column on profiles.
4. **Optional cleanups (advisory, not blocking):**
   - `sessionReminder` SMS body is ~217 chars = 2 Twilio segments. Trimming "Schedule: sailbook.live/student/courses." would land it back at 1 segment. ~50% per-reminder cost reduction. Tradeoff: less helpful body. Reminders are highest-volume of all triggers (per-student × per-session × 2 lead times) so the math favors trim.
   - Stale doc comment in `enroll/route.ts:3` still says "Gated behind NODE_ENV !== 'development'" — now uses `devOnly()`. One-line fix.
   - `isoDateOffset` could use a one-line comment that `Date.UTC` overflow normalization is the load-bearing detail.
5. `supabase db push` to remote.

**Context:**
- **Notification trigger pattern is now well-established across 4 implementations** (3.4, 3.5, 3.6, 3.7). Each: dedicated template (pure function, STOP disclosure on student-facing only), dedicated trigger (`notifyXyz()` with admin-client + per-channel try/catch + per-recipient fan-out), wired into the action that just performed the side effect, plus a dev-only `/api/test/*` route mirroring the action for testability. Phase 3.8 onwards departs from this pattern.
- **Cron pattern is now established across 3 implementations** (expire-holds, low-enrollment, session-reminders). Each: GET route with `CRON_SECRET` Bearer auth, returns `{ count: N }`, vercel.json entry. Add new ones by copying any of the three.
- **Mock buffer is shared module-level state across all notification tests.** Cross-file Playwright parallelism races it — must run with `--workers=1` for reliable group runs. Within-file is fine via `mode: 'serial'`.
- **`devOnly()` blocks if `VERCEL_ENV` is set** (any Vercel env: dev/preview/production) AND if `NODE_ENV !== 'development'`. Both conditions matter — a misconfigured `NODE_ENV=development` deploy still gets blocked by the `VERCEL_ENV` check.
- **Test data persists across serial Playwright tests in the same file.** Reminder tests had to scope assertions by course title because earlier tests' courses lived through to later tests. Worth the same hardening in future tests that read shared state.
- **SMS encoding still GSM-7 across the board** post-em-dash cleanup. New `sessionReminder` lands at 2 segments; everything else 1 segment. Trim flagged in optional cleanups.

**Code Review:** 4 cleanups, 1 doc-comment fix, 1 SMS-cost flag. No bugs.
1. **cleanup** `templates.ts:314` — `sessionReminder` SMS body ~217 chars = 2 Twilio segments. Trim "Schedule: sailbook.live/student/courses." for ~50% per-reminder cost reduction. Tradeoff: less helpful body. Worth doing because reminders are highest-volume trigger type.
2. **cleanup** `triggers.ts:459` — Add a one-line comment that `Date.UTC` overflow normalization is the load-bearing detail in `isoDateOffset`.
3. **cleanup** `triggers.ts:546` — `as unknown as { ... }` cast on `enrollments!inner` join. Third copy of the same types-debt pattern (MEMORY: `project_types_debt`). Cleanup gets slightly bigger when `supabase gen types` runs pre-V2.
4. **cleanup** `enroll/route.ts:3` — stale doc comment still says "Gated behind NODE_ENV !== 'development'" — now uses `devOnly()`.
5. **consistency** `dev-only.ts` — design is right. Pure function, no module-level side effects, returns `NextResponse | null` for early-return idiom.

## Session 98 — 2026-04-25 21:49 → 2026-04-26 07:28 wall clock (1.50 hrs active — overnight gap)
**Duration:** 1.50 hrs | **Points:** 6 (3.5: 3, 3.6: 3)
**Task:** Phase 3.5 + 3.6 — session cancellation + makeup notifications + pending-payment UX cleanup

**Completed:**
- **Phase 3.5 — Session cancellation notice (3 pts).**
  - `src/lib/notifications/templates.ts` — `sessionCancellation()` template + `SessionCancellationData` type. SMS body, email subject/text/html, optional cancel reason, "Reply STOP to opt out."
  - `src/lib/notifications/triggers.ts` — `notifySessionCancelled(sessionId)`. Identifies affected students by reading `session_attendance` rows that just flipped `expected → missed`. No admin alert (admin did the cancelling).
  - `src/actions/sessions.ts` — `cancelSession` calls trigger after the attendance flip, before `revalidatePath`.
  - `src/app/api/test/cancel-session/route.ts` — new dev-only test route mirroring side effects.
  - `tests/session-cancellation-notice.spec.ts` — 3 desktop tests (with-reason, without-reason, notify-off). All green.
- **Phase 3.6 — Makeup assignment notice (3 pts).**
  - `src/lib/notifications/templates.ts` — `makeupAssignment()` template. Mentions both the original missed session date AND the new makeup date/time/location.
  - `src/lib/notifications/triggers.ts` — `notifyMakeupAssigned(makeupSessionId)`. Identifies affected students by reading `session_attendance.makeup_session_id` links via FK embed (`sessions!session_attendance_session_id_fkey ( date )` confirmed by code review).
  - `src/actions/sessions.ts` — `createMakeupSession` calls trigger after the link update, only when missed records were linked.
  - `src/app/api/test/create-makeup-session/route.ts` — new dev-only test route.
  - `tests/makeup-assignment-notice.spec.ts` — 3 desktop tests. All green.
- **Pending-payment UX cleanups (uncovered during 3.4 smoke test).**
  - `enrollmentStatusLabel` returns `"Payment Pending"` instead of raw `"pending_payment"` on the browse-list badge.
  - Badge variant for `pending_payment` is now `warn` (yellow) — signals action needed.
  - New `isEffectivelyEnrolled(status, holdExpiresAt)` helper in `courses-card-list.tsx`: pending_payment with expired hold = treated as not-enrolled. Removes the inconsistency where the browse list said "Payment Pending" but detail page said "Register & Pay".
  - `my-courses` page query pulls `hold_expires_at` and filters expired-hold pending_payment rows out before render.
  - Browse page passes `hold_expires_at` through to `CourseCardData`.
- **3.4 smoke-tested live** — Stripe webhook (CLI listening) → `notifyEnrollmentConfirmed` → real Twilio SMS + real Resend email both delivered to Eric's phone. Phase 3.4 is done-done, not just mock-done.
- Commit `7a490db`.

**In Progress:** Nothing.

**Blocked:**
- `supabase db push` to remote — stale state on remote vs. local. Eric pushed earlier today but unclear if today's seed/migration changes are reflected.
- Locally: `/api/cron/expire-holds` doesn't auto-run, so pending_payment records sit until manually triggered. The cron-expired-hold UX cleanups in this commit decouple display from cron, but the underlying records still need a manual sweep in dev.

**Test failures from full suite:** Eric punted the full suite to start of next session.

**Next Steps (in order, pinned by Eric):**
1. **Run full Playwright suite** at the start of next session (carryover, was punted tonight).
2. **Manual smoke tests** for 3.4, 3.5, 3.6 — Eric explicitly asked for a reminder. Real-provider verification of each notification path:
   - 3.4: pay & register flow → enrollment confirmation SMS+email arrives (already verified once; re-verify in batch).
   - 3.5: admin cancels a session with enrolled students → cancellation SMS+email per student.
   - 3.6: admin creates a makeup for that cancelled session → makeup SMS+email per affected student.
3. **3.7 — Session reminders (5 pts).** Cron-scheduled SMS+email 1 week and 24 hours before session start. Same pattern as the low-enrollment cron route + new template + new trigger.
4. Optional code-review cleanups before phase close (none blocking):
   - SMS copy: `sessionCancellation` body has "...session on {date} at {time} at {location}..." — double "at" reads awkwardly. Switch to `on {when} ({where})` or split sentences.
   - `notifyMakeupAssigned`: parallelize the courseResult + enrollments lookup in `Promise.all` (matches pattern in `notifyEnrollmentConfirmed`).
   - Defense-in-depth on dev test routes: also gate by `VERCEL_ENV` or require `x-test-token` header in case `NODE_ENV` is misconfigured.

**Context:**
- **The cron not running locally** is now annotated in the data-display layer instead of the data layer. UX gracefully handles stale pending_payment via the `isEffectivelyEnrolled` helper. The actual record cleanup still happens via the cron in prod — locally the records sit but display correctly.
- **Manual smoke-test path established.** Stripe CLI listening (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`) bridges Stripe → localhost webhook. Without the CLI, paying through the hosted page leaves enrollments stuck in pending_payment because the `checkout.session.completed` webhook never reaches the dev server. Re-run `stripe listen` and update `STRIPE_WEBHOOK_SECRET` in `.env.local` if the CLI session restarts.
- **Trigger tests must reset DB before running.** Manual smoke tests leave pending_payment + Stripe customer state behind. Affected counts in tests like `student-enrollment.spec.ts:31` (spots-remaining) drift if the DB has leftover real-paid enrollments. Run `supabase db reset` before the full suite.
- **Notification trigger pattern is now well-established across 3 implementations** (3.4, 3.5, 3.6). Each: dedicated template (pure function), dedicated trigger (`notifyXyz(id)` with admin-client + per-channel try/catch + per-recipient fan-out), wired into the action that just performed the side effect, plus a dev-only `/api/test/*` route mirroring the action for testability. 3.7 should follow the same shape.
- **SMS encoding:** new templates land at 2 GSM-7 segments (cancellation 259 chars, makeup 218 chars). Em-dash → hyphen cleanup from earlier today held — no UCS-2 regression.

**Code Review:** 1 copy nit, 2 cleanup notes, 1 security suggestion. No bugs.
1. **consistency** `templates.ts` — `sessionCancellation` SMS body reads "session on {date} at {time} at {location}". The double "at" is awkward. Fix to `on {when} ({where})` or split sentences.
2. **cleanup** `triggers.ts:212-236, 311-333` — `as unknown as { ... }` casts on embedded relations. Same Supabase types-debt pattern from MEMORY (`project_types_debt`). Track for V2 cleanup.
3. **cleanup** `triggers.ts:281, 287` — `notifyMakeupAssigned`'s `courseResult` + `enrollments` lookups are independent. Wrap in `Promise.all` for a small latency win (matches `notifyEnrollmentConfirmed` pattern).
4. **security** Dev test routes (`/api/test/cancel-session`, `/api/test/create-makeup-session`) only gate on `NODE_ENV !== 'development'`. Belt-and-suspenders: also require a header secret or refuse if `VERCEL_ENV` is set.

## Session 97 — 2026-04-25 20:45–21:38 (0.92 hrs, triage session)
**Duration:** 0.92 hrs | **Points:** 0 (triage pins — pre-3.5 prep, not plan-table tasks)
**Task:** Phase 3 triage pins (STOP language, register consent, pgTAP fixes)

**Completed:**
- **STOP disclosure on `enrollmentConfirmation()` SMS template** (`src/lib/notifications/templates.ts`). Body now ends with `Reply STOP to opt out.`. Comment notes Twilio handles inbound STOP/HELP/UNSUBSCRIBE keywords automatically — no backend wiring needed. Admin templates intentionally skipped (operators, not consumer recipients).
- **SMS consent disclosure on `/register`** (`src/app/(auth)/register/register-form.tsx:61`). Small `text-xs text-muted-foreground` paragraph under the phone input: "Used for enrollment confirmations and session reminders. Standard message rates apply. Reply STOP to opt out." Aligns with what Twilio toll-free verification reviewer will look for.
- **pgTAP test drift from session 96 seed rewrite** — fixed across two files:
  - `supabase/tests/02_rls_courses.sql` — admin/instructor course count 6→10, student course count 5→9, seed-reference comment block rewritten to reflect five Open Sailing courses (c006-c010).
  - `supabase/tests/03_rls_enrollments.sql` — attendance count 17→13 in three places (admin, mike, chris views), seed-reference comment rewritten to note e006 has 1 attendance row (Open Sailing is single-session per-course).
  - **All 120 pgTAP tests green.**
- **Instructor-invite test retry config** (`tests/instructor-invite.spec.ts`). Added `retries: 2` to the describe block. Comment notes the chronic Playwright flake (target-page-closed during click under suite load, cold-compile races on fresh dev server) and points at session 92 manual QA confirming the feature works. Will escalate to `test.fixme()` if retries stop catching it.
- **Full Playwright suite run** (Eric, in user mode): 348 passed, 4 failed, 144 skipped, 8 did-not-run. The 4 failures are tracked below.
- Commit `94f1409`.

**In Progress:** Nothing.

**Blocked:**
- **Smoke tests on hold.** Resend domain re-verification still in flight, Twilio TFV pending Eric's form submission (which the triage pins now unblock).
- `supabase db push` to remote (overdue 7 sessions).

**Test failures from the full suite — pinned for next session:**
1. **`tests/notifications.spec.ts:24`** — SMS dispatch routes to mock and appears in buffer. **Cause:** Eric flipped `NOTIFICATIONS_ENABLED=true` in `.env.local` mid-day. Dev server inherits at startup. Test API route uses the dispatcher, which now routes to real Twilio instead of mock buffer. Buffer stays empty → fail. **Fix already applied:** Eric flipped `.env.local` back to `false`. Dev server needs a restart next session to pick it up. After restart, tests should pass.
2. **`tests/enrollment-notifications.spec.ts:17`** — confirmed enrollment fires student email and admin email per admin. **Same root cause as #1.** Same fix (restart dev server with `NOTIFICATIONS_ENABLED=false`).
3. **`tests/checkout.spec.ts:16`** — Register & Pay redirects to Stripe checkout. **Likely cause:** notify trigger on enrollment was hitting real Twilio/Resend on test-env credentials, slow-failing under load. Same fix likely resolves it. Verify after restart.
4. **`tests/instructor-invite.spec.ts:30`** — admin generates link. **Chronic flake.** This commit added `retries: 2`. If still fails after retries, escalate to `test.fixme()`.

**Next Steps (in order):**
1. **First thing next session:** restart dev server (it's running with stale `NOTIFICATIONS_ENABLED=true`) and re-run the full Playwright suite to confirm failures #1-#3 are gone. If #4 still fails after retries, escalate to `test.fixme()`.
2. **Then 3.5 — Session cancellation notice (3 pts).** Phase 3 keeps moving while Twilio TFV runs its multi-day external clock.
3. After 3.5, optionally address the 3 advisory cleanups from code review (em-dash → hyphen in seed titles, drop `text-muted-foreground` on register consent line, fix stale pgTAP comment at `02_rls_courses.sql:168`).
4. `supabase db push` to remote (overdue).

**Context:**
- **`.env.local` flip is dev-server-side, not test-runner-side.** Playwright reads `.env.local` for the test runner's process, but the actual notification dispatch happens in the dev server's process. Dev server inherits its env at `npm run dev` startup. Tests that depend on dispatcher-routes-to-mock require `NOTIFICATIONS_ENABLED=false` in the dev server's env, which means a restart after any flip.
- **Playwright `retries: 2` + `mode: 'serial'` is safe.** Code review confirmed: retries only re-run the failed test, not the whole serial chain. Dependent later tests still skip on failure (won't be retried). Good combo for the instructor-invite flake pattern.
- **The 26 ASA 101 + 5 Open Sailing course titles all use em-dash (—).** This forces UCS-2 SMS encoding (70/67 chars per segment) instead of GSM-7 (160/153). With the new `Reply STOP` line, typical SMS body is ~210 chars = 3 UCS-2 segments instead of 2 GSM-7. ~50% cost bump. Code review flagged as advisory cleanup — replace em-dash with ` - ` (hyphen-space-hyphen-space) in seed titles when convenient.
- **The pgTAP test at `02_rls_courses.sql:168` has a stale comment** (says "c001,c002,c003,c006 = 11 sessions" but should say "c006-c010"). Math is correct, comment is misleading. Trivial cleanup.

**Code Review:** 3 advisory cleanups, no bugs.
1. **consistency** `02_rls_courses.sql:168` — Comment lists `c001,c002,c003,c006` for the student-sees-11-active-sessions assertion but should list `c001,c002,c003,c006-c010`. Math correct; comment misleading.
2. **cleanup** `templates.ts:90` — Em-dash in `data.courseTitle` (from seed) forces UCS-2 encoding. Adding `Reply STOP to opt out.` pushes typical body to 3 segments instead of 2. ~50% cost bump on the highest-volume template. Fix at the seed level (em-dash → hyphen) when convenient.
3. **cleanup** `register-form.tsx:61` — `text-muted-foreground` may be borderline-low-contrast for a Twilio TFV reviewer in dark mode. Consider dropping the class so the line inherits body color (still `text-xs`, still visually subordinate to the input).

## Session 96 — 2026-04-25 18:48–20:26 (1.67 hrs, maintenance/cleanup session)
**Duration:** 1.67 hrs | **Points:** 0 (no plan-task slots — Twilio fix, test fix, seed rewrite, plan update)
**Task:** Twilio import fix + instructor-invite test fix + Open Sailing seed model + 5.11 plan add

**Completed:**
- **Twilio import shape fix.** `src/lib/notifications/twilio.ts` — switched from `twilioMod.default(sid, token)` (CJS/ESM-interop fragile) to `const { Twilio } = await import('twilio'); new Twilio(sid, token)`. Promoted to urgent because Eric flipped `NOTIFICATIONS_ENABLED=true` in `.env.local` mid-session — any real SMS attempt would have thrown without this fix. **Code review confirmed pattern is correct for `twilio` v6.**
- **Instructor-invite Playwright test fix (was the pre-existing failure).** `tests/instructor-invite.spec.ts` — `.once('dialog', d => d.accept())` → `.on('dialog', d => d.accept())` in two places. Theory: a stray earlier dialog event consumed the one-shot handler so the actual confirm() popup went unhandled and Playwright auto-dismissed the modal, making the click hang for 30s. All 3 tests in the file now green across viewports, twice in a row.
  - Briefly appeared still-broken after `supabase db reset` (cold-compile flake — Next.js takes ~15-30s to compile a route on first hit; test's 30s click was racing). Stable once routes warmed.
- **Open Sailing seed model rewrite.** `supabase/seed.sql`:
  - One course with 5 sessions (`c006`) → five courses with one session each (`c006`-`c010`, Jul 1/8/15/22/29). Each independently enrollable, matching drop-in / per-night model. Mike instructs all five. Chris (dual-role student) enrolled in c006 (Jul 1) for the demo.
  - $65 flat price for now (deposit/cash split is Phase 5.2).
  - **All seed users now share `+14403631199`** (a non-primary number Eric explicitly designated as disposable). Every dev-fired notification SMSes him — smoke test built into the seed.
  - `tests/student-enrollment.spec.ts:20` — selector updated to `'Open Sailing — Jul 1'` with `{ exact: true }` to avoid matching "Jul 15".
  - `src/app/dev/page.tsx:222` — walkthrough text updated.
- **PROJECT_PLAN.md — 5.11 added.** Bulk price update on `/admin/courses` (8 pts, cuttable). Phase 5 now 47 pts.
- Commit `6ec2a82`.

**In Progress:** Nothing.

**Blocked:**
- **Smoke tests on hold.** Eric registered the wrong domain with Resend earlier — re-verifying now (in progress). Twilio toll-free verification also still pending the business-verification form. Both gate any real-provider end-to-end test.
- `supabase db push` to remote (overdue 6 sessions).

**Next Steps (in order):**
1. **First thing next session — three small fixes pinned by Eric/code review:**
   - Add `Reply STOP to opt out.` to student SMS template body in `templates.ts` (`enrollmentConfirmation()` only — don't touch admin templates). No backend change — Twilio handles STOP automatically.
   - Add SMS consent disclosure on `/register` near phone field: *"Phone number is used for enrollment confirmations and session reminders. Standard message rates apply. Reply STOP to opt out."*
   - **Fix pgTAP test breakage from the Open Sailing seed rewrite** (3 files, real assertion mismatches — see Code Review #1-3 below). Without this, next `supabase test db` run will fail.
   - **Why first:** items 1+2 are required content for the Twilio Toll-Free Verification submission. Eric needs them landed before he can submit the TFV form, which then runs on a multi-day external clock.
2. **Then 3.5 — Session cancellation notice (SMS + email, 3 pts).** Phase 3 builds in parallel with the Twilio TFV approval window. 4.2 punted — pick it back up after Phase 3 has a few more tasks closed.
3. Run full Playwright suite + `supabase test db` (punted from session 96).
4. Smoke test punted explicitly — re-evaluate the day Resend domain + Twilio TFV both verify. Don't chase external verification clocks mid-session.
5. `supabase db push` to remote (overdue).

**Context:**
- **`.once('dialog', ...)` is a Playwright trap.** Use `.on(...)` for click flows that may emit multiple dialogs over a test's life (or hoist `.once` above the very first interaction that could trigger any modal). This was the one-line fix for an issue that's been failing across multiple sessions.
- **All seed users share Eric's disposable mobile.** Intentional for SMS smoke testing during dev. Means any `NODE_ENV=test`-style run with `NOTIFICATIONS_ENABLED=true` against this seed will send live SMS. No env guard exists today; don't run Playwright with `NOTIFICATIONS_ENABLED=true` in `.env.local` until that guard exists or you'll fire real SMS to that number.
- **Dev server inherits its `.env.local` snapshot at startup.** Env flips need a server restart to take effect. Confirmed today: dispatcher routed to mock mode even after Eric flipped `NOTIFICATIONS_ENABLED=true` because the dev server was already running. Restart picked it up cleanly.
- **Twilio toll-free verification needs a public proof-of-consent URL.** Eric is filling that form. Recommended path: a public Google Doc explaining the opt-in flow, linked in the form. The actual `/register` consent line can land in parallel.
- **Maintenance sessions count as 0 plan points.** Velocity tracking for this session is intentionally unrecorded — none of the work mapped to a plan-table slot. The actual hours still happened.

**Code Review:** 3 real bugs (pgTAP test drift from seed rewrite — must fix before next `supabase test db`), 1 advisory cleanup, 1 consistency note (dismissed by Eric — phone is disposable), 1 future-Phase-3 prerequisite.

1. **bug** `supabase/tests/03_rls_enrollments.sql` — Header comment claims `e006: d010-d014 → 5 rows`. After seed rewrite, e006 has 1 attendance row. Total attendance went from 17 to 13. Any `count(*)` against `session_attendance` will fail.
2. **bug** `supabase/tests/02_rls_courses.sql` — Counts assume 6 courses / 14 sessions. New seed has 10 courses, 14 sessions. Active-courses-for-student count was (c001/c002/c003/c006)=4; now (c001/c002/c003/c006-c010)=8 active + c004 enrolled = 9. Assertions at lines ~121, 138, 174 will break.
3. **bug** `supabase/tests/05_cascade.sql` — Mike previously taught c001/c004/c006 (3 courses). Now teaches c001/c004/c006-c010 (7 courses). Cascade assertions tied to instructor counts will fail.
4. **cleanup** `tests/instructor-invite.spec.ts:50` — `.on('dialog', ...)` is registered after `loginAs` + `goto`. Fine because nothing on those triggers a dialog. Reviewer suggests hoisting earlier for symmetry with line 126. Optional.
5. **consistency** ~~Real PII in seed.~~ Dismissed — Eric confirmed `+14403631199` is a disposable number, not his primary. Will revisit when/if a primary number lands in seed.
6. **security/future** Phase 3 prerequisite: `profiles` should have a `sms_opt_in_at` column (or equivalent) for Twilio toll-free A2P opt-in proof on file. Pin for 3.10 (auth hardening) or earlier — relevant to the consent disclosure work pinned for next session.

## Session 95 — 2026-04-25 15:28–18:25 (0.67 hr, mostly offline — Eric configured Twilio/Resend)
**Duration:** 0.67 hr | **Points:** 4 (3.1: 2, 3.2: 2)
**Task:** Phase 3.1 + 3.2 install close-out + Open Sailing / bulk-edit design discussion

**Completed:**
- **Phase 3.1 + 3.2 done.** Eric configured Twilio + Resend accounts offline (real account, real number, real domain), all keys/IDs in `.env.local`. Ran `npm install twilio resend`.
- Removed the placeholder `@ts-expect-error` directives from `src/lib/notifications/twilio.ts:13` and `src/lib/notifications/resend.ts:12` — they were load-bearing only while the npm packages were absent. Build was failing with "Unused @ts-expect-error directive" on first build of the session; the cleanup was queued explicitly in session 92's notes.
- Commit `963b5e9`.

**Design discussion (no implementation):**
- **Open Sailing model.** Decided: 1 course per Wednesday with 1 session each (no schema change). Existing data model already supports it. Seed data needs to change. Deposit/cash pricing model stays scoped as Phase 5.2 (5 pts).
- **Bulk price update.** New Phase 5 task (5.11, 8 pts, cuttable) — multi-select on `/admin/courses` + bulk-edit price. Single-field, narrow scope. Multi-field bulk edit is V3.
- Both items lined up but NOT yet built — seed data change and PROJECT_PLAN.md update happen next session.

**In Progress:** Nothing. Two items queued explicitly:
- Open Sailing seed data rewrite (5 courses replacing c006, attendance/enrollment shifts, test selector update).
- PROJECT_PLAN.md: add 5.11 bulk price update (8 pts cuttable), bump Phase 5 totals.

**Blocked:**
- `NOTIFICATIONS_ENABLED=true` flip — gated on Twilio Toll-Free Verification approval (multi-day form, see `docs/NOTIFICATION_SETUP.md`). Until then, dispatcher stays in mock mode.
- `supabase db push` to remote (overdue 5 sessions).
- Pre-existing instructor-invite Playwright failure (test-side, manual QA confirmed feature works).

**Next Steps:**
1. **Seed data change for Open Sailing** (small, ~30 min) — already planned out.
2. **Add 5.11 bulk price update to PROJECT_PLAN.md.**
3. **Then:** 4.2 `/admin/users` consolidation (8 pts, scope locked).
4. Investigate instructor-invite test regression.
5. Twilio `import` shape fix (see Code Review #1) — must land before `NOTIFICATIONS_ENABLED=true`.

**Context:**
- **Twilio v6 import shape is fragile.** Current code uses `twilioMod.default(sid, token)` after `await import('twilio')`. That works today via CJS/ESM interop but isn't robust. Code review recommended `const { Twilio } = await import('twilio'); new Twilio(sid, token)` (named import + constructor). Not blocking right now because `NOTIFICATIONS_ENABLED=false`, but must be fixed before any live SMS fires.
- **Twilio is pinned to `^6.0.0`** which has zero patch releases. Code review flagged risk — `^6` will silently float across early-major breakages. Worth pinning to the exact version once it stabilizes.
- **Resend import shape is correct** — `new resendMod.Resend(apiKey)` matches the package's named export.
- **Open Sailing pricing reality (per Eric):** $65 night, optional $10 refundable deposit to hold spot + $50 cash to captain night-of, OR pay $65 in full. The deposit/cash split is Phase 5.2; full-price-via-Stripe path works in today's model. Seed will use $65 flat for now.
- **Bulk-edit reality:** 26 ASA 101 + ~20 Open Sailing nights = a lot of hand-edits if prices change mid-season. Bulk price update covers the high-frequency pain; multi-field bulk edit is overkill for V2.

**Code Review:** 1 bug (queued, non-blocking), 1 cleanup.
1. **bug** `twilio.ts:14` — `twilioMod.default(sid, token)` leans on CJS/ESM interop. Switch to `const { Twilio } = await import('twilio'); new Twilio(sid, token)`. **Must fix before NOTIFICATIONS_ENABLED=true.**
2. **cleanup** `package.json` — `twilio ^6.0.0` floats across early-major patches. Pin to the exact version (`6.0.0` or whatever resolved) until v6 settles.

## Session 94 — 2026-04-25 09:06–15:14 (1.00 hr, in-and-out — boat day)
**Duration:** 1.00 hr | **Points:** 5 (5.10: 5)
**Task:** Phase 5.10 student calendar view + session 93 code review fixups + 4.2 re-scope

**Completed:**
- **Phase 5.10 — student courses calendar view (5 pts).**
  - `src/components/student/courses-card-list.tsx` — extracted card grid + `CourseCardData` type (server-render).
  - `src/components/student/courses-calendar.tsx` — month grid client component, prev/next/today nav, course pills colored by enrollment status (primary/accent/muted), `MAX_PILLS_PER_CELL = 3` with "+N more" overflow.
  - `src/components/student/courses-view-switcher.tsx` — Calendar/List toggle, `localStorage` persistence (`sailbook.courses-view`), forces list at <640px via `matchMedia`.
  - `src/app/(student)/student/courses/page.tsx` rewritten to build `CourseCardData[]` and hand both views to the switcher.
  - `tests/student-courses-calendar.spec.ts` — 5 desktop tests (1 mobile-only test for forced-list assertion). All green.
- **Session 93 code review fixups (3 fixes).**
  - `templates.ts` — `esc()` HTML helper; every `${…}` in the three `emailHtml` strings wrapped. Defense in depth across `studentFirstName`, `courseTitle`, `studentEmail`, `paymentMethod`, `where` (location), and computed values like `dollars()` and `dateStr`.
  - `actions/enrollments.ts` — `confirmEnrollment` now fires `notifyEnrollmentConfirmed`. Was the third confirmation path missed in 3.4.
  - `triggers.ts` — threshold switched from `Math.floor(capacity * ratio)` to `enrolled / capacity >= ratio` + `capacity > 0` guard. Fixes capacity=1 (alert never fired) and capacity=3 (1/3 silently "fine").
- **4.2 re-scope (planning, no implementation).** Re-estimated 2 → 8 pts in `PROJECT_PLAN.md`. Locked scope: unified `/admin/users` with role filter (Admin/Instructor/Student), two collapsed invite panels reusing 4.1 infra, **column sorting (not search)**, old `/admin/students` and `/admin/instructors` routes deleted (no redirects — nothing bookmarked). Phase 4 total: 36 → 42 pts.
- **Docs updates.**
  - `NOTIFICATION_SETUP.md` — SPF Google + Resend before/after merge example; Twilio rewritten as toll-free vs 216-local decision point with toll-free verification step + 10DLC tradeoff documented.
- **Test fallout from calendar default.** `student-enrollment` + `cancel-enrollment` specs now seed `localStorage.sailbook.courses-view = 'list'` via `addInitScript` before `/student/courses` navigation. Also fixed pre-existing test bug in `cancel-enrollment` where the filter used `'Cancel List'` instead of the unique `runId()` title — caused strict-mode violations after multiple runs.
- Commit `e53a48d`.

**In Progress:** Nothing.

**Blocked:**
- `.env.local`: `NOTIFICATIONS_ENABLED=false` + Twilio/Resend creds (carryover sessions 91/92/93)
- `supabase db push` to remote (carryover sessions 90/91/92/93)
- Pre-existing `instructor-invite` failure: "admin generates link, student accepts and becomes instructor" deterministically times out on the Generate link button click. Reproduces at workers=1 in isolation. Manual QA from session 92 confirmed feature works; test-side issue. Punted per user, tracked as code review debt for Phase 4 follow-up.

**Next Steps:**
1. **Pick:** 4.2 (`/admin/users` consolidation, 8 pts) is now ready to build — scope is locked.
2. Investigate `instructor-invite` test regression as a separate small task before 4.2.
3. Mobile calendar UX is parked for Phase 5/6 — Andy will see clunky cards on mobile until then; documented in plan.
4. Run full Playwright suite after fixing the instructor-invite flake, before Phase 3 close.
5. `supabase db push` to remote (overdue 4 sessions).

**Context:**
- **Mobile-first hydration trap.** `view-switcher` server-renders calendar unconditionally; mobile clients swap to list after hydration → guaranteed flicker on first mobile load. Code review flagged a `hidden sm:block` / `sm:hidden` CSS-driven approach as cleaner. Acceptable for V1; revisit when redesigning the mobile course browser.
- **localStorage init pattern for tests.** `await page.addInitScript(() => localStorage.setItem(...))` BEFORE `goto` is the right way to seed client preferences in fresh browser contexts. Place it before login if context is brand new (login flow already navigates).
- **Pill rendering.** Calendar pills use `<Link>` with the same `/student/courses/[id]` href as list view buttons. Click-through is identical; no new route needed.
- **Calendar default month** is the current month; courses with sessions in May 2026 onwards aren't visible until you click `›`. Tests that rely on text matching for specific seed courses MUST switch to list view (text in pills is in DOM but not in current-month cells unless the test navigates).
- **Twilio toll-free verification** is now documented as a multi-day form submission. Plan accordingly when 3.1 is started — needs lead time before go-live.

**Code Review:** 4 cleanups (advisory), no bugs.
1. **cleanup** `view-switcher.tsx:22` — SSR/CSR mismatch causes mobile flicker. Suggested `hidden sm:block` CSS approach. Acceptable for V1.
2. **cleanup** `view-switcher.tsx:36-39` — two adjacent `eslint-disable-next-line` comments. `useSyncExternalStore` would be cleaner. Not blocking.
3. **cleanup** `triggers.ts:225` — pre-existing UTC-vs-local Date parsing pattern. Off-by-one possible at midnight in negative-UTC zones. Use `Date.UTC(y, m-1, d)` like `templates.ts:42` does. Pre-existing, not introduced here.
4. **cleanup** `student-courses-calendar.spec.ts:20` — `waitForLoadState('networkidle')` is a known flake source. Replace with a visibility assertion.

## Session 93 — 2026-04-25 07:25–08:45 (1.33 hrs)
**Duration:** 1.33 hrs | **Points:** 8 (3.4: 8)
**Task:** Phase 3.4 — enrollment notifications + low-enrollment cron

**Completed:**
- Re-estimated 3.4: 5 → 8 pts (+ cron route, vercel.json entry, threshold logic, two trigger paths). Phase 3 now 45 pts.
- `src/lib/notifications/templates.ts` — three pure templates (`enrollmentConfirmation`, `adminEnrollmentAlert`, `lowEnrollmentWarning`). SMS body + email subject + email text + email HTML.
- `src/lib/notifications/triggers.ts` — `notifyEnrollmentConfirmed(enrollmentId)` and `notifyLowEnrollmentCourses()`. Per-recipient/per-channel try/catch, errors logged & swallowed (Twilio outage cannot 500 the Stripe webhook). Caller-side idempotency only.
- `src/app/api/cron/low-enrollment/route.ts` — same `CRON_SECRET` auth pattern as `expire-holds`. Returns `{ alerted: N }`.
- `vercel.json` — second cron entry, daily 13:00 UTC.
- `src/app/api/webhooks/stripe/route.ts` + `src/actions/enrollments.ts` (`adminEnrollStudent`) — call trigger after enrollment goes confirmed.
- `src/app/api/test/enroll/route.ts` — added optional `notify: true` flag for tests.
- `tests/enrollment-notifications.spec.ts` — 4 desktop tests (8 skipped by viewport design).

**Bundled side-quests in same commit `f798f43`:**
- Added Phase 5.10 — `/student/courses` calendar view (5 pts, tight scope) — pulled from V3 backlog. The 26-course season seed makes the list view unbrowsable.
- `supabase/seeds/2026_season_courses.sql` — additive idempotent prod seed (NOT auto-loaded by `db reset`). 26 ASA 101 weekend courses May–Oct, 52 sessions. Verified in dev.
- README "Database seeding" section.
- Relaxed `tests/helpers.ts` Course Type regex to `/ASA 101/` (the season-seed upsert renamed the seeded course_type, breaking the previous regex).
- Adjusted Session 92 duration to 0.75 hrs per Eric.

**In Progress:** Nothing.

**Blocked:**
- `.env.local`: `NOTIFICATIONS_ENABLED=false` + Twilio/Resend creds (carryover)
- `supabase db push` to remote (carryover from sessions 90/91/92)
- 4.2 admin invite link still parked, needs re-scope to `/admin/users` consolidation
- Full Playwright suite not run this session — Eric will run before next task

**Next Steps:**
1. **First thing next session:** apply the 3 code review bugs/cleanups (HTML escape in email templates, `confirmEnrollment` missing notify call, threshold ratio fix). Eric explicitly flagged these as "first thing next task."
2. Run full Playwright suite (`npx playwright test`)
3. Pick next feature: 5.10 calendar view (real student-facing UX pain) or 4.2 re-scope

**Context:**
- Pattern established for cron-driven notifications — daily 13:00 UTC slot; future cron triggers (3.7 session reminders) can copy the route + vercel.json shape directly.
- Trigger functions never throw — they swallow internal errors and log. The contract is "best effort, never blocks the caller's primary write." Stripe webhook would 500 → retry → double-confirm if a notification could throw.
- Mock buffer constraint from 3.3 still load-bearing: dispatcher MUST static-import `mock.ts` so the test API route and dispatcher share one module instance.
- Seed test users have `phone: null`, so SMS dispatch correctly skips. Tests assert email-only paths until phone numbers populate.
- Low-enrollment threshold (`14 days`, `< 50% capacity`) is a documented placeholder; real rule belongs to 5.8 (Andy decision). No cooldown column for V1 — cron sends daily while threshold met.
- `notifyEnrollmentConfirmed` is wired into Stripe webhook + `adminEnrollStudent` (manual admin enroll). It is NOT wired into `confirmEnrollment` (admin "Confirm registered" button) — code review flagged this as a gap, queued as first thing next session.
- Running the season seed locally renamed the seeded course type from "ASA 101 — Basic Keelboat Sailing" to "ASA 101 – Sailing Made Easy". `helpers.ts` regex relaxed; if you ever `supabase db reset`, the seed-name reverts and the test still passes.
- Twilio toll-free numbers: faster verification + skip 10DLC monthly brand/campaign fees ($14/mo); slightly higher per-message but cheaper at SailBook volume. Worth using for 3.1.

**Code Review:** 3 real findings + 3 cleanups (advisory). All open — queued as first thing next session per Eric.

1. **bug** — `templates.ts:94+` HTML email templates interpolate user-supplied strings (student name, email, course title) into the HTML without escaping. Plaintext SMS/text bodies are fine. Names like `O'Brien` corrupt rendering; names with `<script>` are worse. Fix: small `escapeHtml()` helper wrapping every `${…}` in the HTML strings.

2. **bug** — `confirmEnrollment` (admin "Confirm" button on `registered → confirmed`) does NOT fire `notifyEnrollmentConfirmed`. Trigger docstring says it covers all confirmation paths but I missed this third one. Fix: add `await notifyEnrollmentConfirmed(enrollmentId)` after the update in `src/actions/enrollments.ts:99-108`.

3. **consistency** — `triggers.ts:219` threshold uses `Math.floor(capacity * 0.5)`, which is `0` for capacity=1 (alert never fires) and `1` for capacity=3 (1/3-full silently "fine"). ASA 101 capacity=4 isn't affected today, but worth fixing while in the file. Switch to ratio comparison: `enrolled / capacity < LOW_ENROLLMENT_RATIO`.

4. **cleanup** — `triggers.ts:194+` low-enrollment cron is N+1 (sessions + enrollment count + maybe course_type per course). 26 active courses → ~52–78 round-trips daily. Fine for V1 cadence; fold into a single query when 5.8 redesigns the rule.

5. **cleanup** — `triggers.ts:161,222` `daysUntilStart` math relies on UTC offset absorbing into `Math.round`. Fragile if cron schedule ever shifts toward 00:00 UTC. Compute from ISO date strings directly.

6. **cleanup** — `supabase/seeds/2026_season_courses.sql:18,38` "prod-safe" framing in header is misleading while default `ADMIN_EMAIL = 'andy@ltsc.test'`. Script `RAISE EXCEPTION`s on prod (good) but the framing is wrong. Drop "prod-safe" or change default to `'CHANGE_ME@example.com'`.

## Session 92 — 2026-04-24 20:16–21:01 (0.75 hrs)
**Duration:** 0.75 hrs | **Points:** 3 (3.3: 3)
**Task:** Phase 4.1 manual QA + Phase 3.3 notification service abstraction

**Completed:**
- 4.1 instructor invite — manual QA passed (admin generates → copy → unauth view → student accepts → role flips). Minor UX caveat acknowledged: unauth users see Sign in / Create account CTAs, not a redirect to register. V1-acceptable rough edge (already noted in session 91).
- Phase 3.3 — notification service abstraction
  - `src/lib/notifications/index.ts` — dispatcher: `sendSMS` / `sendEmail`, gated on `NOTIFICATIONS_ENABLED === 'true'`. Mock statically imported; real providers lazy-loaded.
  - `src/lib/notifications/mock.ts` — in-memory buffer + console.log echo. `getMockBuffer()` / `clearMockBuffer()` for tests.
  - `src/lib/notifications/twilio.ts` + `resend.ts` — env-guarded real senders. Both use `@ts-expect-error` on the dynamic `import('twilio'/'resend')` line so the module ships before npm install (3.1/3.2). Resend `from` baked to `SailBook <info@sailbook.live>`.
  - `src/app/api/test/notifications/route.ts` — dev-only GET/POST/DELETE on the mock buffer; `NODE_ENV !== 'development'` gate matches existing `set-role-flag/route.ts` pattern.
  - `tests/notifications.spec.ts` — 4 desktop tests (SMS dispatch, email dispatch, accumulate+clear, invalid channel). Serial + desktop-only because the buffer is shared module state; skip lives in `beforeEach` so non-desktop workers don't even touch the route.
- Pre-existing lint/tsc cleanup bundled into the same commit:
  - Unescaped `"Forgot Password"` quotes in `admin/students/new/page.tsx`
  - Unused `Badge` import in `instructor/dashboard/page.tsx`
  - Stripe SDK type drift in `tests/payment-e2e.spec.ts` — `WebhookTestHeaderOptions` types 6 fields as required but Stripe's own README example only passes 3; cast added with comment.
- Commit `027dff3`

**In Progress:** Nothing.

**Blocked:**
- Eric to add `NOTIFICATIONS_ENABLED=false` + `TWILIO_*` / `RESEND_API_KEY` placeholders to `.env.local`
- `supabase db push` to remote still pending (carried from sessions 90 + 91)
- 4.2 admin invite link **parked + needs re-estimate.** Original spec was a 2-pt clone of the instructor invite panel. Eric's revised direction: consolidate `/admin/students` + `/admin/instructors` into a unified `/admin/users` with a role filter (Admin / Instructor / Student) and two collapsed invite panels at the top. That's a 5–8 pt task, not 2. Plan needs an update next session.

**Next Steps:**
1. Re-scope and re-estimate 4.2 → "users page consolidation + dual invite panels"
2. Phase 3.4 — enrollment notifications. First real consumer of the 3.3 dispatcher; mock path covers everything end-to-end without Twilio/Resend creds. Includes admin alert on new enrollment + low enrollment warning per Andy's request.
3. `supabase db push` to remote (overdue)

**Context:**
- Module-instance trap: in Next.js / Turbopack dev, static `import` and dynamic `await import()` of the same module path can resolve to **different module instances**, breaking module-level state. The dispatcher had to import `mock.ts` statically to share its buffer with the test API route. First session's draft used `await import('./mock')` and the test buffer always read empty.
- `@ts-expect-error` is the load-bearing piece in `twilio.ts` / `resend.ts`. **Remove the directive in the same commit that does `npm install twilio` / `npm install resend` (3.1 / 3.2)**, or CI will go red.
- Same parallel-worker shared-state pattern as 4.1: `test.describe.configure({ mode: 'serial' })` + `test.skip` in `beforeEach` (not test body — body skip runs after beforeEach, which still races).
- Mock logger echoes full email/SMS body to dev stdout. Dev-only by design; do not adapt that pattern for the real providers.
- For local manual testing without creds: dev server at `:3000`, hit `curl -X POST localhost:3000/api/test/notifications -H 'Content-Type: application/json' -d '{...}'`, then `curl localhost:3000/api/test/notifications` to read back.

**Code Review:** Clean Bill of Health. 4 cleanup advisories, all non-blocking:
1. POST handler doesn't try/catch `req.json()` — matches existing dev-route convention
2. `@ts-expect-error` cleanup discipline flagged for 3.1 / 3.2
3. Add a "dev-only — do not copy into real providers" comment on the mock logger
4. Twilio/Resend clients re-instantiated per call; hoist to singleton if volume grows


## Session 91 — 2026-04-23 14:21–15:27 (1.08 hrs)
**Duration:** 1.08 hrs | **Points:** 3 (4.1: 3)
**Task:** Phase 4.1 — instructor invite link (admin-generated, single shared reusable URL)

**Completed:**
- Migration `20260423182537_invites_table.sql` — `invites` table (role PK, token UNIQUE, created_by, `last_accepted_by`/`last_accepted_at` audit cols), admin-only RLS, `accept_invite(role, token)` SECURITY DEFINER RPC (bumps `profiles.updated_at`; intentionally bypasses `profile_role_flags_unchanged` + `profile_auth_source_unchanged` — role promotion is the whole point, auth_source is orthogonal)
- `src/actions/invites.ts` — `regenerateInvite(role)` (admin-gated, upsert on role PK) + `acceptInstructorInvite(token)` (RPC → `updateUser({ data })` → `refreshSession()` → redirect; the explicit refreshSession is load-bearing — without it the JWT cookie keeps the stale `user_metadata.is_instructor=false` and the proxy bounces the user off `/instructor/*`)
- `src/components/admin/instructor-invite-panel.tsx` — client panel: current link, Copy, Regenerate (confirm dialog)
- `src/app/(admin)/admin/instructors/page.tsx` — panel wired at top; surfaces `inviteResult.error` per code review
- `src/app/invite/instructor/[token]/page.tsx` + `accept-form.tsx` — public accept page, auth-gated (shows Sign in / Create account buttons when unauth)
- `src/proxy.ts` — added `PUBLIC_PREFIXES = ['/invite/']` concept; unlike `PUBLIC_ROUTES`, doesn't bounce authenticated users to their dashboard (so a logged-in admin can preview the accept URL)
- `src/app/api/test/set-role-flag/route.ts` — dev-only `is_*` flag toggle for test cleanup; merges user_metadata via get→update so existing keys survive
- `supabase/tests/09_invites.sql` — 15 pgTAP tests (CHECK/PK constraints, admin CRUD, instructor SELECT/UPDATE/DELETE blocked, student INSERT blocked, `accept_invite` happy + bad-token + invalid-role + unauth paths)
- `tests/instructor-invite.spec.ts` — 3 tests, describe configured `mode: 'serial'`; generate+accept and regenerate tests desktop-only (mutate the single `invites.role='instructor'` row); invalid-token runs all viewports. 5/5 passing.
- Applied all 6 code review findings mid-session (audit cols, `updated_at` bump, surface invite error, 2 new pgTAP tests, proxy + migration comments)

**In Progress:** Nothing

**Blocked:**
- Manual QA not performed — dev server had browser-access issues after `supabase db reset`; Eric rebooting at session end, will QA at start of next session (memory: `project_task_41_qa_pending.md`)
- `supabase db push` to remote pending

**Next Steps:**
- Session 92 opens with the 4.1 QA walkthrough surfaced from memory
- After QA: start 4.2 (admin invite link — same pattern, 2 pts, reuses `invites` table + RPC; only new code is admin role gate + UI panel on `/admin/users`)

**Context:**
- `invites` uses `role` as PRIMARY KEY by design — single row per role means admin regenerate invalidates all outstanding links. Downside: Playwright tests can't parallelize mutating tests; `describe.configure({ mode: 'serial' })` + desktop-only gating solved it.
- `supabase.auth.updateUser({ data })` does NOT re-issue the JWT on its own — must call `refreshSession()` after to push the new `user_metadata` into the cookie. This is the second time we've hit role-flag-in-JWT staleness; worth a DEC entry if 4.2 or another task repeats the pattern.
- Dev login dropdown stopped responding mid-session (visible but click doesn't open). Eric will check after reboot. Not related to 4.1 — login page and DevLoginHelper were untouched. Suspect WSL2/Turbopack HMR state.
- `CardTitle` renders as `<div>`, not a heading — Playwright `getByRole('heading', ...)` won't match; use `getByText(...)` for Card titles.
- Unauthed accept flow currently asks the user to "sign in then return to this link" (no `?next=` param on login). Eric acknowledged as a V1-acceptable rough edge; deferred.

**Code Review:** 6 findings, all fixed in-session (3 security/consistency: audit trail columns, `updated_at` bump, surface `inviteResult.error`; 3 cleanup: 2 RLS test cases, 2 explanatory comments). No open items.


## Session 90 — 2026-04-23 13:26–14:11 (0.75 hrs)
**Duration:** 0.75 hrs | **Points:** 0 (bug fixes, no plan task)
**Task:** Pre-task housekeeping — fix pgTAP failure and Playwright payment-e2e failures before starting 4.1

**Completed:**
- `supabase db push` to remote (user action, unblocked from session 89)
- Diagnosed pgTAP test 9 failure: `auth_source` not in `profile_role_flags_unchanged()` WITH CHECK — student could overwrite their own `auth_source`
- Migration `20260423175424_fix_auth_source_self_update.sql`: new `profile_auth_source_unchanged(uuid, text)` SECURITY DEFINER function, ANDed into "Users can update own profile" policy WITH CHECK. pgTAP: 105/105 ✓
- Diagnosed Playwright `payment-e2e.spec.ts` 3-viewport failure: migration `20260422194000` dropped full UNIQUE constraint on `stripe_checkout_session_id`, replaced with partial index — broke `ON CONFLICT (stripe_checkout_session_id)` in webhook upsert, silently dropped every payment row
- Fixed webhook: `upsert({...}, { onConflict:... })` → `.insert({...})` in `src/app/api/webhooks/stripe/route.ts`
- Discovered root cause of fix not taking effect: dev server (PID 71999) running since Apr 21, Turbopack file watcher stale — server needs `npm run dev` restart to pick up webhook change

**In Progress:** Nothing half-done

**Blocked:**
- Playwright `payment-e2e.spec.ts` fix is in source but requires dev server restart to take effect — restart `npm run dev` then re-run to confirm green

**Next Steps:** Task 4.1 — instructor invite link (single shared reusable link, confirmed design, plan approved). Start fresh session with `/its-alive`.

**Context:**
- Dev server Turbopack watcher goes stale after ~2 days in WSL2 — restart `npm run dev` if file edits aren't being picked up
- Webhook payment insert is non-fatal by design — enrollment confirmation succeeds even if payment row fails; concurrent double-delivery hits the partial unique index and fails noisily but correctly
- 4.1 design confirmed: single shared link per role (`role='instructor'` row in `invites` table), admin regenerates to invalidate old link, accept page sets `is_instructor=true` on whoever is logged in

**Code Review:** 2 findings (both CLEANUP):
1. `auth_source` throws_ok test in `08_admin_students.sql` — should live in `01_rls_profiles.sql` alongside other WITH CHECK tests (discoverability)
2. Webhook concurrent double-delivery leaves a log noise note opportunity — idempotency gap is benign but worth a comment

## Session 89 — 2026-04-22 19:26–21:45 (1.83 hrs)
**Duration:** 1.83 hrs | **Points:** 12 (4.4a: 5, 4.4b: 5, code review fixes: 2)
**Task:** Phase 4.4a + 4.4b — admin-created students and admin-initiated enrollment with manual payment

**Completed:**
- @architect reviewed and approved schema approach (DEC-024, DEC-025)
- Migration `20260422193000_admin_created_profiles.sql` — `auth_source` column on profiles (`self_registered` | `admin_created`)
- Migration `20260422194000_manual_payments.sql` — `payment_method` column (cash/check/venmo/stripe_manual), UNIQUE on `stripe_checkout_session_id` made partial (`WHERE NOT NULL`)
- `createAdminStudent` action: service-role `createUser` (no password, email_confirm=true), inserts profile with `auth_source='admin_created'`, rolls back auth row on profile failure
- `adminEnrollStudent` action: duplicate-enrollment check, enrollment→`confirmed` directly, seeds session_attendance, inserts manual payment row — no Stripe involved
- `/admin/students/new` page + `CreateAdminStudentForm` client component
- `AdminEnrollStudentPanel` inline toggle on course detail page (student picker, payment method, amount)
- `supabase/tests/08_admin_students.sql` — 8 pgTAP tests: check constraints, NULL coexistence, partial UNIQUE
- `tests/admin-students.spec.ts` — 9 passing Playwright tests (3 skipped pending Dialog component)
- Payment method options: cash, check, venmo, stripe_manual — `other` dropped
- Code review run post-commit; 7 findings fixed (commit `d3de928`):
  - Surfaced silent errors in `adminEnrollStudent` (attendance seed + payment insert)
  - Fixed `processRefund` for manual payments (was leaving `status=succeeded` on cancelled enrollment)
  - Added length validation to `createAdminStudent`
  - Moved duplicate enrollment check to `adminClient`
  - Extracted `MANUAL_PAYMENT_METHODS` constant to `src/lib/constants.ts`
  - Added 2 RLS behavioral tests to `08_admin_students.sql` (now 10 tests)

**In Progress:** Nothing

**Blocked:**
- `supabase db push` to remote pending
- Dialog component (`npx shadcn@latest add dialog`) not installed — enrollment panel uses inline toggle instead; desktop enrollment E2E test is skipped until then

**Next Steps:** Phase 3 task 3.3 — notification service abstraction. Build against mock path (`NOTIFICATIONS_ENABLED=false`); no Twilio/Resend creds required. Lock in `from` address (`info@sailbook.live`) before writing copy. Also: consider installing Dialog component early to unblock the skipped enrollment test.

**Context:**
- Admin capacity bypass is intentional — admins can enroll beyond capacity (walk-ons, comps, etc.)
- Ghost student login flow: Andy gives student their email, student uses Forgot Password to claim account
- `stripe_manual` payment method = Andy ran a manual Stripe charge outside the checkout flow and is recording it
- types.ts regeneration captured the `npx supabase` install prompt as garbage lines 1–3; stripped them manually. Future gen: run with installed `supabase` CLI to avoid this (`supabase gen types typescript --local`)

**Known Test Failures (pre-existing):**
- `enrollment-refund.spec.ts:62` — `cancel_requested without payment shows Cancel (no refund) button` failing on desktop — investigate before Phase 3 close
- `payment-e2e.spec.ts` — 2 tablet failures flagged as flaky

**Code Review:** 7 findings, all fixed. 3 bugs (silent discards + manual refund gap), 2 security (length validation, RLS-stable duplicate check), 1 consistency (shared constant), 1 cleanup (missing RLS tests). No open items.

## Session 88 — 2026-04-22 19:08–19:19 (0.17 hrs)
**Duration:** 0.17 hrs | **Points:** 0 (docs-only, no plan task)
**Task:** Align NOTIFICATION_SETUP.md with updated EMAIL_SETUP.md (Cloudflare Email Routing + Gmail, replacing Zoho)

**Completed:**
- Pulled origin/main into dev — picked up `docs/EMAIL_SETUP.md` and `docs/NOTIFICATION_SETUP.md` (Zoho→Cloudflare flip committed directly to main)
- Updated `docs/NOTIFICATION_SETUP.md`:
  - Banner: removed "do Zoho first" → "do EMAIL_SETUP.md (Cloudflare) first, check for existing SPF before adding Resend's"
  - DNS section: replaced merge-with-Zoho SPF example with check-first approach; removed Zoho MX note; kept proxy/DKIM/CNAME guidance
  - From-address recommendation: "Zoho is already hosting that mailbox" → "Cloudflare Email Routing already forwards it to Gmail, Andy responds via Send-As"
  - Checklist footer: "do after Zoho" → "do after EMAIL_SETUP.md"; SPF note reworded
  - Fixed one LTSC → Simply Sailing stale reference in Twilio section

**In Progress:** Nothing
**Blocked:**
- Twilio account setup (user action)
- Resend account setup (user action — needs API key + sailbook.live domain verification)
- `supabase db push` pending (needs `supabase db reset` locally first)

**Next Steps:** Start Phase 3 task 3.3 — notification service abstraction. Build against mock path (`NOTIFICATIONS_ENABLED=false`); no creds required yet. Lock in `from` address before writing copy (recommendation: `info@sailbook.live`).

**Context:**
- SPF: one record per domain — any new sender (Resend, Google Send-As) must be merged in, not added as a second TXT record
- Cloudflare Email Routing virtually always adds a TXT record automatically (EMAIL_SETUP.md step 4); the NOTIFICATION_SETUP.md banner should say "adds" not "may add" (code review finding — deferred)
- SPF example in NOTIFICATION_SETUP.md step 3 should include `_spf.google.com` for Gmail Send-As alongside `_spf.resend.com` — omission flagged by code review, worth fixing before Andy does DNS setup

**Code Review:**
- **CONSISTENCY** `NOTIFICATION_SETUP.md` line 70 — SPF example omits `_spf.google.com`; if Andy adds it later as a separate TXT he'll have duplicate SPF and broken email. Fix: `v=spf1 include:_spf.google.com include:_spf.resend.com ~all`
- **CONSISTENCY** `NOTIFICATION_SETUP.md` line 7 — banner says Cloudflare "may add" a TXT record; EMAIL_SETUP.md says it does so automatically. Tighten to "adds."
- **CONSISTENCY** `NOTIFICATION_SETUP.md` line 75 — "turn off orange cloud for all mail-related records" — MX records can't be proxied; scope to "DKIM and CNAME records."

## Session 87 — 2026-04-22 13:00–13:20 (0.33 hrs)
**Duration:** 0.33 hrs | **Points:** 0
**Task:** Reconcile `NOTIFICATION_SETUP.md` with new `EMAIL_SETUP.md` (Zoho); add DEC-023
**Completed:**
- Reviewed `docs/EMAIL_SETUP.md` (added by user outside session) — Zoho free tier hosting `info@` and `andy@sailbook.live`, pulled into Gmail via POP3 + SMTP app passwords
- Updated `docs/NOTIFICATION_SETUP.md` to coexist with Zoho: banner flagging Zoho-first setup order, DNS step rewritten to *merge* into existing SPF record (not duplicate), removed obsolete Cloudflare Email Routing step, reworded from-address recommendation (commit `bd9ef62`)
- Added DEC-023 to `docs/DECISIONS.md` — documents the Zoho/Resend split, DNS coordination rules, and setup-order constraint
**In Progress:** None
**Blocked:** Human still needs to walk through `EMAIL_SETUP.md` and `NOTIFICATION_SETUP.md` before task 3.3 can go live (mock path is unblocked)
**Next Steps:** Start task 3.3 (notification service abstraction) — build against mock path with `NOTIFICATIONS_ENABLED=false`, no creds required yet. Decide `from` address before writing copy (recommendation: `info@sailbook.live`)
**Context:**
- SPF has exactly one record per domain; stacking senders means merging `include:` values into a single `v=spf1 ... ~all`. DKIM is the opposite — each sender uses its own selector and stacks as separate TXT records
- Resend does not need MX records; Zoho handles all inbound `@sailbook.live` mail
- Setup-order matters only between Zoho and Resend; Twilio is independent
- Meta note: consider a "no-code-changes" variant of /kill-this that skips build/commit/review and only updates the log — this session and session 86 both fit that shape
- Verification: eyeballed the updated docs and DEC entry; no code or DNS touched
**Code Review:** Skipped (docs-only, user call)

## Session 86 — 2026-04-21 11:54–12:04 (0.17 hrs)
**Duration:** 0.17 hrs | **Points:** 0
**Task:** Phase 3 prep — write human-facing setup guide for tasks 3.1 (Twilio) and 3.2 (Resend)
**Completed:**
- Added `docs/NOTIFICATION_SETUP.md` — step-by-step checklist covering Twilio account/number/credentials and Resend account/domain/DNS/API key, plus Cloudflare email routing for `info@sailbook.live`
- Flagged two open decisions in the doc: when to upgrade Twilio off trial (before 3.14), and which `from` address to use (recommended `info@sailbook.live`)
- Committed as `f0259e2`, pushed to main
**In Progress:** None
**Blocked:** None
**Next Steps:** Andy/Eric walks through `docs/NOTIFICATION_SETUP.md` to actually provision Twilio + Resend. Once creds are in `.env.local`, task 3.3 (notification service) can start — that task will finalize env var names and import/use the creds.
**Context:**
- Doc is intentionally a checklist, not prose — seeds content for task 3.13 (README docs) but isn't a substitute for it
- Env var names in the doc (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `RESEND_API_KEY`) are placeholders; 3.3 locks them in
- `from`-address decision affects 3.3 copy — pick before starting it
- Duration captures AI time only; user will update with human-task time after provisioning Twilio/Resend
**Code Review:** Skipped (doc-only change, user call)

