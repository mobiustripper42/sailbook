// Drop-in deposit config (DEC-027 drop-in model). Server-only env — read in the
// student course-detail page (alert) and the checkout server action (charge).
//
//   DROP_IN_DEPOSIT     dollar amount collected up front, e.g. "20"
//   DROP_IN_ALERT_TEXT  student-facing copy with a {DROP_IN_DEPOSIT} token
//
// A drop-in course advertises its full (admin-set) price but only collects this
// flat deposit at checkout — no member discount. The balance is paid to the
// captain on the day.

const DEFAULT_ALERT_TEXT =
  'Pay {DROP_IN_DEPOSIT} now to reserve your spot. The remaining balance is paid to the captain on the day.'

/** Parsed deposit in dollars, or `null` if unset/invalid (≤0, NaN, blank). */
export function getDropInDeposit(): number | null {
  const raw = process.env.DROP_IN_DEPOSIT
  if (raw == null || raw.trim() === '') return null
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Currency-format a dollar amount, e.g. 20 → "$20.00". */
export function formatDeposit(amount: number): string {
  return `$${amount.toFixed(2)}`
}

/**
 * The rendered drop-in alert with `{DROP_IN_DEPOSIT}` substituted (as currency),
 * or `null` when the deposit isn't configured (caller hides the alert). Falls
 * back to a sensible default copy when DROP_IN_ALERT_TEXT is unset.
 */
export function dropInAlertText(): string | null {
  const deposit = getDropInDeposit()
  if (deposit == null) return null
  const template = process.env.DROP_IN_ALERT_TEXT?.trim() || DEFAULT_ALERT_TEXT
  return template.replaceAll('{DROP_IN_DEPOSIT}', formatDeposit(deposit))
}
