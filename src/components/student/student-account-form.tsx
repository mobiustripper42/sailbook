'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import AddressFields, { type AddressValue } from '@/components/shared/address-fields'
import AccountProfileFields, {
  type AccountProfileValue,
  type ExperienceCode,
} from '@/components/student/account-profile-fields'
import AccountNotificationFields from '@/components/student/account-notification-fields'
import { updateStudentAccount } from '@/actions/profiles'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'
import type { MailingAddress } from '@/lib/address'

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
 * every field posts to `updateStudentAccount` in a single submit. This shell
 * owns the action state and the submit button; the sections are dumb inputs.
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
  const [isDirty, setIsDirty] = useState(false)
  const prevPending = useRef(false)
  useEffect(() => {
    if (prevPending.current && !pending) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasSubmitted(true)
      // Unlike the admin forms, Account stays put after a save — clear the
      // guard here or it would warn about changes already written.
      if (state === null) setIsDirty(false)
    }
    prevPending.current = pending
  }, [pending, state])

  useUnsavedChanges(isDirty)

  const showSuccess = hasSubmitted && state === null && !pending

  const [profileValue, setProfileValue] = useState<AccountProfileValue>({
    firstName: profile.first_name,
    lastName: profile.last_name,
    phone: profile.phone ?? '',
    asaNumber: profile.asa_number ?? '',
    experienceLevel: profile.experience_level ?? '',
    instructorNotes: profile.instructor_notes ?? '',
  })
  const [addressValue, setAddressValue] = useState<AddressValue>({
    line1: address?.address_line1 ?? '',
    line2: address?.address_line2 ?? '',
    city: address?.city ?? '',
    state: address?.state ?? '',
    postal: address?.postal_code ?? '',
  })
  const [prefs, setPrefs] = useState(initialPrefs)

  return (
    <form action={action} onChange={() => setIsDirty(true)} className="space-y-8 max-w-md">
      {state && <p className="text-sm text-destructive">{state}</p>}
      {showSuccess && <p className="text-sm text-primary">Account updated.</p>}

      <AccountProfileFields
        value={profileValue}
        onChange={setProfileValue}
        smsEnabled={smsEnabled}
        experienceCodes={experienceCodes}
      />

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Mailing address</h2>
          <p className="text-sm text-muted-foreground">
            Where we ship ASA course textbooks. Keep this current so your books reach you.
          </p>
        </div>
        <AddressFields value={addressValue} onChange={setAddressValue} disabled={pending} />
      </section>

      <AccountNotificationFields
        sms={prefs.sms}
        email={prefs.email}
        onChange={setPrefs}
        smsEnabled={smsEnabled}
      />

      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}
