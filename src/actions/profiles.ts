'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function updateUserProfile(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const id = formData.get('id') as string
  const first_name = (formData.get('first_name') as string).trim()
  const last_name = (formData.get('last_name') as string).trim()
  const phone = (formData.get('phone') as string)?.trim() || null
  const is_active = formData.get('is_active') === 'true'
  const is_admin = formData.get('is_admin') === 'on'
  const is_instructor = formData.get('is_instructor') === 'on'
  const is_student = formData.get('is_student') === 'on'

  if (!first_name || !last_name) {
    return { error: 'First name and last name are required.' }
  }

  if (user.id === id && !is_admin) {
    return { error: "You can't remove your own admin access." }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      first_name,
      last_name,
      phone,
      is_active,
      is_admin,
      is_instructor,
      is_student,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/users')
  revalidatePath('/admin/students')
  return { success: true }
}

export async function updateStudentProfile(
  _: unknown,
  formData: FormData,
): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'Not authenticated.'

  const first_name = (formData.get('first_name') as string).trim()
  const last_name = (formData.get('last_name') as string).trim()
  const phone = (formData.get('phone') as string)?.trim() || null
  const asa_number = (formData.get('asa_number') as string)?.trim() || null
  const experience_level = (formData.get('experience_level') as string) || null
  const instructor_notes = (formData.get('instructor_notes') as string)?.trim() || null

  if (!first_name || !last_name) return 'First name and last name are required.'
  if (instructor_notes && instructor_notes.length > 2000) {
    return 'Notes must be 2000 characters or fewer.'
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      first_name,
      last_name,
      phone,
      asa_number,
      experience_level: experience_level === '—' ? null : experience_level,
      instructor_notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return error.message

  revalidatePath('/student/account')
  return null
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const id = formData.get('id') as string
  const first_name = (formData.get('first_name') as string).trim()
  const last_name = (formData.get('last_name') as string).trim()
  const phone = (formData.get('phone') as string)?.trim() || null
  const experience_level = (formData.get('experience_level') as string) || null
  const asa_number = (formData.get('asa_number') as string)?.trim() || null
  const returnPath = formData.get('return_path') as string

  if (!first_name || !last_name) {
    return { error: 'First name and last name are required.' }
  }

  // Verify admin server-side — never trust client-supplied flags.
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()
  const isAdmin = callerProfile?.is_admin === true
  if (!isAdmin) return { error: 'Unauthorized.' }

  const updates: Record<string, unknown> = {
    first_name,
    last_name,
    phone,
    experience_level: experience_level === '—' ? null : experience_level,
    asa_number,
    updated_at: new Date().toISOString(),
    // Admin-only fields — safe here because of the isAdmin early-return above.
    is_active: formData.get('is_active') === 'true',
    is_member: formData.get('is_member') === 'on',
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(returnPath)
  revalidatePath('/admin/users')
  revalidatePath('/admin/students')
  return { error: null }
}

export async function createAdminStudent(
  _: unknown,
  formData: FormData,
): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'Not authenticated.'

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()
  if (!callerProfile?.is_admin) return 'Unauthorized.'

  const first_name = (formData.get('first_name') as string).trim()
  const last_name = (formData.get('last_name') as string).trim()
  const email = (formData.get('email') as string).trim().toLowerCase()
  const phone = (formData.get('phone') as string)?.trim() || null
  const experience_level = (formData.get('experience_level') as string) || null
  const asa_number = (formData.get('asa_number') as string)?.trim() || null

  if (!first_name || !last_name || !email) return 'First name, last name, and email are required.'
  if (first_name.length > 100 || last_name.length > 100) return 'Name must be 100 characters or fewer.'
  if (phone && phone.length > 30) return 'Phone must be 30 characters or fewer.'
  if (asa_number && asa_number.length > 20) return 'ASA number must be 20 characters or fewer.'

  const adminClient = createAdminClient()

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { first_name, last_name },
  })
  if (authError) return authError.message
  if (!authData.user) return 'Failed to create user account.'

  // The handle_new_user trigger has already inserted a basic profile (Phase
  // 3.11). Upsert to add the admin-only fields (asa_number, auth_source) and
  // overwrite any defaults the trigger filled in.
  const { error: profileError } = await adminClient
    .from('profiles')
    .upsert({
      id: authData.user.id,
      first_name,
      last_name,
      email,
      phone,
      experience_level: experience_level === '—' ? null : experience_level,
      asa_number,
      is_student: true,
      is_active: true,
      auth_source: 'admin_created',
    })

  if (profileError) {
    await adminClient.auth.admin.deleteUser(authData.user.id)
    return profileError.message
  }

  revalidatePath('/admin/users')
  redirect('/admin/users')
}
