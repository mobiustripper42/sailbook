-- #106: allow 'credited' as a payments.status value — set when an admin
-- issues account credit (credit_ledger) instead of a cash refund. Drop +
-- recreate since Postgres CHECK constraints can't be altered in place.
ALTER TABLE public.payments
  DROP CONSTRAINT payments_status_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_status_check
  CHECK (status IN ('pending', 'succeeded', 'refunded', 'failed', 'credited'));
