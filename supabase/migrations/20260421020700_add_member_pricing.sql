-- Phase 2.9: Member pricing
-- Adds member_price to courses (optional lower price for Simply Sailing members)
-- and is_member to profiles (admin-controlled flag).
-- Checkout picks member_price when the student is a member and member_price is set.

ALTER TABLE public.courses
  ADD COLUMN member_price numeric(10,2);

ALTER TABLE public.profiles
  ADD COLUMN is_member boolean NOT NULL DEFAULT false;
