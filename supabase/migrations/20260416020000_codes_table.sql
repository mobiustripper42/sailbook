-- Generic codes/lookup table (DEC-021)
-- Source of truth for all dropdown/lookup values across the app.
-- First use: experience levels (category = 'experience_level').
-- Reusable for: qualification types, prereq names, skill names, etc.

CREATE TABLE public.codes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  category    text        NOT NULL,
  value       text        NOT NULL,
  label       text        NOT NULL,
  description text,
  sort_order  integer     NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category, value)
);

-- Anyone (including unauthenticated) can read active codes.
-- Needed because the register page is public and shows experience level options.
ALTER TABLE public.codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "codes_select_active"
  ON public.codes FOR SELECT
  USING (is_active = true);

CREATE POLICY "codes_admin_all"
  ON public.codes FOR ALL
  TO authenticated
  USING (
    ((auth.jwt() -> 'user_metadata') ->> 'is_admin') = 'true'
  )
  WITH CHECK (
    ((auth.jwt() -> 'user_metadata') ->> 'is_admin') = 'true'
  );

-- Seed: experience levels
INSERT INTO public.codes (category, value, label, description, sort_order) VALUES
  ('experience_level', 'beginner',     'Beginner',     'Little or no sailing experience',     10),
  ('experience_level', 'intermediate', 'Intermediate', 'Some sailing experience',              20),
  ('experience_level', 'advanced',     'Advanced',               'Confident on the water',                30);
