'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  ADMIN_NOTIFICATION_EVENTS,
  type AdminNotificationPreferences,
} from '@/lib/notifications/preferences'

/**
 * Updates the calling admin's own notification_preferences row. Validates the
 * shape so a malformed FormData payload can't write garbage into the JSON
 * column.
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

  // Each event/channel arrives as a checkbox name; absence = false.
  const prefs: AdminNotificationPreferences = {}
  for (const event of ADMIN_NOTIFICATION_EVENTS) {
    prefs[event] = {
      sms: formData.get(`${event}__sms`) === 'on',
      email: formData.get(`${event}__email`) === 'on',
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ notification_preferences: prefs })
    .eq('id', user.id)

  if (error) return error.message

  revalidatePath('/admin/notification-preferences')
  return null
}
