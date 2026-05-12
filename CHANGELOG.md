# Changelog

All notable changes to SailBook are tracked here. Format inspired by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); maintenance is automated by the `/its-dead` (patch), `/retro` (minor), and `/bump-major` (major) skills per DEC-007.

## [2.0.0-rc1] - 2026-05-11
- Baseline for V2 RC track. Seeds V3 schema migration (Task 18) lands the version surface — VersionTag wired into auth layout + root layout, `package.json` bumped to match the existing `v2.0.0-rc1` tag.
- Phase 9 (Deployment & Launch) in progress; CI green across 5 checks; staging-flow + GitHub rulesets enforced.

## [1.0.0] - 2026-05-15
- SailBook V1 — LTSC launch build (Phases 0–6 closed).
- Admin, Instructor, Student dashboards; Stripe Checkout enrollments + refunds; Twilio SMS + Resend email notifications; Supabase RLS across all tables; Playwright + pgTAP test suites.
