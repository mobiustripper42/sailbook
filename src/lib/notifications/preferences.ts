// 3.8/3.9 — Admin and student notification preferences.
//
// Per-recipient channel toggles stored as a JSONB column on profiles. Read
// at per-recipient fan-out time inside the trigger functions.
//
// Default is "all enabled" — null/undefined/missing keys are treated as
// permission. This is intentional: accidentally muting a recipient is worse
// than accidentally sending. Corrupted JSONB defaults to "send" too.
// Existing recipients who never visit the preferences page keep getting
// everything they were getting before.

export const ADMIN_NOTIFICATION_EVENTS = [
  'admin_enrollment_alert',
  'admin_low_enrollment',
] as const

export type AdminNotificationEvent = (typeof ADMIN_NOTIFICATION_EVENTS)[number]
export type NotificationChannel = 'sms' | 'email'

export type AdminNotificationPreferences = {
  [K in AdminNotificationEvent]?: {
    sms?: boolean
    email?: boolean
  }
}

/**
 * Returns true if the channel for the event is enabled. Defaults to true
 * for any unset path — admins who have never opened the preferences page
 * keep getting everything.
 *
 * Accepts `unknown` (the JSONB shape from Supabase) and validates defensively
 * so a malformed value never throws inside the dispatcher.
 */
export function isAdminChannelEnabled(
  prefs: unknown,
  event: AdminNotificationEvent,
  channel: NotificationChannel,
): boolean {
  if (!prefs || typeof prefs !== 'object') return true
  const eventPrefs = (prefs as Record<string, unknown>)[event]
  if (!eventPrefs || typeof eventPrefs !== 'object') return true
  const channelPref = (eventPrefs as Record<string, unknown>)[channel]
  if (typeof channelPref !== 'boolean') return true
  return channelPref
}

/**
 * Normalizes the stored value into a fully-populated shape with explicit
 * booleans for every event × channel. Used by the preferences UI so the
 * form always renders deterministic checkbox state, regardless of what's
 * in the DB.
 */
export function normalizeAdminPreferences(
  prefs: unknown,
): Record<AdminNotificationEvent, { sms: boolean; email: boolean }> {
  const out = {} as Record<AdminNotificationEvent, { sms: boolean; email: boolean }>
  for (const event of ADMIN_NOTIFICATION_EVENTS) {
    out[event] = {
      sms: isAdminChannelEnabled(prefs, event, 'sms'),
      email: isAdminChannelEnabled(prefs, event, 'email'),
    }
  }
  return out
}

// ─── 3.9 — Student global channel preferences ──────────────────────────────
//
// Students get a single global toggle per channel rather than the admin's
// per-event matrix. Spec calls for SMS opt-out / email-only — applied
// uniformly across enrollment confirmations, cancellation notices, makeup
// assignments, and session reminders.

export const STUDENT_GLOBAL_KEY = 'student_global'

export type StudentNotificationPreferences = {
  [STUDENT_GLOBAL_KEY]?: {
    sms?: boolean
    email?: boolean
  }
}

/**
 * Returns true if the channel is enabled for student-facing notifications.
 * Same defensive defaults as the admin helper — any non-boolean / missing
 * value falls through to true.
 */
export function isStudentChannelEnabled(
  prefs: unknown,
  channel: NotificationChannel,
): boolean {
  if (!prefs || typeof prefs !== 'object') return true
  const block = (prefs as Record<string, unknown>)[STUDENT_GLOBAL_KEY]
  if (!block || typeof block !== 'object') return true
  const channelPref = (block as Record<string, unknown>)[channel]
  if (typeof channelPref !== 'boolean') return true
  return channelPref
}

/**
 * Normalizes the student block to a deterministic { sms, email } shape for
 * the form's initial checkbox state.
 */
export function normalizeStudentPreferences(
  prefs: unknown,
): { sms: boolean; email: boolean } {
  return {
    sms: isStudentChannelEnabled(prefs, 'sms'),
    email: isStudentChannelEnabled(prefs, 'email'),
  }
}
