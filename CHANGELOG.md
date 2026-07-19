# Changelog

All notable changes to SailBook are tracked here. Format inspired by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); maintenance is automated by the `/its-dead` (patch), `/retro` (minor), and `/bump-major` (major) skills per DEC-007.

## [2.0.1] - 2026-07-18
- PR #155: Admin tracks book-mailed date per ASA enrollment (#153)
- PR #151: Students and admins can view/edit a mailing address (#150)
- PR #135: Require a mailing address to enroll in ASA courses (#129)
- PR #134: Make phone required for students, validated as a 10-digit US number (#129)
- PR #132: Admin Calendar/List filter by student (#111)
- PR #131: Link student names in Users list to their profile; hyperlink course titles in history (#127)
- PR #109: Admin issue account credit / refund from a confirmed enrollment (#106)
- PR #138: Move dev/test server port 3000 → 3300
- PR #118: Relocate the promote QA gate
- PRs #110/#120/#126/#139: seeds template syncs

## [2.0.0] - 2026-05-14
- V2 release. Drops the `-rc1` suffix as Phase 9 launch-blocker punch list closes (PR #52: F.2/F.5/F.7/J.3/J.4/J.5 verified, `SMS_ENABLED` kill-switch ships SMS-deferred email-only V2). Andy-blocked items (Stripe live keys, A2P 10DLC, briefing) remain post-launch tasks.

## [2.0.0-rc1] - 2026-05-11
- Baseline for V2 RC track. Seeds V3 schema migration (Task 18) lands the version surface — VersionTag wired into auth layout + root layout, `package.json` bumped to match the existing `v2.0.0-rc1` tag.
- Phase 9 (Deployment & Launch) in progress; CI green across 5 checks; staging-flow + GitHub rulesets enforced.

## [1.0.0] - 2026-05-15
- SailBook V1 — LTSC launch build (Phases 0–6 closed).
- Admin, Instructor, Student dashboards; Stripe Checkout enrollments + refunds; Twilio SMS + Resend email notifications; Supabase RLS across all tables; Playwright + pgTAP test suites.
