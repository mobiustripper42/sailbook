# Deployment runbook

How SailBook ships, how the environments are wired, and what to do when something needs changing. Production-branch model (DEC-029) — replaces the old staging release-train.

## Model: production branch (DEC-029)

```
  task/X.Y-foo branch                ───▶ ┌──────────────────────┐
  (one per feature)                       │ Per-PR Vercel preview│ ──▶ Staging Supabase + Stripe test
                                          │ (ephemeral, one per  │
                                          │  open PR)            │
                                          └──────────┬───────────┘
                                                     │ merge PR (base = main)
                                                     ▼
  main branch                             ┌──────────────────────┐
  (always-active trunk;     ───────────▶  │ dev-sailbook         │ ──▶ Staging Supabase + Stripe test
  every feature lands here)               │ .vercel.app          │     ← Stripe webhook (test) pinned here
                                          └──────────┬───────────┘
                                                     │ /promote-production
                                                     │ ff-merge main → production, push
                                                     ▼
  production branch                       ┌──────────────────────┐
  (deploy pointer;                   ───▶ │ Vercel Production    │ ──▶ Production Supabase + Stripe live
  Vercel Production Branch)               │ sailbook.live        │     ← Stripe webhook (live) pinned here
                                          └──────────────────────┘
```

The branch flow:

- **Feature branches** are cut from `main`. Open PR with **base = `main`**.
- **`main`** is the always-active trunk. It's PR-only — never `git push origin main` directly. Merged features land here and rebuild the `dev-sailbook.vercel.app` preview.
- **`production`** is a long-lived deploy pointer. It only moves via `/promote-production`, which ff-merges `main` → `production`. Vercel's **Production Branch** is set to `production`, so that push is the prod deploy.
- The release is already version-bumped + tagged on `main` (`/retro` / `/bump-major`). `/promote-production` is deploy-only — it carries the tagged commit and does **not** tag.

CI runs on every PR to `main`. There is no second release PR — promotion is a fast-forward, not a merge through review.

## One-time setup

Done once, when bootstrapping or rebuilding the environments.

### 1. Supabase staging project

Used by the `main` preview and all per-PR previews.

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

### 2. Vercel branch + env config

**Production Branch (DEC-029):** Vercel → Settings → Git → Production Branch = **`production`**. This is the switch that makes the `production` branch (not `main`) the prod deploy. Pin `dev-sailbook.vercel.app` to the **`main`** branch (Preview env) so the trunk always has a stable dev URL.

**Environment variables:** Settings → Environment Variables, add each var from `.env.example`. Scope each value to **Preview** OR **Production** — not "All Environments" (different values per env).

**Preview scope (staging values — used by `main` + per-PR previews):**

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

**Production scope (live values — used by the `production` branch):**

Same vars, but with prod Supabase URL/keys, `sk_live_…`, `NOTIFICATIONS_ENABLED=true`, real Twilio/Resend creds, `NEXT_PUBLIC_DEV_MODE=false` (or unset), `NEXT_PUBLIC_SITE_URL=https://sailbook.live`.

### 3. The `production` branch (deploy pointer)

`production` is the long-lived branch Vercel deploys to prod. It's advanced only by `/promote-production`.

1. Create the branch from current `main` (one-time):
   ```bash
   git checkout main && git pull
   git checkout -b production
   git push -u origin production
   ```
2. Set Vercel's Production Branch to `production` (step 2 above). Confirm `sailbook.live` now deploys from `production`, and `dev-sailbook.vercel.app` from `main`.

**Rules:**
- `main` is PR-only — never push commits directly.
- `production` moves only via `/promote-production` (ff-merge from `main`). Never commit to `production` directly; never rebase it.

### 4. Stripe webhooks

For deploys to receive Stripe webhook events:

