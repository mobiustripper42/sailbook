'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type ExperienceCode = {
  value: string
  label: string
  description: string | null
}

export type AccountProfileValue = {
  firstName: string
  lastName: string
  phone: string
  asaNumber: string
  experienceLevel: string
  instructorNotes: string
}

/**
 * The profile half of the Account form. Split out of StudentAccountForm to keep
 * each piece under the 200-line component convention — it is not a form of its
 * own, the inputs post with the single parent submit.
 */
export default function AccountProfileFields({
  value,
  onChange,
  smsEnabled = false,
  experienceCodes,
}: {
  value: AccountProfileValue
  onChange: (next: AccountProfileValue) => void
  smsEnabled?: boolean
  experienceCodes: ExperienceCode[]
}) {
  const set = (patch: Partial<AccountProfileValue>) => onChange({ ...value, ...patch })

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="first_name">First name</Label>
          <Input
            id="first_name"
            name="first_name"
            required
            value={value.firstName}
            onChange={(e) => set({ firstName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last name</Label>
          <Input
            id="last_name"
            name="last_name"
            required
            value={value.lastName}
            onChange={(e) => set({ lastName: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          value={value.phone}
          onChange={(e) => set({ phone: e.target.value })}
        />
        {smsEnabled && (
          <p className="text-xs text-muted-foreground">
            By providing your phone number you consent to receive SMS messages from Learn to Sail Cleveland (Riverfront Marine) about your enrollment, session reminders, and cancellations. Msg frequency varies. Msg &amp; data rates may apply. Reply STOP to cancel, HELP for help.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="asa_number">ASA number</Label>
        <Input
          id="asa_number"
          name="asa_number"
          value={value.asaNumber}
          onChange={(e) => set({ asaNumber: e.target.value })}
          placeholder="Optional"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="experience_level">Sailing experience</Label>
        <select
          id="experience_level"
          name="experience_level"
          value={value.experienceLevel}
          onChange={(e) => set({ experienceLevel: e.target.value })}
          className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Select experience level</option>
          {experienceCodes.map((code) => (
            <option key={code.value} value={code.value}>
              {code.description ? `${code.label} — ${code.description}` : code.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructor_notes">
          Note for your instructor{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <textarea
          id="instructor_notes"
          name="instructor_notes"
          rows={4}
          value={value.instructorNotes}
          onChange={(e) => set({ instructorNotes: e.target.value })}
          className="flex w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          placeholder="Prior sailing experience, medical conditions, seasickness, etc."
        />
      </div>
    </section>
  )
}
