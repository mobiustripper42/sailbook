-- Phase 2.3: Enrollment hold for pessimistic inventory
-- Adds hold_expires_at to track when a pending_payment spot reservation expires.
-- The 'pending_payment' status is a new value — existing RPCs already exclude it
-- correctly (they count status != 'cancelled', so holds count against capacity).

ALTER TABLE public.enrollments
  ADD COLUMN hold_expires_at TIMESTAMPTZ;
