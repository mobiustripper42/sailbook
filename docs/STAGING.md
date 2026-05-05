# Staging environment runbook

How SailBook's staging environment works, how it was set up, and what to do when something needs changing.

## Model: release train (Option 2)

```
                                          ┌──────────────────────┐
  task/X.Y-foo branch                ───▶ │ Per-PR Vercel preview│ ──▶ Staging Supabase + Stripe test
  (one per feature)                       │ (ephemeral, one per  │
                                          │  open PR)            │
                                          └──────────┬───────────┘
                                                     │ merge PR (base = staging)
                                                     ▼
  staging branch                          ┌──────────────────────┐
  (accumulates batch        ───────────▶  │ dev-sailbook         │ ──▶ Staging Supabase + Stripe test
  of features for next                    │ .vercel.app          │     ← Stripe webhook pinned here
  release)                                └──────────┬───────────┘
                                                     │ open release PR (base = main, compare = staging)
                                                     │ Andy QAs on dev-sailbook.vercel.app, approves
                                                     │ merge release PR
                                                     ▼
  main branch                             ┌──────────────────────┐
  (current production)               ───▶ │ Vercel Production    │ ──▶ Production Supabase + Stripe live
                                          │ sailbook.live        │
                                          └──────────────────────┘
```

The branch flow:

