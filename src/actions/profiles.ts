'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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
