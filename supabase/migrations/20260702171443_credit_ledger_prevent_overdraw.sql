-- #107 code review: two concurrent createCheckoutSession/webhook calls for
-- the SAME student on DIFFERENT courses can both read the same balance
-- before either commits its redemption row (classic TOCTOU), letting the
-- student redeem more credit than they actually have. An application-level
-- read-then-write can't close this race under READ COMMITTED — a trigger
-- with an advisory lock can: it serializes concurrent inserts for the same
-- student, so the second transaction re-reads the balance AFTER the first
-- commits, not before.
CREATE OR REPLACE FUNCTION public.credit_ledger_prevent_overdraw()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_balance INT;
BEGIN
  -- Serializes concurrent inserts for the same student within this
  -- transaction's lifetime — released automatically on commit/rollback.
  PERFORM pg_advisory_xact_lock(hashtext(NEW.student_id::text));

  SELECT COALESCE(SUM(amount_cents), 0) INTO current_balance
  FROM public.credit_ledger
  WHERE student_id = NEW.student_id;

  IF current_balance + NEW.amount_cents < 0 THEN
    RAISE EXCEPTION 'credit_ledger: insufficient balance for student % (balance % cents, attempted % cents)',
      NEW.student_id, current_balance, NEW.amount_cents;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_credit_ledger_prevent_overdraw
  BEFORE INSERT ON public.credit_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.credit_ledger_prevent_overdraw();
