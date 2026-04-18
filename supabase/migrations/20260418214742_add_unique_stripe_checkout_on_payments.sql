-- Make stripe_checkout_session_id unique on payments so concurrent webhook
-- deliveries for the same Stripe session cannot insert duplicate rows.
-- The existing idx_payments_checkout non-unique index is replaced by this constraint.
DROP INDEX IF EXISTS idx_payments_checkout;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_stripe_checkout_session_id_unique
  UNIQUE (stripe_checkout_session_id);
