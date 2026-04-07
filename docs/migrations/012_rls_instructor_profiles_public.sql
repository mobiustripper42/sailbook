-- Migration 012: Allow any authenticated user to read instructor profiles
-- ============================================================
-- Problem: students cannot read instructor profiles (migration 009 dropped the
-- broad "Authenticated users can read profiles" policy and only added
-- instructor→student access). Course detail pages show "—" for instructor name.
--
-- Fix: add a SELECT policy for profiles where is_instructor = true.
-- Instructor names are course-facing information — not sensitive.

CREATE POLICY "Anyone can read instructor profiles"
  ON profiles
  FOR SELECT
  USING (is_instructor = true);
