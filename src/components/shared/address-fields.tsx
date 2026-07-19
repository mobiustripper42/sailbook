'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type AddressValue = {
  line1: string
  line2: string
  city: string
  state: string
  postal: string
}

export const EMPTY_ADDRESS: AddressValue = { line1: '', line2: '', city: '', state: '', postal: '' }

/**
 * The five mailing-address inputs (#129/#150), shared by the ASA-enroll dialog,
 * the student account page, and the admin edit form so they can't drift.
 * Controlled — the parent owns the value — but each input also carries a `name`
 * so the values submit natively inside a `<form action>`. State is coerced to a
 * 2-letter uppercase abbreviation as the user types.
 */
export default function AddressFields({
  value,
  onChange,
  disabled = false,
  required = false,
}: {
  value: AddressValue
  onChange: (next: AddressValue) => void
  disabled?: boolean
  // Applies native `required` to line1/city/state/ZIP (line2 stays optional) so
  // required-path callers get instant browser validation. Server-side
  // validateAddressInput enforces it regardless.
  required?: boolean
}) {
  const set = (patch: Partial<AddressValue>) => onChange({ ...value, ...patch })

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="address_line1">Street address</Label>
        <Input
          id="address_line1"
          name="address_line1"
          autoComplete="address-line1"
          value={value.line1}
          onChange={(e) => set({ line1: e.target.value })}
          disabled={disabled}
          required={required}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="address_line2">
          Apt/Unit <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="address_line2"
          name="address_line2"
          autoComplete="address-line2"
          value={value.line2}
          onChange={(e) => set({ line2: e.target.value })}
          disabled={disabled}
        />
      </div>
      <div className="grid grid-cols-[1fr_auto_auto] gap-2">
        <div className="space-y-1">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            autoComplete="address-level2"
            value={value.city}
            onChange={(e) => set({ city: e.target.value })}
            disabled={disabled}
            required={required}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            name="state"
            autoComplete="address-level1"
            value={value.state}
            onChange={(e) => set({ state: e.target.value.toUpperCase() })}
            maxLength={2}
            className="w-16"
            placeholder="OH"
            disabled={disabled}
            required={required}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="postal_code">ZIP</Label>
          <Input
            id="postal_code"
            name="postal_code"
            autoComplete="postal-code"
            value={value.postal}
            onChange={(e) => set({ postal: e.target.value })}
            className="w-24"
            disabled={disabled}
            required={required}
          />
        </div>
      </div>
    </div>
  )
}