1. **Test (preview/main):** Stripe Dashboard → **Test mode** → Workbench → Webhooks → Add destination. Endpoint: `https://dev-sailbook.vercel.app/api/webhooks/stripe`. Events: `checkout.session.completed` only (the handler ignores everything else; refunds go through `stripe.refunds.create` directly). Copy the signing secret (`whsec_…`) → Vercel `STRIPE_WEBHOOK_SECRET` (Preview scope).
2. **Live (production):** repeat in **Live mode** with endpoint `https://sailbook.live/api/webhooks/stripe`. Paste the live signing secret into Vercel `STRIPE_WEBHOOK_SECRET` (Production scope).

### 5. Verify

1. Open a throwaway PR with any small change. Vercel posts a Preview URL comment.
2. Tap the URL, register a test user. Confirm they appear in Supabase **staging** `auth.users` (and NOT in prod).
3. Try a checkout with Stripe test card `4242 4242 4242 4242`. Confirm a row lands in `payments` on staging Supabase, and the test webhook fired a `checkout.session.completed` with a 200.
4. Close the throwaway PR.

## Day-to-day workflow

### Per feature

```bash
# 1. Cut a feature branch off main
git checkout main && git pull
git checkout -b task/9.X-short-description

# 2. Make changes, commit, push
git push -u origin task/9.X-short-description

# 3. Open PR with base = main.
#    gh pr create --base main   (or /kill-this)
#    Vercel posts a per-PR Preview URL. Playwright CI runs against ephemeral local Supabase.

# 4. Self-test on the per-PR URL for anything that doesn't round-trip through
#    an external redirect (UI, non-auth server actions). See "QA a branch on
#    dev-sailbook.vercel.app" below for auth / OAuth / Stripe checkout flows —
#    those redirect to whatever NEXT_PUBLIC_SITE_URL is set to, which is the
#    same fixed domain for every per-PR preview, not the per-PR URL itself.

# 5. When CI is green and you've self-tested, merge the PR.
#    The feature lands on main. dev-sailbook.vercel.app rebuilds.
```

### QA a branch on dev-sailbook.vercel.app

`dev-sailbook.vercel.app` is the one domain with working Google OAuth (Supabase staging
Site URL / Redirect URLs are configured for it — session 135, PROJECT_PLAN.md §J) and the
one `NEXT_PUBLIC_SITE_URL` value every preview build shares. Per-PR preview URLs can't
replicate that (Google's Authorized JavaScript origins requires an exact, pre-registered
origin — no wildcards, no per-branch registration), so full auth/checkout QA happens by
repointing this domain at the branch under test rather than using the per-PR URL:

1. Vercel Dashboard → Settings → Domains → `dev-sailbook.vercel.app` → Edit → Git Branch →
   select the branch under test → Save. The domain now serves that branch's deployment.
2. QA at `dev-sailbook.vercel.app` — register, Google sign-in, Stripe test checkout
   (`4242 4242 4242 4242`) all work against staging Supabase.
3. Repoint the Git Branch back to `main` when done (before someone else needs it, and
   always before `/promote-production` — see below).

One QA slot at a time. Fine for a solo dev; if this project ever gets a second concurrent
QA'er, that's the point to reconsider per-PR previews (with their own OAuth-capable Google
client + wildcard Supabase redirect entry) rather than trading turns on one domain.

### Ship to production

```bash
# 1. Repoint dev-sailbook.vercel.app's Git Branch to `main` (see above) and QA it —
#    the actual release candidate, not a feature branch. Tell Andy it's ready to look at.
#    (Fix-forward on more PRs to main if he finds anything, then re-QA.)

# 2. When main is green-lit, ship it:
/promote-production
#    ff-merges main → production, pushes. Vercel deploys production to sailbook.live.
#    The commit is already tagged (from /retro or /bump-major); promotion does not tag.

# 3. Verify: tap sailbook.live, confirm the version tag in <VersionTag /> shows the shipped version.
```

There is no release PR and no "reset" step — `production` simply fast-forwards to `main`'s tagged HEAD.