- **Feature branches** are cut from `main` (always start clean). Open PR with **base = `staging`**, NOT main.
- **`staging`** accumulates approved features. Pushing to staging is via PR merges only — never `git push origin staging` directly.
- **`main`** is current production. Updated via a single "release PR" from `staging` when Andy is ready to ship.
- After a release PR merges, `staging` and `main` converge automatically (staging's commits are now in main). Continue accumulating the next batch on staging.

CI runs on PRs to `staging` AND on the release PR to `main` — two safety gates.

## One-time setup

Done once, when bootstrapping or rebuilding staging.

### 1. Supabase staging project

1. Go to https://supabase.com/dashboard → New project
2. Name: `sailbook-staging`. Free tier is fine. Pick a region close to prod.
3. Save the project ref (the `xxxx` in `xxxx.supabase.co`), anon key, and service role key.
4. From your laptop, in the sailbook repo:
   ```bash
   supabase link --project-ref <staging-ref>
   supabase db push                              # apply all migrations
   psql "$(supabase projects api-keys --project-ref <staging-ref> | grep db-url)" \
        -f docs/demo-seed.sql                    # load demo data
   ```
   (Or paste `docs/demo-seed.sql` into the Supabase SQL editor if psql access is awkward.)
5. After staging is seeded, switch back to prod link before any further `supabase db push`:
   ```bash
   supabase link --project-ref <prod-ref>
   ```

### 2. Vercel env vars

In Vercel project settings → Environment Variables, add each var from `.env.example`. Scope each value to **Preview** OR **Production** — not "All Environments" (different values per env).

**Preview scope (staging values):**

| Var | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | staging Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | staging anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | staging service role key |
| `NEXT_PUBLIC_SITE_URL` | leave unset — Vercel auto-injects per-preview URL via `VERCEL_URL`, the app falls back to that |
| `NEXT_PUBLIC_DEV_MODE` | `true` |
| `STRIPE_SECRET_KEY` | `sk_test_…` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` from the staging webhook (see step 3) |
| `NOTIFICATIONS_ENABLED` | `false` |
| `TWILIO_*`, `RESEND_API_KEY` | leave empty (notifications off) |
| `CRON_SECRET` | random 32-char string |
| `ENROLLMENT_HOLD_MINUTES` | `15` |

**Production scope (live values):**

Same vars, but with prod Supabase URL/keys, `sk_live_…`, `NOTIFICATIONS_ENABLED=true`, real Twilio/Resend creds, `NEXT_PUBLIC_DEV_MODE=false` (or unset), `NEXT_PUBLIC_SITE_URL=https://sailbook.app`.

### 3. The `staging` branch (release-train accumulator)

`staging` is the long-lived branch where features accumulate before they ship to prod. `dev-sailbook.vercel.app` is pinned to it (Vercel Preview env + staging Supabase).

1. Create the branch from current main (one-time):
   ```bash
   git checkout main && git pull
   git push origin --delete staging   # if a stale staging branch exists
   git checkout -b staging
   git push -u origin staging
   ```
2. In Vercel → Settings → Domains → `dev-sailbook.vercel.app`: confirm it's pinned to the `staging` branch and the Preview environment.

**Rules:**
- Feature PRs target `staging` (base = staging). Never push commits directly.
- Don't branch new feature work off `staging` — branch off `main` to keep features isolated.
- After a release PR (`staging` → `main`) merges, staging and main are equal. Just keep working — your next feature PR adds onto staging's HEAD.

### 4. Stripe test webhook

For preview deploys to receive Stripe webhook events:

1. Stripe Dashboard → toggle to **Test mode** → Workbench → Webhooks → Add destination
2. Endpoint URL: `https://dev-sailbook.vercel.app/api/webhooks/stripe` (the staging branch's stable domain — set up in step 3 above)
3. Events: `checkout.session.completed` only. The webhook handler ignores everything else (refunds go through `stripe.refunds.create` directly, not via webhook).
4. Copy the signing secret (`whsec_…`) and paste into Vercel `STRIPE_WEBHOOK_SECRET` (Preview scope)

For production: repeat with **Live mode** + production webhook endpoint at `https://sailbook.live/api/webhooks/stripe`. Paste the live signing secret into Vercel `STRIPE_WEBHOOK_SECRET` (Production scope).

### 5. Verify

1. Open a throwaway PR with any small change.
2. Vercel posts a Preview URL comment on the PR.
3. Tap the URL, register a test user.
4. Check Supabase staging dashboard → `auth.users` table — your test user should appear there (and NOT in prod).
5. Try a checkout with Stripe test card `4242 4242 4242 4242`. Confirm a row lands in `payments` on staging Supabase.
6. Check Stripe Dashboard → webhook endpoint → recent deliveries — a `checkout.session.completed` event fired and got a 200 response from `dev-sailbook.vercel.app`.

If all check out, staging is live. Close the throwaway PR.

## Day-to-day workflow

### Per feature

```bash
# 1. Cut a feature branch off main (NOT off staging)
git checkout main && git pull
git checkout -b task/9.X-short-description

# 2. Make changes, commit, push
git push -u origin task/9.X-short-description

# 3. Open PR with base = staging (NOT main).
#    `gh pr create --base staging` or pick "staging" as the base in the GitHub UI.
#    Vercel posts a per-PR Preview URL comment within ~1 min.
#    Playwright CI runs against ephemeral local Supabase.

# 4. Self-test on the per-PR URL. For Stripe webhook testing, you can also wait
#    until merged to staging and test on dev-sailbook.vercel.app.

# 5. When CI is green and you've self-tested, merge the PR.
#    The feature now lives on staging. dev-sailbook.vercel.app rebuilds with the
#    accumulated batch.
```

Repeat for as many features as you want before releasing. Andy doesn't need to be told yet.

### Release the batch (when you're ready to ship)

```bash
# 1. Tell Andy: "go QA dev-sailbook.vercel.app, this is the next release."

# 2. Andy clicks through, gives you a thumbs up (or finds bugs you fix-forward
#    on more PRs to staging — repeat the per-feature flow above).

# 3. Open the release PR: base = main, compare = staging.
#    gh pr create --base main --head staging --title "Release: <date or summary>"
#    CI runs once more on this PR.

# 4. Merge it. main updates. Vercel deploys to production (sailbook.live).
#    staging and main are now equal. Continue with the next batch.
```

There is no manual step to "reset" staging after a release — main has caught up to staging, so staging's HEAD is already the right starting point for the next batch.

## Migration workflow

Migrations always go staging-first, then prod. Never the other way.

```bash
# After creating a migration locally and verifying with `supabase db reset`:

# Apply to staging
supabase link --project-ref <staging-ref>
supabase db push

# Open PR (base = staging). Once the release PR (staging → main) merges:

# Apply to prod
supabase link --project-ref <prod-ref>
supabase db push
```

If a migration fails on staging, fix it before merging the feature PR. If it fails on prod after passing staging, you have a serious environmental drift to investigate — do not paper over it.

## Resetting staging data

Demo data drift, broken test users, or you want a clean slate:

```bash
supabase link --project-ref <staging-ref>
supabase db reset --linked    # ⚠️  wipes the staging DB. Never run this against prod.
psql … -f docs/demo-seed.sql
supabase link --project-ref <prod-ref>   # restore prod link
```

## What lives where

| Concern | Staging | Production |
|---------|---------|------------|
| Long-lived branch | `staging` (accumulates next-release features) | `main` (current production) |
| Stable URL | `dev-sailbook.vercel.app` | `sailbook.live` |
| Per-PR previews | per-PR URL on any feature branch | n/a |
| PR target | feature PRs → `staging` | release PR → `main` (compare = staging) |
| Vercel env scope | Preview | Production |
| Supabase project | `sailbook-staging` | `sailbook` (prod) |
| Stripe mode | Test | Live |
| Webhook endpoint | `dev-sailbook.vercel.app/api/webhooks/stripe` | `sailbook.live/api/webhooks/stripe` |
| Notifications | off (`NOTIFICATIONS_ENABLED=false`) | on |
| Twilio number | unset | live toll-free |
| Cron jobs | run, but no real notifications fire | run + send |

## Troubleshooting

**Preview URL hits prod Supabase** — Vercel env vars are scoped to All Environments instead of Preview-only. Re-scope, redeploy.

**Webhook 400 / signature mismatch on staging** — `STRIPE_WEBHOOK_SECRET` doesn't match the test-mode endpoint's signing secret. Regenerate from Stripe Dashboard → Test webhook → Reveal signing secret.

**`supabase db push` errors with "relation already exists"** — staging DB has drift from the migration ledger. Run `supabase db reset --linked` to wipe and replay.

**Playwright CI fails on Stripe tests but passes locally** — CI doesn't have Stripe secrets configured. Stripe-touching tests skip in that case (`test.skip(!process.env.STRIPE_SECRET_KEY, ...)`). To run them in CI, add `STRIPE_SECRET_KEY` (test) and `STRIPE_WEBHOOK_SECRET` (test) to GitHub Actions repo secrets.

**Stripe webhook returning 401 from `dev-sailbook.vercel.app`** — `STRIPE_WEBHOOK_SECRET` (Preview scope) doesn't match the Test-mode endpoint's signing secret. Or the Vercel deploy is stale (rebuild via Deployments → Redeploy on the staging branch's latest deploy).

**Release PR (`staging` → `main`) shows merge conflicts** — main and staging have diverged because someone pushed to main directly (skipping staging). Resolve by merging main into staging first: `git checkout staging && git pull && git merge origin/main`, resolve conflicts, push staging, then re-open the release PR. Convention going forward: never push directly to main.

**Feature PR was opened against `main` by mistake** — close the PR, change the branch base to `staging`, re-open. (Or in the GitHub UI: PR → "Edit" next to title → change "base" to staging.)
