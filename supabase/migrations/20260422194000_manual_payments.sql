-- Phase 4.4b: Manual payment path for admin-initiated enrollment (DEC-025)
-- Admin can enroll students and record cash/check/venmo/other payments
-- without going through Stripe Checkout.

-- payment_method distinguishes Stripe payments from manual ones.
ALTER TABLE public.payments
  ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'stripe'
  CHECK (payment_method IN ('stripe', 'cash', 'check', 'venmo', 'stripe_manual'));

-- Replace the unconditional UNIQUE constraint with a partial one.
-- NULL stripe_checkout_session_id is allowed for manual payments;
-- non-NULL values must still be unique (prevents duplicate webhook delivery).
ALTER TABLE public.payments
  DROP CONSTRAINT payments_stripe_checkout_session_id_unique;

CREATE UNIQUE INDEX payments_stripe_session_unique
  ON public.payments (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;
