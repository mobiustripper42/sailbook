'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateStudentProfile } from '@/actions/profiles'

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

export default function StudentAccountForm({
  profile,
  experienceCodes,
}: {
  profile: Profile
  experienceCodes: ExperienceCode[]
}) {
  const [state, action, pending] = useActionState(updateStudentProfile, null)

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

  return (
    <form action={action} className="space-y-5 max-w-md">
      {state && <p className="text-sm text-destructive">{state}</p>}
      {showSuccess && <p className="text-sm text-primary">Profile updated.</p>}

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
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          By providing your phone number you consent to receive SMS messages from Learn to Sail Cleveland (Riverfront Marine) about your enrollment, session reminders, and cancellations. Msg frequency varies. Msg &amp; data rates may apply. Reply STOP to cancel, HELP for help.
        </p>
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

      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}
