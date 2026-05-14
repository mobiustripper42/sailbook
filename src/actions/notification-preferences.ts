'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  ADMIN_NOTIFICATION_EVENTS,
  STUDENT_GLOBAL_KEY,
  isSMSEnabled,
  type AdminNotificationPreferences,
  type StudentNotificationPreferences,
} from '@/lib/notifications/preferences'

// Read the existing JSONB value for the calling user. Used by the merge-and-
// write actions below so we never clobber the other role's preferences on a
// dual-role (admin + student) profile.
async function readExistingPrefs(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
): Promise<Record<string, unknown>> {
  const { data } = await supabase
    .from('profiles')
    .select('notification_preferences')
    .eq('id', userId)
    .maybeSingle()
  const existing = data?.notification_preferences
  return existing && typeof existing === 'object' ? { ...existing } : {}
}

/**
 * Updates the calling admin's own notification_preferences row. Validates the
 * shape so a malformed FormData payload can't write garbage into the JSON
 * column. Merges with existing JSONB so a dual-role (admin + student) profile
 * keeps its student_global block when the admin form saves.
 *
 * Returns `string | null` (form-action convention from DEC-015): null on
 * success, error message otherwise.
 */
export async function updateAdminNotificationPreferences(
  _: unknown,
  formData: FormData,
): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'Not authenticated.'

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.is_admin) return 'Unauthorized.'

  const existing = await readExistingPrefs(supabase, user.id)
  const smsEnabled = isSMSEnabled()

  // Each event/channel arrives as a checkbox name; absence = false.
  // When SMS is globally disabled, the SMS checkbox isn't rendered — preserve
  // the user's prior sms preference so it isn't silently wiped.
  const adminBlock: AdminNotificationPreferences = {}
  for (const event of ADMIN_NOTIFICATION_EVENTS) {
    const existingEvent = (existing[event] as { sms?: boolean } | undefined) ?? {}
    adminBlock[event] = {
      sms: smsEnabled
        ? formData.get(`${event}__sms`) === 'on'
        : existingEvent.sms ?? true,
      email: formData.get(`${event}__email`) === 'on',
    }
  }

  const merged = { ...existing, ...adminBlock }

  const { error } = await supabase
    .from('profiles')
    .update({ notification_preferences: merged })
    .eq('id', user.id)

  if (error) return error.message

  revalidatePath('/admin/notification-preferences')
  return null
}

/**
 * Updates the calling student's own notification preferences. Single global
 * { sms, email } block keyed under STUDENT_GLOBAL_KEY. Merges with existing
 * JSONB so admin keys on dual-role profiles aren't wiped.
 *
 * Returns `string | null` per DEC-015.
 */
export async function updateStudentNotificationPreferences(
  _: unknown,
  formData: FormData,
): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'Not authenticated.'

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_student')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.is_student) return 'Unauthorized.'

  const existing = await readExistingPrefs(supabase, user.id)
  const smsEnabled = isSMSEnabled()
  const existingStudent = (existing[STUDENT_GLOBAL_KEY] as { sms?: boolean } | undefined) ?? {}

  const studentBlock: StudentNotificationPreferences = {
    [STUDENT_GLOBAL_KEY]: {
      sms: smsEnabled
        ? formData.get('student_sms') === 'on'
        : existingStudent.sms ?? true,
      email: formData.get('student_email') === 'on',
    },
  }

  const merged = { ...existing, ...studentBlock }

  const { error } = await supabase
    .from('profiles')
    .update({ notification_preferences: merged })
    .eq('id', user.id)

  if (error) return error.message

  revalidatePath('/student/account')
  return null
}
