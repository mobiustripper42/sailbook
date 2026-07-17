// Phone normalization + validation (#129).
// The school sends SMS reminders, so a stored phone must be a dialable US
// number. Strip to digits, drop a single leading country code '1', and require
// exactly 10 digits. Callers store the normalized (bare 10-digit) form; a
// leading-1 or any punctuation the user typed is discarded.

export const INVALID_PHONE_MESSAGE = 'Enter a valid 10-digit US phone number.'

export function normalizePhone(raw: string | null | undefined): string {
  const digits = (raw ?? '').replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1)
  return digits
}

export function isValidPhone(raw: string | null | undefined): boolean {
  return normalizePhone(raw).length === 10
}
