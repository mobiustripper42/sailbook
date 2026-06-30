'use server'

import { createClient } from '@/lib/supabase/server'
import { safeNextPath } from '@/lib/auth/safe-next'
import { friendlyPasswordError, validatePassword } from '@/lib/auth/password-rules'
import { redirectForRole } from '@/lib/auth/role-redirect'
import { redirect } from 'next/navigation'

export async function login(_: unknown, formData: FormData) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) return { error: error.message }

  const safeNext = safeNextPath(formData.get('next') as string | null)
  if (safeNext) redirect(safeNext)

  redirectForRole(data.user?.user_metadata as Record<string, unknown>)
}

export async function register(_: unknown, formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const phone = (formData.get('phone') as string)?.trim() || ''
  const experienceLevel = (formData.get('experienceLevel') as string) || ''
  const instructorNotes = (formData.get('instructorNotes') as string)?.trim() || ''

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const next = safeNextPath(formData.get('next') as string | null) ?? '/student/dashboard'

  // Mirror the Supabase password policy server-side for a clearer error path.
  const passwordError = validatePassword(password)
  if (passwordError) return { error: passwordError }

  // All profile fields ride on raw_user_meta_data. The handle_new_user trigger
  // (migration 20260429020252) reads them and inserts the profile row.
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        is_admin: false,
        is_instructor: false,
        is_student: true,
        first_name: firstName,
        last_name: lastName,
        phone,
        experience_level: experienceLevel,
        instructor_notes: instructorNotes,
      },
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  })

  if (error) return { error: friendlyPasswordError(error.message) }

  redirect(`/register/check-email?email=${encodeURIComponent(email)}`)
}

export async function signInWithGoogle(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  // Caller can pass ?next=/foo to send the user somewhere after sign-in
  // (e.g. the invite-acceptance page). Default to the student dashboard.
  const next = safeNextPath(formData.get('next') as string | null) ?? '/student/dashboard'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  })

  if (error) return { error: error.message }
  if (!data.url) return { error: 'Could not start Google sign-in.' }

  redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function requestPasswordReset(_: unknown, formData: FormData) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) return { error: 'Password reset is not available. Contact support.' }

  const supabase = await createClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  })

  if (error) return { error: error.message }
  return { error: null }
}

export async function updatePassword(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string

  const passwordError = validatePassword(password)
  if (passwordError) return { error: passwordError }

  const { data: { user }, error } = await supabase.auth.updateUser({ password })

  if (error) return { error: friendlyPasswordError(error.message) }

  redirectForRole(user?.user_metadata as Record<string, unknown>)
}

// Logged-in password change. Distinct from updatePassword (recovery flow):
// re-authenticates the current user with their current password before
// allowing the change. DEC-015 form-action shape: string | null.
export async function changePassword(_: unknown, formData: FormData): Promise<string | null> {
  const currentPassword = (formData.get('current_password') as string) ?? ''
  const newPassword = (formData.get('new_password') as string) ?? ''
  const confirmPassword = (formData.get('confirm_password') as string) ?? ''

  if (!currentPassword || !newPassword || !confirmPassword) {
    return 'All fields are required.'
  }
  if (newPassword !== confirmPassword) {
    return 'New password and confirmation do not match.'
  }
  const passwordError = validatePassword(newPassword)
  if (passwordError) return passwordError

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return 'You are not signed in.'

  // Re-auth check: signInWithPassword fails if the current password is wrong.
  // On success it rotates the session — same user, fresh tokens.
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (reauthError) return 'Current password is incorrect.'

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
  if (updateError) return friendlyPasswordError(updateError.message)

  return null
}

// ── Email one-time-code sign-in (DEC-031) ──────────────────────────────────
// Flag-gated, sign-in only for existing accounts (`shouldCreateUser: false`),
// so it never creates users or captures profile — registration stays the sole
// signup path. The flag is hard-checked server-side here, independent of
// whatever the client chooses to render.
const EMAIL_CODE_ENABLED = process.env.NEXT_PUBLIC_EMAIL_CODE_AUTH === 'true'

