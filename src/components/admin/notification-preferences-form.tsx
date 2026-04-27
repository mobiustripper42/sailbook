'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { updateAdminNotificationPreferences } from '@/actions/notification-preferences'
import type { AdminNotificationEvent } from '@/lib/notifications/preferences'

type NormalizedPrefs = Record<AdminNotificationEvent, { sms: boolean; email: boolean }>

const EVENT_LABELS: Record<AdminNotificationEvent, { title: string; description: string }> = {
  admin_enrollment_alert: {
    title: 'New enrollment alert',
    description: 'Sent when a student finishes payment and confirms their seat in a course.',
  },
  admin_low_enrollment: {
    title: 'Low enrollment warning',
    description: 'Daily reminder for any active course under half-full within 14 days of its first session.',
  },
}

export default function NotificationPreferencesForm({
  initialPrefs,
}: {
  initialPrefs: NormalizedPrefs
}) {
  const [state, action, pending] = useActionState(
    updateAdminNotificationPreferences,
    null,
  )

  return (
    <form action={action} className="space-y-6 max-w-xl">
      {state && <p className="text-sm text-destructive">{state}</p>}

      {(Object.keys(EVENT_LABELS) as AdminNotificationEvent[]).map((event) => {
        const labels = EVENT_LABELS[event]
        const prefs = initialPrefs[event]
        return (
          <fieldset key={event} className="space-y-2 rounded-md border p-4">
            <legend className="px-1 text-sm font-medium">{labels.title}</legend>
            <p className="text-xs text-muted-foreground">{labels.description}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
              <Label
                htmlFor={`${event}__sms`}
                className="flex items-center gap-2 text-sm font-normal cursor-pointer"
              >
                <input
                  id={`${event}__sms`}
                  name={`${event}__sms`}
                  type="checkbox"
                  defaultChecked={prefs.sms}
                  className="size-4 rounded border-input accent-primary"
                />
                SMS
              </Label>
              <Label
                htmlFor={`${event}__email`}
                className="flex items-center gap-2 text-sm font-normal cursor-pointer"
              >
                <input
                  id={`${event}__email`}
                  name={`${event}__email`}
                  type="checkbox"
                  defaultChecked={prefs.email}
                  className="size-4 rounded border-input accent-primary"
                />
                Email
              </Label>
            </div>
          </fieldset>
        )
      })}

      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save preferences'}
      </Button>
    </form>
  )
}
