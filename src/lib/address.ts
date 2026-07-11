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
