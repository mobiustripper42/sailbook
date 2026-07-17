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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

  const [line1, setLine1] = useState('')
  const [line2, setLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postal, setPostal] = useState('')

  // Pre-fill from the current profile when the dialog opens. Only set fields
  // that actually have a value — a student hitting the ASA gate has no address
  // yet, and the async fetch must not clobber what they're already typing.
  useEffect(() => {
    if (!open) return
    let active = true
    getMyAddress().then((addr) => {
      if (!active || !addr) return
      if (addr.address_line1) setLine1(addr.address_line1)
      if (addr.address_line2) setLine2(addr.address_line2)
      if (addr.city) setCity(addr.city)
      if (addr.state) setState(addr.state)
      if (addr.postal_code) setPostal(addr.postal_code)
    })
    return () => {
      active = false
    }
  }, [open])

  function handleSave() {
    setError(null)
    const formData = new FormData()
    formData.set('address_line1', line1)
    formData.set('address_line2', line2)
    formData.set('city', city)
    formData.set('state', state)
    formData.set('postal_code', postal)

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
          <div className="space-y-1">
            <Label htmlFor="address_line1">Street address</Label>
            <Input id="address_line1" value={line1} onChange={(e) => setLine1(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="address_line2">
              Apt/Unit <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input id="address_line2" value={line2} onChange={(e) => setLine2(e.target.value)} />
          </div>
          <div className="grid grid-cols-[1fr_auto_auto] gap-2">
            <div className="space-y-1">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                maxLength={2}
                className="w-16"
                placeholder="OH"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="postal_code">ZIP</Label>
              <Input id="postal_code" value={postal} onChange={(e) => setPostal(e.target.value)} className="w-24" required />
            </div>
          </div>
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
