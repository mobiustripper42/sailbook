'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import AddressFields, { EMPTY_ADDRESS, type AddressValue } from '@/components/shared/address-fields'
import { getMyAddress, updateMyAddress } from '@/actions/address'

/**
 * Collect/confirm the student's mailing address (#129). Opened by EnrollButton
 * when an ASA course needs an address before checkout. Pre-fills any existing
 * address so it reads as a confirmation; on save it calls onSaved so the caller
 * can retry the enrollment.
 */
export default function AddressDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [address, setAddress] = useState<AddressValue>(EMPTY_ADDRESS)

  // Pre-fill from the current profile when the dialog opens. Only overwrite
  // fields that actually have a value — a student hitting the ASA gate has no
  // address yet, and the async fetch must not clobber what they're already
  // typing.
  useEffect(() => {
    if (!open) return
    let active = true
    getMyAddress().then((addr) => {
      if (!active || !addr) return
      setAddress((prev) => ({
        line1: addr.address_line1 || prev.line1,
        line2: addr.address_line2 || prev.line2,
        city: addr.city || prev.city,
        state: addr.state || prev.state,
        postal: addr.postal_code || prev.postal,
      }))
    })
    return () => {
      active = false
    }
  }, [open])

  function handleSave() {
    setError(null)
    const formData = new FormData()
    formData.set('address_line1', address.line1)
    formData.set('address_line2', address.line2)
    formData.set('city', address.city)
    formData.set('state', address.state)
    formData.set('postal_code', address.postal)

    startTransition(async () => {
      const result = await updateMyAddress(formData)
      if (result.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
        onSaved()
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mailing address</AlertDialogTitle>
          <AlertDialogDescription>
            ASA courses include a textbook we ship to you. Confirm where it should go.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-2">
          <AddressFields value={address} onChange={setAddress} disabled={pending} required />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button onClick={handleSave} disabled={pending}>
            {pending ? 'Saving…' : 'Save & continue'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
