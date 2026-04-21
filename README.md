# SailBook

Scheduling, enrollment, and payment management for Learn To Sail Cleveland.

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

## Running Tests

```bash
# Reset DB and run all tests
supabase db reset && npx playwright test

# Single file
npx playwright test tests/foo.spec.ts

# pgTAP (RLS tests)
supabase test db
```
