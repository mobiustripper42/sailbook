'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function confirmEnrollment(enrollmentId: string, courseId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('enrollments')
    .update({ status: 'confirmed', updated_at: new Date().toISOString() })
    .eq('id', enrollmentId)
  if (error) return { error: error.message }
  revalidatePath(`/admin/courses/${courseId}`)
  return { error: null }
}

export async function cancelEnrollment(enrollmentId: string, courseId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('enrollments')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', enrollmentId)
  if (error) return { error: error.message }

  // Flip outstanding attendance records to 'missed'
  await supabase
    .from('session_attendance')
    .update({ status: 'missed', updated_at: new Date().toISOString() })
    .eq('enrollment_id', enrollmentId)
    .eq('status', 'expected')

  revalidatePath(`/admin/courses/${courseId}`)
  return { error: null }
}
