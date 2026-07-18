'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import AddressFields, { type AddressValue } from '@/components/shared/address-fields'
import { updateMyAddress } from '@/actions/address'
import type { MailingAddress } from '@/lib/address'

/**
 * Student self-service mailing-address editor (#150). The same address collected
 * at ASA enrollment, now viewable + editable from the account page. Submits to
 * the existing `updateMyAddress` action (self-scoped, RLS-enforced).
 */
export default function MailingAddressForm({ initial }: { initial: MailingAddress | null }) {
  const [address, setAddress] = useState<AddressValue>({
    line1: initial?.address_line1 ?? '',
    line2: initial?.address_line2 ?? '',
    city: initial?.city ?? '',
    state: initial?.state ?? '',
    postal: initial?.postal_code ?? '',
  })
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function handleSubmit(formData: FormData) {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await updateMyAddress(formData)
      if (result.error) setError(result.error)
      else setSaved(true)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4 max-w-md">
      <p className="text-sm text-muted-foreground">
        Where we ship ASA course textbooks. Keep this current so your books reach you.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm text-primary">Address updated.</p>}
      <AddressFields value={address} onChange={setAddress} disabled={pending} required />
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save address'}
      </Button>
    </form>
  )
}
