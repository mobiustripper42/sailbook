---
session: 131
dev: mobiustripper42
slug: setup-sailbook-staging-ev1eu
branch: claude/setup-sailbook-staging-eV1Eu
started: 2026-05-03T19:00:24Z
ended: 2026-05-05T14:13:33Z
duration: 5.5
points: 5
status: closed
transcript: /root/.claude/projects/-home-user/e0a24e8d-06f8-47fd-83a0-bc007a5ca544.jsonl
---

# Session 131 — setup-sailbook-staging-ev1eu

**Task:** Set up staging environment for SailBook (Phase 9, task 9.1)

**Completed:**
- `sailbook-staging` Supabase project provisioned, migrations applied, seeded
- Vercel Preview-scope env vars configured (staging Supabase URL/keys, sk_test, sk_test webhook secret)
- `dev-sailbook.vercel.app` pinned to `staging` branch + Preview env
- Stripe test webhook → `dev-sailbook.vercel.app/api/webhooks/stripe` (checkout.session.completed)
- `staging` git branch created as release-train accumulator
- `.env.example` committed (`NEXT_PUBLIC_*`, Stripe, Twilio, Resend, cron)
- `.github/workflows/playwright.yml` — matrix CI (desktop/tablet/mobile) on PRs to main + staging, ephemeral local Supabase via `supabase start`, placeholder Stripe key fallback for build
- `docs/STAGING.md` runbook (Option 2 release-train model, diagrams, workflow, troubleshooting)
- Phase 9 Section 0 added to `docs/PROJECT_PLAN.md` for the dashboard work
- CLAUDE.md PR Workflow rewritten for Option 2
- 6.18 + 6.28 restored from V2 cuts, folded into 9.1
- PR #37 (claude/... → staging) merged; staging green

**In Progress:**
- Stripe payment flow problem on staging — diagnose in next session
- 49 Playwright failures in CI (placeholder Stripe key skips ~10; remaining are CI-vs-local seed data assumptions, env mismatches) — log as a follow-up task, not blocking

**Blocked:**
- Twilio Toll-Free Verification (external, carryover from S129)

**Next Steps:**
1. New session: diagnose the Stripe issue on dev-sailbook.vercel.app (open `/its-alive stripe-staging` next)
2. Close PR #33 (stale, bypasses Option 2)
3. Optionally delete the `dev` branch on origin (vestigial; was never deleted)
4. Open a release PR (`staging` → `main`) when ready to ship Phase 9 staging work to prod
5. Triage the 49 CI test failures — likely a 1-pt task, mostly env/seed data assumptions
6. iPhone WebKit project (1-pt V3 follow-up from 6.18 original scope)

**Context:**
- Workflow flipped twice this session: started on Option 1 (continuous deploy), almost shipped that with auto-ff staging branch + sync-staging.yml workflow, then flipped to Option 2 (release train) when user realized batching is what they actually wanted. Net result: feature PRs target `staging`, release PRs go `staging → main`.
- `NEXT_PUBLIC_*` env vars are baked at build time, NOT read at runtime — changing them in Vercel requires a rebuild (no-cache redeploy or new commit) for changes to land.
- Vercel "Sensitive" flag: don't use it on `NEXT_PUBLIC_*` vars (they ship to browser anyway) or you can't visually verify what's pasted. Reserved for actual secrets (service role key, sk_*, whsec_*, CRON_SECRET).
- `supabase db reset` (no flag) operates on local Supabase regardless of what's linked. Need `--linked` to wipe a remote project. Plain `db reset` while linked to prod is safe — just resets local.
- Stripe webhook handler only processes `checkout.session.completed`. Refunds use `stripe.refunds.create` directly, not webhook. Don't subscribe to extra events.
- `--project-ref` flag is on `supabase link` and `supabase projects api-keys` only. Not on `db push` or `migration list` — use the link-and-push pattern instead.
- Build-time gotcha: `src/lib/stripe.ts` throws at import if `STRIPE_SECRET_KEY` is missing. CI workflow uses placeholder fallback values so `next build` compiles.
- Sandbox clock skew: `/its-alive` stamped started: 2026-05-03 but actual session date was 2026-05-05. Wall-clock time was 13.5 hr; subtracted 8 hr for sleep gap = 5.5 hr active.

**Code Review:** Skipped — no code-review agent in this sandbox. Changes are docs + workflow YAML. CI build (PR #37) validates the Next.js build works.
