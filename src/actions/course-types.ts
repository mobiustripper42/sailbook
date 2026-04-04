'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createCourseType(prevState: string | null, formData: FormData) {
  const supabase = await createClient()

  const payload = {
    name: formData.get('name') as string,
    short_code: (formData.get('short_code') as string).toUpperCase(),
    certification_body: (formData.get('certification_body') as string) || null,
    description: (formData.get('description') as string) || null,
    min_hours: formData.get('min_hours') ? Number(formData.get('min_hours')) : null,
    max_students: Number(formData.get('max_students')) || 4,
  }

  const { error } = await supabase.from('course_types').insert(payload)
  if (error) return error.message

  revalidatePath('/admin/course-types')
  redirect('/admin/course-types')
}

export async function updateCourseType(id: string, prevState: string | null, formData: FormData) {
  const supabase = await createClient()

  const payload = {
    name: formData.get('name') as string,
    short_code: (formData.get('short_code') as string).toUpperCase(),
    certification_body: (formData.get('certification_body') as string) || null,
    description: (formData.get('description') as string) || null,
    min_hours: formData.get('min_hours') ? Number(formData.get('min_hours')) : null,
    max_students: Number(formData.get('max_students')) || 4,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('course_types').update(payload).eq('id', id)
  if (error) return error.message

  revalidatePath('/admin/course-types')
  redirect('/admin/course-types')
}

export async function toggleCourseTypeActive(id: string, currentlyActive: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('course_types')
    .update({ is_active: !currentlyActive, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/course-types')
  return { error: null }
}
