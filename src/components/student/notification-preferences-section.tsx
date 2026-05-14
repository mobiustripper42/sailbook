'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { updateStudentNotificationPreferences } from '@/actions/notification-preferences'

type Prefs = { sms: boolean; email: boolean }

export default function NotificationPreferencesSection({
  initialPrefs,
  smsEnabled = false,
}: {
  initialPrefs: Prefs
  smsEnabled?: boolean
}) {
  const [state, action, pending] = useActionState(
    updateStudentNotificationPreferences,
    null,
  )
  const [sms, setSms] = useState(initialPrefs.sms)
  const [email, setEmail] = useState(initialPrefs.email)

  // Same DEC-015 pattern as the profile form: derive a transient success
  // banner from the pending → idle transition with state=null.
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const prevPending = useRef(false)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (prevPending.current && !pending) setHasSubmitted(true)
    prevPending.current = pending
  }, [pending])

  const showSuccess = hasSubmitted && state === null && !pending

  return (
    <form action={action} className="space-y-4 max-w-md">
      <div>
        <h2 className="text-lg font-semibold">Notifications</h2>
        <p className="text-sm text-muted-foreground">
          Choose how you hear about enrollments, cancellations, makeups, and reminders.
        </p>
      </div>

      {state && <p className="text-sm text-destructive">{state}</p>}
      {showSuccess && <p className="text-sm text-primary">Preferences saved.</p>}

      <div className="space-y-2 rounded-md border p-4">
        {smsEnabled && (
          <Label
            htmlFor="student_sms"
            className="flex items-center gap-2 text-sm font-normal cursor-pointer"
          >
            <input
              id="student_sms"
              name="student_sms"
              type="checkbox"
              checked={sms}
              onChange={(e) => setSms(e.target.checked)}
              className="size-4 rounded border-input accent-primary"
            />
            Receive SMS notifications
          </Label>
        )}
        <Label
          htmlFor="student_email"
          className="flex items-center gap-2 text-sm font-normal cursor-pointer"
        >
          <input
            id="student_email"
            name="student_email"
            type="checkbox"
            checked={email}
            onChange={(e) => setEmail(e.target.checked)}
            className="size-4 rounded border-input accent-primary"
          />
          Receive email notifications
        </Label>
        {!smsEnabled && (
          <p className="text-xs text-muted-foreground pt-1">
            Email only for now — SMS is coming later.
          </p>
        )}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save preferences'}
      </Button>
    </form>
  )
}
