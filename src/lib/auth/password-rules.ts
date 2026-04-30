// Password policy lives in supabase/config.toml:
//   minimum_password_length = 12
//   password_requirements = "lower_upper_letters_digits"
//
// We mirror the rules in `validatePassword` so the server can reject before
// hitting Supabase (clearer error paths, faster feedback). Supabase also
// enforces — defense-in-depth.
//
// `friendlyPasswordError` translates Supabase's verbose policy error into
// human copy that matches PASSWORD_RULES_HELP.

export const PASSWORD_MIN_LENGTH = 12

export const PASSWORD_RULES_HELP =
  'At least 12 characters, with upper case, lower case, and a digit.'

/**
 * Returns null if the password meets the policy, else a friendly error string.
 * Mirrors supabase/config.toml `lower_upper_letters_digits` requirement.
 */
export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return 'Password must include upper case, lower case, and a digit.'
  }
  return null
}

/**
 * Translates Supabase Auth password errors into our friendlier copy. Falls
 * back to the original message if the error doesn't match a known shape so
 * we never swallow useful information.
 */
export function friendlyPasswordError(supabaseMessage: string): string {
  if (/contain at least one character/i.test(supabaseMessage)) {
    return 'Password must include upper case, lower case, and a digit.'
  }
  if (/at least \d+ characters/i.test(supabaseMessage)) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
  }
  if (/different from the old/i.test(supabaseMessage)) {
    return 'New password must be different from the current password.'
  }
  return supabaseMessage
}
