-- Add CHECK constraint on payments.status to enforce valid values.
-- Values: pending (checkout initiated), succeeded (payment confirmed),
--         refunded (full or partial refund issued), failed (payment failed).
ALTER TABLE public.payments
  ADD CONSTRAINT payments_status_check
  CHECK (status IN ('pending', 'succeeded', 'refunded', 'failed'));
