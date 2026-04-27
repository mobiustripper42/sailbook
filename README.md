# SailBook

Scheduling, enrollment, and payment management for Simply Sailing.

## Dev Setup

```bash
# Start local Supabase (Docker must be running first)
supabase start

# Start Next.js dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### After a shutdown

1. Boot computer
2. Open Docker Desktop
3. Open WSL terminal
4. `cd ~/sailbook && supabase start && npm run dev`

### Remote dev (Hetzner)

The full dev stack also runs on a Hetzner Cloud server accessed via Tailscale + VS Code Remote-SSH. See [`docs/HETZNER_DEV.md`](docs/HETZNER_DEV.md).

---

## Stripe Setup

Stripe is used for student payments. You need a Stripe account in **test mode**.

### Required environment variables

Add these to `.env.local`:

```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Get `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` from the Stripe dashboard → **Developers → API keys**.

`STRIPE_WEBHOOK_SECRET` comes from the Stripe CLI (see below) or from the Stripe dashboard if you register a webhook endpoint.

### Webhook setup (local dev)

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli), then forward events to your local server:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the `whsec_...` secret printed on startup into `.env.local` as `STRIPE_WEBHOOK_SECRET`.

### Test cards

| Card number | Behavior |
|-------------|----------|
| `4242 4242 4242 4242` | Succeeds |
| `4000 0000 0000 0002` | Declined |

Use any future expiry date and any 3-digit CVC.

---

## Database Seeding

Two distinct seeding paths — don't confuse them.

### `supabase/seed.sql` — test data for local dev

Auto-runs on `supabase db reset`. Contains demo users (Andy, Mike, Lisa, etc.), Playwright test users (`pw_admin`, `pw_student`, …), and seed courses. **Never** run against prod.

### `supabase/seeds/*.sql` — manual additive seeds (prod-safe)

Idempotent scripts you run by hand. Not auto-loaded — won't run on `db reset`, won't run on deploy.

Currently:

| File | Purpose |
|------|---------|
| `supabase/seeds/2026_season_courses.sql` | ASA 101 weekend courses, May–Oct 2026 (26 courses, 52 sessions). |

**Run against local dev** (no Postgres client install needed):
```bash
docker exec -i supabase_db_sailbook psql -U postgres -d postgres < supabase/seeds/2026_season_courses.sql
```

Or with `psql` installed (`sudo apt install postgresql-client`):
```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/seeds/2026_season_courses.sql
```

**Run against prod:** edit `ADMIN_EMAIL` at the top of the script to a real admin profile email, then:
```bash
psql "<prod connection string>" -f supabase/seeds/2026_season_courses.sql
```

Look for `NOTICE: 2026 season seed: N course(s) inserted, M already existed (skipped)` at the end. Re-running is safe — `inserted=0, skipped=N` means everything's already there.

---

## Running Tests

```bash
# Reset DB and run all tests
supabase db reset && npx playwright test

# Single file
npx playwright test tests/foo.spec.ts

# pgTAP (RLS tests)
supabase test db
```
