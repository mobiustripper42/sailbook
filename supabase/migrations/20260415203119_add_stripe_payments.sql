-- Phase 2.2: Stripe + payments schema
-- Adds stripe_customer_id to profiles, stripe_checkout_session_id to enrollments,
-- and a new payments table with RLS policies.

-- ============================================================
-- PROFILES: Stripe customer ID
-- Created on first checkout, reused for subsequent purchases.
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN stripe_customer_id TEXT;

-- ============================================================
-- ENROLLMENTS: Stripe Checkout Session ID
-- Set when a checkout session is created (2.3).
-- Used by the webhook (2.5) to match payment back to enrollment.
-- ============================================================
ALTER TABLE public.enrollments
  ADD COLUMN stripe_checkout_session_id TEXT;

-- ============================================================
-- PAYMENTS
-- Receipt log: one row per completed (or attempted) transaction.
-- student_id is denormalized from enrollment for efficient RLS.
-- Amounts in cents — no floating point money.
-- ============================================================
CREATE TABLE public.payments (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id               UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  student_id                  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_payment_intent_id    TEXT,
  stripe_checkout_session_id  TEXT,
  amount_cents                INT NOT NULL,
  currency                    TEXT NOT NULL DEFAULT 'usd',
  status                      TEXT NOT NULL DEFAULT 'pending',
    -- pending | succeeded | refunded | failed
  refund_amount_cents         INT,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_enrollment ON public.payments(enrollment_id);
CREATE INDEX idx_payments_student    ON public.payments(student_id);
CREATE INDEX idx_payments_checkout   ON public.payments(stripe_checkout_session_id);

-- ============================================================
-- RLS — PAYMENTS
-- ============================================================
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Admins: full access
CREATE POLICY "Admin full access on payments"
  ON public.payments
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = TRUE
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = TRUE
  );

-- Students: read own payments only
CREATE POLICY "Students read own payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());
