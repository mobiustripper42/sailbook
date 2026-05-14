import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudentAccountForm from '@/components/student/student-account-form'
import NotificationPreferencesSection from '@/components/student/notification-preferences-section'
import { isSMSEnabled, normalizeStudentPreferences } from '@/lib/notifications/preferences'

export const metadata = { title: 'SailBook — Account' }

export default async function StudentAccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: codes }] = await Promise.all([
    supabase
      .from('profiles')
      .select('first_name, last_name, phone, asa_number, experience_level, instructor_notes, notification_preferences')
      .eq('id', user.id)
      .single(),
    supabase
      .from('codes')
      .select('value, label, description')
      .eq('category', 'experience_level')
      .eq('is_active', true)
      .order('sort_order'),
  ])

  if (!profile) redirect('/login')

  const initialNotifPrefs = normalizeStudentPreferences(profile.notification_preferences)

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="text-sm text-muted-foreground">
          Update your name, contact info, and sailing background.
        </p>
      </div>

      <StudentAccountForm
        profile={profile}
        experienceCodes={codes ?? []}
        smsEnabled={isSMSEnabled()}
      />

      <NotificationPreferencesSection initialPrefs={initialNotifPrefs} smsEnabled={isSMSEnabled()} />
    </div>
  )
}
