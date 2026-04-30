-- 3.8 — Admin notification preferences
--
-- Stores per-admin preferences for which notification events should reach
-- which channels. JSONB on profiles (not a separate table) because:
--   - admin count is small (1-3), no query/filter need
--   - prefs are read at per-recipient fan-out time (already a profile read)
--   - existing RLS on profiles covers self-edit; no new policies needed
--   - additive: future event types just extend the shape
--
-- Shape (all keys optional — null/undefined means "enabled"):
--   {
--     admin_enrollment_alert: { sms?: boolean, email?: boolean },
--     admin_low_enrollment:   { sms?: boolean, email?: boolean }
--   }
--
-- Default NULL — app-side fallback treats every channel as enabled.
-- This preserves the current behavior for existing admins.

ALTER TABLE public.profiles
  ADD COLUMN notification_preferences jsonb;

COMMENT ON COLUMN public.profiles.notification_preferences IS
  'Per-admin notification channel toggles (3.8). Null/missing keys = enabled.';
