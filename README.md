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

## Twilio Setup (SMS)

Twilio sends transactional SMS — enrollment confirmations, session cancellations, makeup assignments, and 24-hour / 1-week session reminders.

### Required environment variables

```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1XXXXXXXXXX
```

`TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` come from the Twilio Console home page (Account Info panel).

`TWILIO_FROM_NUMBER` is a Twilio-owned phone number you've purchased — find it in **Console → Phone Numbers → Manage → Active numbers**. SailBook uses a **toll-free** number (US-friendly, higher daily caps than long-codes for transactional traffic).

### Toll-Free Verification

Carriers (AT&T, T-Mobile, Verizon) silently filter outbound traffic from unverified toll-free numbers. **Until Twilio's Toll-Free Verification is approved for the number, production SMS will appear to send (Twilio reports `delivered`) but recipients will not receive them.** Submit the verification at **Console → Trust Hub → Toll-Free Verification**. Approval typically takes 1–3 weeks.

This is why `NOTIFICATIONS_ENABLED=true` alone is not enough to actually deliver SMS in production — the carrier path also has to be open.

---

## Resend Setup (Email)

Resend sends app-generated email — enrollment confirmations, admin alerts, low-enrollment warnings.

> Auth emails (signup confirmation, password reset) are sent by **Supabase Auth via Resend's SMTP relay**, not by this code path. SMTP wiring is configured in the Supabase Dashboard (see Pre-Launch Checklist in `docs/PROJECT_PLAN.md`).

### Required environment variables

```bash
RESEND_API_KEY=re_...
```

Get the key from **Resend Dashboard → API Keys**.

### Domain verification

Email is sent from `info@sailbook.live` (hardcoded as `FROM_DEFAULT` in `src/lib/notifications/resend.ts`). Before Resend will accept mail from that address, the domain must be verified:

1. **Resend Dashboard → Domains → Add Domain** → enter `sailbook.live`.
2. Resend shows DNS records (SPF, DKIM, optional DMARC). Add each one to Cloudflare → DNS for `sailbook.live`.
3. Wait for Resend to flip the domain to **Verified** (usually <10 min after DNS propagates).

Until the domain is verified, sends from `info@sailbook.live` will fail with `403 The domain is not verified`.

---

## Notifications gating

Both Twilio and Resend are gated by a single env var:

```bash
NOTIFICATIONS_ENABLED=true
```

- **`true`** — real sends through Twilio / Resend.
- **anything else (default)** — sends are intercepted into an in-memory mock buffer. Inspect via the dev-only test API at `GET /api/test/notifications`. This is the path Playwright tests use.

If `NOTIFICATIONS_ENABLED=true` but a provider's keys are missing, the dispatcher returns `{ ok: false, error: '... credentials not configured' }` and logs — nothing is thrown. Per-channel student/admin opt-outs (notification preferences) are checked before the dispatcher is called.

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
