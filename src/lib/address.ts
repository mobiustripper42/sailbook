// Mailing address shared types + completeness check (#129). Address is stored on
// `profiles`; it's required only where enforced (the ASA-enrollment gate), so the
// DB columns are nullable and this helper decides "complete enough to ship to."

export type MailingAddress = {
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
}

/**
 * A mailing address is shippable when line 1, city, state, and postal code are
 * all present. Line 2 is optional. Whitespace-only values don't count.
 */
export function hasCompleteMailingAddress(addr: Partial<MailingAddress> | null | undefined): boolean {
  if (!addr) return false
  return Boolean(
    addr.address_line1?.trim() &&
      addr.city?.trim() &&
      addr.state?.trim() &&
      addr.postal_code?.trim(),
  )
}

// Trimmed form values, keyed to the <AddressFields> input names. Shared by the
// self-service (updateMyAddress) and admin (updateUserProfile) write paths so
// they parse + validate identically.
export type AddressInput = {
  line1: string
  line2: string
  city: string
  state: string
  postal: string
}

export function readAddressForm(formData: FormData): AddressInput {
  return {
    line1: (formData.get('address_line1') as string)?.trim() || '',
    line2: (formData.get('address_line2') as string)?.trim() || '',
    city: (formData.get('city') as string)?.trim() || '',
    state: (formData.get('state') as string)?.trim().toUpperCase() || '',
    postal: (formData.get('postal_code') as string)?.trim() || '',
  }
}

/**
 * Validate a parsed address. Returns an error string, or null if valid.
 * With `required: false`, a fully-empty address is allowed (returns null) so the
 * caller can store nulls — used on the admin path where address is optional.
 * Any partially-filled address must still be complete.
 */
export function validateAddressInput(a: AddressInput, opts?: { required?: boolean }): string | null {
  const required = opts?.required ?? true
  const anyFilled = Boolean(a.line1 || a.line2 || a.city || a.state || a.postal)
  if (!required && !anyFilled) return null
  if (!a.line1 || !a.city || !a.state || !a.postal) {
    return 'Street address, city, state, and ZIP are required.'
  }
  if (a.state.length !== 2) {
    return 'State must be a 2-letter abbreviation (e.g. OH).'
  }
  return null
}

/** Map a parsed address to the profiles column shape. Empty → nulls. */
export function addressInputToColumns(a: AddressInput): MailingAddress {
  const anyFilled = Boolean(a.line1 || a.line2 || a.city || a.state || a.postal)
  if (!anyFilled) {
    return { address_line1: null, address_line2: null, city: null, state: null, postal_code: null }
  }
  return {
    address_line1: a.line1,
    address_line2: a.line2 || null,
    city: a.city,
    state: a.state,
    postal_code: a.postal,
  }
}