**Do not run `/promote-production` without QA'ing `dev-sailbook.vercel.app` first** — confirm its
Git Branch is pointed at `main` (not still parked on a feature branch from earlier QA) and that
you've actually looked at it since the last merge. Promoting without this is what issue #99 was
filed over.

## Migration workflow

Migrations always go staging-first, then prod. Never the other way.

```bash
# After creating a migration locally and verifying with `supabase db reset`:

# Apply to staging (covers main preview + per-PR previews)
supabase link --project-ref <staging-ref>
supabase db push

# Open PR (base = main), merge. When you're ready to ship and have run /promote-production:

# Apply to prod
supabase link --project-ref <prod-ref>
supabase db push
```

If a migration fails on staging, fix it before merging the feature PR. If it fails on prod after passing staging, you have environmental drift to investigate — do not paper over it.

## Resetting staging data

Demo data drift, broken test users, or you want a clean slate:

```bash
supabase link --project-ref <staging-ref>
supabase db reset --linked    # ⚠️  wipes the staging DB. Never run this against prod.
psql … -f docs/demo-seed.sql
supabase link --project-ref <prod-ref>   # restore prod link
```

## What lives where

| Concern | Dev / preview | Production |
|---------|---------------|------------|
| Branch | `main` (always-active trunk) + per-PR feature branches | `production` (deploy pointer, ff-only from `main`) |
| Stable URL | `dev-sailbook.vercel.app` | `sailbook.live` |
| Per-PR previews | per-PR URL on any feature branch | n/a |
| PR target | feature PRs → `main` | n/a (promotion is ff-merge, not PR) |
| Deploy trigger | merge to `main` | `/promote-production` |
| Vercel env scope | Preview | Production |
| Supabase project | `sailbook-staging` | `sailbook` (prod) |
| Stripe mode | Test | Live |
| Webhook endpoint | `dev-sailbook.vercel.app/api/webhooks/stripe` | `sailbook.live/api/webhooks/stripe` |
| Notifications | off (`NOTIFICATIONS_ENABLED=false`) | on |
| Twilio number | unset | live toll-free |
| Cron jobs | run, but no real notifications fire | run + send |

## Troubleshooting

**Preview URL hits prod Supabase** — Vercel env vars are scoped to All Environments instead of Preview-only. Re-scope, redeploy.

**Registered/reset/checkout on a per-PR preview redirects to `dev-sailbook.vercel.app` instead of the per-PR URL** — expected, not a bug. `NEXT_PUBLIC_SITE_URL` is one shared Preview-scope value; every preview build's redirect links point there. Use the "QA a branch on dev-sailbook.vercel.app" flow above for anything that redirects.

**`sailbook.live` deploying from `main` instead of `production`** — Vercel Production Branch wasn't repointed. Settings → Git → Production Branch → set to `production` (DEC-029).

**Webhook 400 / signature mismatch** — `STRIPE_WEBHOOK_SECRET` doesn't match the endpoint's signing secret for that mode. Regenerate from Stripe Dashboard → the matching (Test/Live) webhook → Reveal signing secret.

**`supabase db push` errors with "relation already exists"** — staging DB has drift from the migration ledger. Run `supabase db reset --linked` to wipe and replay.

**Playwright CI fails on Stripe tests but passes locally** — CI doesn't have Stripe secrets configured. Stripe-touching tests skip in that case (`test.skip(!process.env.STRIPE_SECRET_KEY, ...)`). To run them in CI, add `STRIPE_SECRET_KEY` (test) and `STRIPE_WEBHOOK_SECRET` (test) to GitHub Actions repo secrets.

**`/promote-production` says "production has diverged from main"** — someone committed to `production` directly (or rebased it). Don't force it. Merge `production` → `main` on a branch (PR into `main`), then re-run `/promote-production`. `production` should only ever be a fast-forward of `main`.
