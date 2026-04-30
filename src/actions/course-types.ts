'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function readThresholds(formData: FormData) {
  const minRaw = formData.get('minimum_enrollment')
  const leadRaw = formData.get('low_enrollment_lead_days')
  return {
    minimum_enrollment: minRaw && String(minRaw).length > 0 ? Number(minRaw) : null,
    low_enrollment_lead_days: leadRaw && String(leadRaw).length > 0 ? Number(leadRaw) : 14,
  }
}

export async function createCourseType(prevState: string | null, formData: FormData) {
  const supabase = await createClient()

  const payload = {
    name: formData.get('name') as string,
    short_code: (formData.get('short_code') as string).toUpperCase(),
    certification_body: (formData.get('certification_body') as string) || null,
    description: (formData.get('description') as string) || null,
    min_hours: formData.get('min_hours') ? Number(formData.get('min_hours')) : null,
    max_students: Number(formData.get('max_students')) || 4,
    ...readThresholds(formData),
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
    ...readThresholds(formData),
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
