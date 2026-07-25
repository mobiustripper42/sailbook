'use client'

import { Label } from '@/components/ui/label'

/**
 * The notifications half of the Account form. Checkboxes only — they post with
 * the single parent submit, not a form of their own.
 */
export default function AccountNotificationFields({
  sms,
  email,
  onChange,
  smsEnabled = false,
}: {
  sms: boolean
  email: boolean
  onChange: (next: { sms: boolean; email: boolean }) => void
  smsEnabled?: boolean
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Notifications</h2>
        <p className="text-sm text-muted-foreground">
          Choose how you hear about enrollments, cancellations, makeups, and reminders.
        </p>
      </div>

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
              onChange={(e) => onChange({ sms: e.target.checked, email })}
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
            onChange={(e) => onChange({ sms, email: e.target.checked })}
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
    </section>
  )
}
