'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createCourse(prevState: string | null, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'Not authenticated'

  const rawInstructorId = formData.get('instructor_id') as string | null
  const courseData = {
    course_type_id: formData.get('course_type_id') as string,
    instructor_id: rawInstructorId && rawInstructorId !== 'none' ? rawInstructorId : null,
    title: (formData.get('title') as string) || null,
    description: (formData.get('description') as string) || null,
    capacity: Number(formData.get('capacity')) || 4,
    price: formData.get('price') ? Number(formData.get('price')) : null,
    notes: (formData.get('notes') as string) || null,
    created_by: user.id,
  }

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .insert(courseData)
    .select('id')
    .single()

  if (courseError) return courseError.message

  // Parse sessions from formData (session_date_0, session_date_1, etc.)
  const sessions = []
  let i = 0
  while (formData.has(`session_date_${i}`)) {
    const date = formData.get(`session_date_${i}`) as string
    const start_time = formData.get(`session_start_${i}`) as string
    const end_time = formData.get(`session_end_${i}`) as string
    const location = (formData.get(`session_location_${i}`) as string) || null
    if (date && start_time && end_time) {
      sessions.push({ course_id: course.id, date, start_time, end_time, location })
    }
    i++
  }

  if (sessions.length > 0) {
    const { error: sessionError } = await supabase.from('sessions').insert(sessions)
    if (sessionError) return sessionError.message
  }

  revalidatePath('/admin/courses')
  redirect(`/admin/courses/${course.id}`)
}

export async function updateCourse(id: string, prevState: string | null, formData: FormData) {
  const supabase = await createClient()

  const rawInstructorId = formData.get('instructor_id') as string | null
  const payload = {
    course_type_id: formData.get('course_type_id') as string,
    instructor_id: rawInstructorId && rawInstructorId !== 'none' ? rawInstructorId : null,
    title: (formData.get('title') as string) || null,
    description: (formData.get('description') as string) || null,
    capacity: Number(formData.get('capacity')) || 4,
    price: formData.get('price') ? Number(formData.get('price')) : null,
    notes: (formData.get('notes') as string) || null,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('courses').update(payload).eq('id', id)
  if (error) return error.message

  revalidatePath(`/admin/courses/${id}`)
  revalidatePath('/admin/courses')
  redirect(`/admin/courses/${id}`)
}

export async function publishCourse(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('courses')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/courses')
  revalidatePath(`/admin/courses/${id}`)
  return { error: null }
}

export async function completeCourse(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('courses')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/courses')
  revalidatePath(`/admin/courses/${id}`)
  return { error: null }
}

export async function cancelCourse(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('courses')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }

  // Flip all outstanding attendance records for this course to 'missed'
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', id)

  if (enrollments && enrollments.length > 0) {
    const enrollmentIds = enrollments.map((e) => e.id)
    await supabase
      .from('session_attendance')
      .update({ status: 'missed', updated_at: new Date().toISOString() })
      .in('enrollment_id', enrollmentIds)
      .eq('status', 'expected')
  }

  revalidatePath('/admin/courses')
  revalidatePath(`/admin/courses/${id}`)
  return { error: null }
}
