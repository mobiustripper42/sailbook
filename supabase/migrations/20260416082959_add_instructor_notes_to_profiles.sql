-- Add instructor_notes field to profiles
-- Students use this to share context with their instructor ("Anything you want an instructor to know?")

ALTER TABLE public.profiles
  ADD COLUMN instructor_notes text;