// With `shouldCreateUser: false`, an unknown email makes Supabase reject the
// request (HTTP 422 / "Signups not allowed for otp"). Surfacing that would turn
// the form into an account-enumeration oracle, so we detect it and report
// success anyway — the UI must look identical whether or not the email exists.
function isOtpAccountMissing(error: {
  code?: string
  status?: number
  message: string
}): boolean {
  return (
    error.code === 'otp_disabled' || /signups?\s+not\s+allowed/i.test(error.message)
  )
}

// Input-format check only. This is safe to surface because it's independent of
// whether the account exists — everything AFTER the send is swallowed.
function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
}

export async function requestEmailCode(
  _: unknown,
  formData: FormData,
): Promise<{ ok: boolean; error: string | null }> {
  if (!EMAIL_CODE_ENABLED) return { ok: false, error: 'Code sign-in is not available.' }

  const email = (formData.get('email') as string)?.trim()
  if (!email) return { ok: false, error: 'Enter your email.' }
  if (!isValidEmail(email)) return { ok: false, error: 'Enter a valid email address.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  })

  // Enumeration safety: NEVER surface a send-side error. They vary by whether the
  // account exists — an unknown email short-circuits at a 422 (no account), while a
  // real one can hit the per-user resend throttle (429) — so surfacing either leaks
  // existence. Always return the identical "code on its way" state. Only the
  // pre-send input-format checks above are surfaced. We still log the unexpected
  // errors (anything that isn't the no-account case) so a misconfigured project —
  // email OTP globally disabled, SMTP down — isn't silently masked for everyone.
  if (error && !isOtpAccountMissing(error)) {
    console.error('requestEmailCode: unexpected signInWithOtp error:', error.message)
  }

  return { ok: true, error: null }
}

export async function verifyEmailCode(
  _: unknown,
  formData: FormData,
): Promise<{ error: string | null }> {
  if (!EMAIL_CODE_ENABLED) return { error: 'Code sign-in is not available.' }

  const email = (formData.get('email') as string)?.trim()
  const token = (formData.get('token') as string)?.trim()
  if (!email || !token) return { error: 'Enter the 6-digit code from your email.' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error) {
    return { error: 'That code is invalid or has expired. Request a new one.' }
  }

  const safeNext = safeNextPath(formData.get('next') as string | null)
  if (safeNext) redirect(safeNext)

  redirectForRole(data.user?.user_metadata as Record<string, unknown>)
}

// Passwordless registration (DEC-033, phase 2). `shouldCreateUser: true` creates
// the account and rides the profile in `data` to the `handle_new_user` trigger —
// identical fields to the password `register` action above. GoTrue emails the
// 6-digit code via the Confirm-signup template; the user verifies it with the
// shared `verifyEmailCode` (no separate verify action). An already-registered
// email just gets a sign-in code instead — so, like `requestEmailCode`, every
// send-side result is swallowed (logged, never surfaced) to stay enumeration-safe;
// only pre-send input-format errors are returned. Hard-gated on the same flag.
export async function requestRegisterCode(
  _: unknown,
  formData: FormData,
): Promise<{ ok: boolean; error: string | null }> {
  if (!EMAIL_CODE_ENABLED) return { ok: false, error: 'Code sign-up is not available.' }

  const email = (formData.get('email') as string)?.trim()
  if (!email) return { ok: false, error: 'Enter your email.' }
  if (!isValidEmail(email)) return { ok: false, error: 'Enter a valid email address.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      // Profile fields only — NO role flags. handle_new_user defaults a new
      // account to is_student=true / is_admin=is_instructor=false on INSERT, so
      // they're unneeded here. Omitting them also closes a privilege-downgrade
      // vector: if GoTrue ever applied `data` to an EXISTING user on a sign-in
      // OTP, an `is_admin:false` here could clobber an admin's flags at request
      // time, pre-verification (the re-stamp trigger only fills NULLs, not an
      // explicit false). With no role flags in the payload, that's impossible.
      data: {
        first_name: formData.get('firstName') as string,
        last_name: formData.get('lastName') as string,
        phone: (formData.get('phone') as string)?.trim() || '',
        experience_level: (formData.get('experienceLevel') as string) || '',
        instructor_notes: (formData.get('instructorNotes') as string)?.trim() || '',
      },
    },
  })

  if (error) {
    console.error('requestRegisterCode: signInWithOtp error:', error.message)
  }

  return { ok: true, error: null }
}
