'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AddressFields, { type AddressValue } from '@/components/shared/address-fields'
import { updateStudentAccount } from '@/actions/profiles'
import type { MailingAddress } from '@/lib/address'

type ExperienceCode = {
  value: string
  label: string
  description: string | null
}

type Profile = {
  first_name: string
  last_name: string
  phone: string | null
  asa_number: string | null
  experience_level: string | null
  instructor_notes: string | null
}

/**
 * The whole Account page as one form with one Save (10.7). Profile, mailing
 * address, and notification preferences are sections, not separate forms —
 * every field posts to `updateStudentAccount` in a single submit.
 */
export default function StudentAccountForm({
  profile,
  address,
  initialPrefs,
  experienceCodes,
  smsEnabled = false,
}: {
  profile: Profile
  address: MailingAddress | null
  initialPrefs: { sms: boolean; email: boolean }
  experienceCodes: ExperienceCode[]
  smsEnabled?: boolean
}) {
  const [state, action, pending] = useActionState(updateStudentAccount, null)

  // DEC-015 form actions return `string | null` — null is success, string is
  // an error. Both null-on-success and null-on-mount look the same, so derive
  // a "just succeeded" flag from the pending → idle transition with state=null.
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const prevPending = useRef(false)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (prevPending.current && !pending) setHasSubmitted(true)
    prevPending.current = pending
  }, [pending])

  const showSuccess = hasSubmitted && state === null && !pending

  const [firstName, setFirstName] = useState(profile.first_name)
  const [lastName, setLastName] = useState(profile.last_name)
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [asaNumber, setAsaNumber] = useState(profile.asa_number ?? '')
  const [experienceLevel, setExperienceLevel] = useState(profile.experience_level ?? '')
  const [instructorNotes, setInstructorNotes] = useState(profile.instructor_notes ?? '')
  const [addressValue, setAddressValue] = useState<AddressValue>({
    line1: address?.address_line1 ?? '',
    line2: address?.address_line2 ?? '',
    city: address?.city ?? '',
    state: address?.state ?? '',
    postal: address?.postal_code ?? '',
  })
  const [sms, setSms] = useState(initialPrefs.sms)
  const [email, setEmail] = useState(initialPrefs.email)

  return (
    <form action={action} className="space-y-8 max-w-md">
      {state && <p className="text-sm text-destructive">{state}</p>}
      {showSuccess && <p className="text-sm text-primary">Account updated.</p>}

      <section className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="first_name">First name</Label>
            <Input
              id="first_name"
              name="first_name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last name</Label>
            <Input
              id="last_name"
              name="last_name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
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
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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
            value={asaNumber}
            onChange={(e) => setAsaNumber(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="experience_level">Sailing experience</Label>
          <select
            id="experience_level"
            name="experience_level"
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
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
            value={instructorNotes}
            onChange={(e) => setInstructorNotes(e.target.value)}
            className="flex w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            placeholder="Prior sailing experience, medical conditions, seasickness, etc."
          />
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Mailing address</h2>
          <p className="text-sm text-muted-foreground">
            Where we ship ASA course textbooks. Keep this current so your books reach you.
          </p>
        </div>
        <AddressFields value={addressValue} onChange={setAddressValue} disabled={pending} />
      </section>

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
      </section>

      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}
