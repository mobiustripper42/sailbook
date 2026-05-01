'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function joinWaitlist(courseId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  // Course must be active and full; student must not already be enrolled
  // (a non-cancelled enrollment makes a waitlist spot redundant).
  const [{ data: course }, { data: existingEnrollment }, { data: count }] = await Promise.all([
    supabase
      .from('courses')
      .select('id, capacity, status')
      .eq('id', courseId)
      .maybeSingle(),
    supabase
      .from('enrollments')
      .select('id, status')
      .eq('course_id', courseId)
      .eq('student_id', user.id)
      .not('status', 'eq', 'cancelled')
      .maybeSingle(),
    supabase.rpc('get_course_active_enrollment_count', { p_course_id: courseId }),
  ])

  if (!course || course.status !== 'active') return { error: 'Course not available.' }
  if (existingEnrollment) return { error: 'You are already enrolled in this course.' }
  if ((count ?? 0) < course.capacity) {
    return { error: 'Course has open spots — enroll directly instead.' }
  }

  const { error } = await supabase
    .from('waitlist_entries')
    .insert({ course_id: courseId, student_id: user.id })

  // 23505 = unique violation. Treat double-clicks as success.
  if (error && error.code !== '23505') return { error: error.message }

  revalidatePath(`/student/courses/${courseId}`)
  return { error: null }
}

export async function leaveWaitlist(courseId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('waitlist_entries')
    .delete()
    .eq('course_id', courseId)
    .eq('student_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/student/courses/${courseId}`)
  return { error: null }
}
