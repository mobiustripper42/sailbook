# Staging environment runbook

How SailBook's staging environment works, how it was set up, and what to do when something needs changing.

## Model: continuous deployment (Option 1) with a long-lived `staging` pointer branch

```
                          ┌────────────────────┐
  task/X.Y-foo branch ──▶ │ Vercel Preview URL │ ──▶ Staging Supabase + Stripe test
  (one per PR)            │ (per-PR, ephemeral)│
                          └────────────────────┘
                                    │
                                    ▼ merge to main
                          ┌────────────────────┐
  main branch         ──▶ │ Vercel Production  │ ──▶ Production Supabase + Stripe live
                          └─────────┬──────────┘
                                    │ auto-fast-forward (GH Action)
                                    ▼
                          ┌────────────────────┐
  staging branch      ──▶ │ dev-sailbook       │ ──▶ Staging Supabase + Stripe test
  (always == main)        │ .vercel.app        │     ← Stripe webhook pinned here
                          └────────────────────┘
```

- Every PR (any branch ≠ `main`, ≠ `staging`) auto-deploys to its own Vercel Preview URL with staging Supabase + Stripe test keys.
- `main` merges trigger a production deploy.
- `staging` is a long-lived branch that always equals `main`. Auto-fast-forwarded by `.github/workflows/sync-staging.yml` on every push to main. It exists so `dev-sailbook.vercel.app` (the Stripe test webhook target) has a stable URL backed by current code.
- Don't push to `staging` directly. Don't merge feature branches into `staging`. The auto-sync action does all the moving — manual pushes will diverge from main and break the action.

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

### 3. The `staging` branch (long-lived stable URL holder)

`staging` exists as a permanent branch that always equals `main`, so the Vercel domain `dev-sailbook.vercel.app` has a stable URL for the Stripe test webhook to point at.

1. Create / reset the branch from current main:
   ```bash
   git checkout main && git pull
   git push origin --delete staging   # if a stale staging branch exists
   git checkout -b staging
   git push -u origin staging
   ```
2. In Vercel → Settings → Domains → `dev-sailbook.vercel.app`: confirm it's pinned to the `staging` branch and the Preview environment.
3. Auto-sync: `.github/workflows/sync-staging.yml` fast-forwards `staging` to `main` on every push to main. No manual maintenance.

**Rules:**
- Don't push commits directly to `staging`.
- Don't merge feature branches into `staging`.
- The only writer is the GH Action.

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

```bash
# 1. Cut a feature branch off main (NOT off staging)
git checkout main && git pull
git checkout -b task/9.X-short-description

# 2. Make changes, commit, push
git push -u origin task/9.X-short-description

# 3. Open PR via gh CLI or the GitHub web UI.
#    Vercel posts a per-PR Preview URL comment within ~1 min.
#    Playwright CI runs against ephemeral local Supabase (.github/workflows/playwright.yml)

# 4. Tap the per-PR Preview URL, click through the feature, share with Andy if needed.
#    For Stripe webhook testing, use dev-sailbook.vercel.app (the staging-branch URL)
#    after the feature has merged to main and sync-staging.yml has fast-forwarded staging.

# 5. When CI is green and review is done, merge → prod deploys.
#    sync-staging.yml fast-forwards `staging` to match new main → dev-sailbook rebuilds.
```

## Migration workflow

Migrations always go staging-first, then prod. Never the other way.

```bash
# After creating a migration locally and verifying with `supabase db reset`:

# Apply to staging
supabase link --project-ref <staging-ref>
supabase db push

# Open PR. Once merged to main:

# Apply to prod
supabase link --project-ref <prod-ref>
supabase db push
```

If a migration fails on staging, fix it before merging the PR. If it fails on prod after passing staging, you have a serious environmental drift to investigate — do not paper over it.

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
| Stable branch | `staging` (auto-ff from main) | `main` |
| Stable URL | `dev-sailbook.vercel.app` | `sailbook.live` |
| Per-PR previews | per-PR URL on any feature branch | n/a |
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

**`dev-sailbook.vercel.app` serving stale code** — `staging` branch hasn't been fast-forwarded since the last main merge. Check Actions tab → "Sync staging with main" workflow. If it failed with `--ff-only` errors, someone pushed directly to `staging` and it diverged. Resolve manually: `git checkout staging && git fetch origin && git reset --hard origin/main && git push --force-with-lease origin staging`.

**Stripe webhook returning 401 from `dev-sailbook.vercel.app`** — `STRIPE_WEBHOOK_SECRET` (Preview scope) doesn't match the Test-mode endpoint's signing secret. Or the Vercel deploy is stale (rebuild via Deployments → Redeploy on the staging branch's latest deploy).
