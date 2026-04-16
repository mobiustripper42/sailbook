-- Change theme_preference column default from 'dark' to 'system'
-- New users will follow their OS preference by default.
-- Existing users retain their stored preference (no rows updated).
ALTER TABLE public.profiles
  ALTER COLUMN theme_preference SET DEFAULT 'system';
