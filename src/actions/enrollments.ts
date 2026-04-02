'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function confirmEnrollment(enrollmentId: string, courseId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('enrollments')
    .update({ status: 'confirmed', updated_at: new Date().toISOString() })
    .eq('id', enrollmentId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/courses/${courseId}`)
}

export async function cancelEnrollment(enrollmentId: string, courseId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('enrollments')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', enrollmentId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/courses/${courseId}`)
}
