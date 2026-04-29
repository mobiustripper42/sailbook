'use server'

import { createClient } from '@/lib/supabase/server'
import { safeNextPath } from '@/lib/auth/safe-next'
import { friendlyPasswordError, validatePassword } from '@/lib/auth/password-rules'
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

  const meta = (data.user?.user_metadata ?? {}) as Record<string, unknown>
  if (meta.is_admin) redirect('/admin/dashboard')
  if (meta.is_instructor) redirect('/instructor/dashboard')
  redirect('/student/dashboard')
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

  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>
  if (meta.is_admin) redirect('/admin/dashboard')
  if (meta.is_instructor) redirect('/instructor/dashboard')
  redirect('/student/dashboard')
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
