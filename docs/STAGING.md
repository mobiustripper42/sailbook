# Staging environment runbook

How SailBook's staging environment works, how it was set up, and what to do when something needs changing.

## Model: continuous deployment (Option 1)

```
                          ┌────────────────────┐
  task/X.Y-foo branch ──▶ │ Vercel Preview URL │ ──▶ Staging Supabase + Stripe test
  (one per PR)            └────────────────────┘
                                    │
                                    ▼ merge to main
                          ┌────────────────────┐
  main branch         ──▶ │ Vercel Production  │ ──▶ Production Supabase + Stripe live
                          └────────────────────┘
```

- Every PR (any branch ≠ `main`) auto-deploys to its own Vercel Preview URL.
- All preview deployments share the same staging Supabase project and Stripe test mode.
- Merging to `main` triggers a production deploy.
- There is no long-lived `staging` branch. (We may add one in the future when batched releases start; see `Option 2: Release train` in CLAUDE.md.)

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

### 3. Stripe test webhook

For preview deploys to receive Stripe webhook events:

1. Stripe Dashboard → toggle to **Test mode** → Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://<your-vercel-project>.vercel.app/api/webhooks/stripe` — use the production-domain alias if Vercel gives you one for previews, or pick any one preview URL (Stripe webhooks need a stable URL, so prefer the alias)
3. Events to send: `checkout.session.completed` only. The webhook handler ignores everything else (refunds go through `stripe.refunds.create` directly, not via webhook).
4. Copy the signing secret (`whsec_…`) and paste into Vercel `STRIPE_WEBHOOK_SECRET` (Preview scope)

For production: repeat with **Live mode** + production webhook endpoint at `https://sailbook.app/api/webhooks/stripe`. Paste the live signing secret into Vercel `STRIPE_WEBHOOK_SECRET` (Production scope).

### 4. Verify

1. Open a throwaway PR with any small change.
2. Vercel posts a Preview URL comment on the PR.
3. Tap the URL, register a test user.
4. Check Supabase staging dashboard → `auth.users` table — your test user should appear there (and NOT in prod).
5. Try a checkout with Stripe test card `4242 4242 4242 4242`. Confirm a row lands in `payments` on staging Supabase.

If both check out, staging is live. Close the throwaway PR.

## Day-to-day workflow

```bash
# 1. Cut a feature branch off main
git checkout main && git pull
git checkout -b task/9.X-short-description

# 2. Make changes, commit, push
git push -u origin task/9.X-short-description

# 3. Open PR via gh CLI or the GitHub web UI.
#    Vercel posts a Preview URL comment within ~1 min.
#    Playwright CI runs against ephemeral local Supabase (.github/workflows/playwright.yml)

# 4. Tap the Preview URL, click through the feature, share with Andy if needed.

# 5. When CI is green and review is done, merge → prod deploys automatically.
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
| Branch | any (preview) | `main` |
| Vercel env scope | Preview | Production |
| Supabase project | `sailbook-staging` | `sailbook` (or your prod name) |
| Stripe mode | Test | Live |
| Webhook endpoint | preview alias URL | sailbook.app |
| Notifications | off (`NOTIFICATIONS_ENABLED=false`) | on |
| Twilio number | unset | live toll-free |
| Cron jobs | run, but no real notifications fire | run + send |

## Troubleshooting

**Preview URL hits prod Supabase** — Vercel env vars are scoped to All Environments instead of Preview-only. Re-scope, redeploy.

**Webhook 400 / signature mismatch on staging** — `STRIPE_WEBHOOK_SECRET` doesn't match the test-mode endpoint's signing secret. Regenerate from Stripe Dashboard → Test webhook → Reveal signing secret.

**`supabase db push` errors with "relation already exists"** — staging DB has drift from the migration ledger. Run `supabase db reset --linked` to wipe and replay.

**Playwright CI fails on Stripe tests but passes locally** — CI doesn't have Stripe secrets configured. Stripe-touching tests skip in that case (`test.skip(!process.env.STRIPE_SECRET_KEY, ...)`). To run them in CI, add `STRIPE_SECRET_KEY` (test) and `STRIPE_WEBHOOK_SECRET` (test) to GitHub Actions repo secrets.
