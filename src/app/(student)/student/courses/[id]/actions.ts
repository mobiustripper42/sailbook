'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function enrollInCourse(courseId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Load course to check status + capacity
  const { data: course } = await supabase
    .from('courses')
    .select('id, status, capacity')
    .eq('id', courseId)
    .single()

  if (!course || course.status !== 'active') {
    return { error: 'This course is not available for enrollment.' }
  }

  // 2.6 — duplicate prevention
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('course_id', courseId)
    .eq('student_id', user.id)
    .single()

  if (existing && existing.status !== 'cancelled') {
    return { error: 'You are already enrolled in this course.' }
  }

  // 2.5 — capacity enforcement
  const { count } = await supabase
    .from('enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', courseId)
    .neq('status', 'cancelled')

  if ((count ?? 0) >= course.capacity) {
    return { error: 'This course is full.' }
  }

  // Enroll (upsert handles the case where a cancelled enrollment exists)
  if (existing?.status === 'cancelled') {
    const { error } = await supabase
      .from('enrollments')
      .update({ status: 'registered', enrolled_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('enrollments')
      .insert({ course_id: courseId, student_id: user.id, status: 'registered' })
    if (error) return { error: error.message }
  }

  revalidatePath(`/student/courses/${courseId}`)
  revalidatePath('/student/courses')
  revalidatePath('/student/dashboard')
}
