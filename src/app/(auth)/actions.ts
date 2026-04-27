'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function login(_: unknown, formData: FormData) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) return { error: error.message }

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
  const phone = (formData.get('phone') as string) || null
  const experienceLevel = (formData.get('experienceLevel') as string) || null
  const instructorNotes = (formData.get('instructorNotes') as string)?.trim() || null

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { is_admin: false, is_instructor: false, is_student: true, first_name: firstName, last_name: lastName },
      emailRedirectTo: `${siteUrl}/auth/callback?next=/student/dashboard`,
    },
  })

  if (error) return { error: error.message }

  // With email confirmations enabled, signUp does not create a session, so the
  // user has no auth context to satisfy RLS on the profiles insert. Use the
  // service-role client (same pattern as admin-created students).
  if (data.user) {
    const adminClient = createAdminClient()
    const { error: profileError } = await adminClient.from('profiles').insert({
      id: data.user.id,
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
      is_admin: false,
      is_instructor: false,
      is_student: true,
      experience_level: experienceLevel,
      instructor_notes: instructorNotes,
    })

    if (profileError) return { error: 'Account created but profile setup failed.' }
  }

  redirect(`/register/check-email?email=${encodeURIComponent(email)}`)
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

  const { data: { user }, error } = await supabase.auth.updateUser({ password })

  if (error) return { error: error.message }

  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>
  if (meta.is_admin) redirect('/admin/dashboard')
  if (meta.is_instructor) redirect('/instructor/dashboard')
  redirect('/student/dashboard')
}
