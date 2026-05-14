import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isSMSEnabled, normalizeAdminPreferences } from '@/lib/notifications/preferences'
import NotificationPreferencesForm from '@/components/admin/notification-preferences-form'

export const dynamic = 'force-dynamic'

export default async function NotificationPreferencesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, notification_preferences')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.is_admin) redirect('/login')

  const initialPrefs = normalizeAdminPreferences(profile.notification_preferences)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Notification preferences</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose which alerts reach you and through which channels. Defaults to all on.
        </p>
      </div>

      <NotificationPreferencesForm initialPrefs={initialPrefs} smsEnabled={isSMSEnabled()} />
    </div>
  )
}
