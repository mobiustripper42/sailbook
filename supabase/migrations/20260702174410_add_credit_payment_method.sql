-- #107 architect review: a fully-credit-covered checkout wrote no payments
-- row at all ("payments is a Stripe transaction log" — but DEC-025 already
-- established payments as the settlement record for every confirmed
-- enrollment regardless of rail: stripe/cash/check/venmo/stripe_manual all
-- get a row). Without one, a student who fully covers a course with credit
-- can't later have that enrollment refunded/credited — processRefund and
-- issueCredit both require a payments row with status='succeeded'
-- (src/actions/enrollments.ts) and find none. Add 'credit' as a payment_method
-- alongside the existing values; drop+recreate since CHECK constraints can't
-- be altered in place.
-- Look up the actual constraint name rather than assuming Postgres's default
-- naming — the original migration added it inline via ADD COLUMN ... CHECK,
-- so the auto-generated name isn't guaranteed.
DO $$
DECLARE
  existing_constraint text;
BEGIN
  SELECT con.conname INTO existing_constraint
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
  WHERE rel.relname = 'payments'
    AND att.attname = 'payment_method'
    AND con.contype = 'c';

  IF existing_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.payments DROP CONSTRAINT %I', existing_constraint);
  END IF;
END $$;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_payment_method_check
  CHECK (payment_method IN ('stripe', 'cash', 'check', 'venmo', 'stripe_manual', 'credit'));
