-- #106: Account credit ledger.
-- Admin can issue a student account credit instead of a cash refund when
-- cancelling an enrollment. One immutable row per event — issuance is a
-- positive amount_cents, a future redemption (#107) is negative. Balance is
-- always SUM(amount_cents) for the student, never a separately-stored
-- column that could drift out of sync.

CREATE TABLE public.credit_ledger (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_cents  INT NOT NULL,
    -- positive = credit issued, negative = credit redeemed (#107). Never zero.
  reason        TEXT,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
    -- The enrollment this credit originated from (issuance) or was applied
    -- to (future redemption). Nullable — the enrollment can later be
    -- deleted without losing the ledger's audit trail.
  issued_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    -- Admin who issued this credit. NULL for a system-generated redemption
    -- row (#107) with no issuing admin.
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT credit_ledger_amount_nonzero CHECK (amount_cents <> 0)
);

CREATE INDEX idx_credit_ledger_student ON public.credit_ledger(student_id);

-- ============================================================
-- RLS — CREDIT_LEDGER
-- ============================================================
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

-- Admins: issue credit + read all balances/history. INSERT + SELECT only —
-- deliberately no UPDATE/DELETE. The ledger's whole design premise is
-- immutable rows (balance = SUM, never a mutable column); granting write
-- access to existing rows would let a stray UPDATE silently rewrite
-- financial history with nothing to catch it.
CREATE POLICY "Admin insert credit_ledger"
  ON public.credit_ledger
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = TRUE
  );

CREATE POLICY "Admin read all credit_ledger"
  ON public.credit_ledger
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = TRUE
  );

-- Students: read their own ledger (balance + history) — no write access.
-- Credit is admin-initiated only; there is no student-facing "request
-- credit" action (#106 decision).
CREATE POLICY "Students read own credit_ledger"
  ON public.credit_ledger
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());
