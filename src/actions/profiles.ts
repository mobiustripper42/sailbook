'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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
  revalidatePath('/admin/instructors')
  return { success: true }
}

export async function updateThemePreference(theme: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('profiles')
    .update({ theme_preference: theme })
    .eq('id', user.id)

  if (error) return { error: error.message }
  return { error: null }
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()

  const id = formData.get('id') as string
  const first_name = (formData.get('first_name') as string).trim()
  const last_name = (formData.get('last_name') as string).trim()
  const phone = (formData.get('phone') as string)?.trim() || null
  const experience_level = (formData.get('experience_level') as string) || null
  const is_active = formData.get('is_active') === 'true'
  const returnPath = formData.get('return_path') as string

  if (!first_name || !last_name) {
    return { error: 'First name and last name are required.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      first_name,
      last_name,
      phone,
      experience_level: experience_level === '—' ? null : experience_level,
      is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(returnPath)
  revalidatePath('/admin/students')
  revalidatePath('/admin/instructors')
  return { success: true }
}
