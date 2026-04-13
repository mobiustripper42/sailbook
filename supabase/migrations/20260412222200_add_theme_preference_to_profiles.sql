-- Add theme_preference to profiles
-- Stores user's preferred color scheme, synced across devices.
-- Default 'dark' matches SailBook brand direction (dark-mode-first).

ALTER TABLE public.profiles
  ADD COLUMN theme_preference text NOT NULL DEFAULT 'dark'
  CHECK (theme_preference IN ('light', 'dark', 'system'));
