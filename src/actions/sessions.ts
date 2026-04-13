'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function addSession(courseId: string, prevState: string | null, formData: FormData) {
  const supabase = await createClient()

  const payload = {
    course_id: courseId,
    date: formData.get('date') as string,
    start_time: formData.get('start_time') as string,
    end_time: formData.get('end_time') as string,
    location: (formData.get('location') as string) || null,
    instructor_id: (formData.get('instructor_id') as string) || null,
  }

  const { data: newSession, error } = await supabase
    .from('sessions')
    .insert(payload)
    .select('id')
    .single()
  if (error) return error.message

  // Auto-create attendance records for existing non-cancelled enrollees
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', courseId)
    .neq('status', 'cancelled')

  if (enrollments && enrollments.length > 0) {
    const attendanceRows = enrollments.map((e) => ({
      session_id: newSession.id,
      enrollment_id: e.id,
      status: 'expected' as const,
    }))
    const { error: attendanceError } = await supabase
      .from('session_attendance')
      .insert(attendanceRows)
    if (attendanceError) return `Session created but attendance setup failed: ${attendanceError.message}`
  }

  revalidatePath(`/admin/courses/${courseId}`)
  redirect(`/admin/courses/${courseId}`)
}

export async function cancelSession(sessionId: string, courseId: string, cancelReason: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sessions')
    .update({
      status: 'cancelled',
      cancel_reason: cancelReason || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
  if (error) return { error: error.message }

  // Flip all 'expected' attendance records for this session to 'missed'
  const { error: attendanceError } = await supabase
    .from('session_attendance')
    .update({ status: 'missed', updated_at: new Date().toISOString() })
    .eq('session_id', sessionId)
    .eq('status', 'expected')

  revalidatePath(`/admin/courses/${courseId}`)
  if (attendanceError) return { error: `Session cancelled but attendance update failed: ${attendanceError.message}` }
  return { error: null }
}

export async function createMakeupSession(
  originalSessionId: string,
  courseId: string,
  prevState: string | null,
  formData: FormData
) {
  const supabase = await createClient()

  const date = formData.get('date') as string
  const startTime = formData.get('start_time') as string
  const endTime = formData.get('end_time') as string
  const location = (formData.get('location') as string) || null
  const instructorId = (formData.get('instructor_id') as string) || null

  if (!date || !startTime || !endTime) return 'Date, start time, and end time are required.'

  // Create the makeup session
  const { data: newSession, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      course_id: courseId,
      date,
      start_time: startTime,
      end_time: endTime,
      location,
      instructor_id: instructorId,
      notes: `Makeup for cancelled session`,
    })
    .select('id')
    .single()

  if (sessionError) return sessionError.message

  // Find students with 'missed' attendance on the cancelled session who don't already have a makeup
  const { data: missedRecords, error: missedError } = await supabase
    .from('session_attendance')
    .select('id, enrollment_id')
    .eq('session_id', originalSessionId)
    .eq('status', 'missed')
    .is('makeup_session_id', null)

  if (missedError) return `Session created but failed to fetch missed students: ${missedError.message}`

  if (missedRecords && missedRecords.length > 0) {
    // Create attendance records for makeup session
    const attendanceRows = missedRecords.map((r) => ({
      session_id: newSession.id,
      enrollment_id: r.enrollment_id,
      status: 'expected' as const,
    }))

    const { error: insertError } = await supabase
      .from('session_attendance')
      .insert(attendanceRows)

    if (insertError) return `Makeup session created but attendance insert failed: ${insertError.message}`

    // Link original missed records to the makeup session
    const missedIds = missedRecords.map((r) => r.id)
    const { error: linkError } = await supabase
      .from('session_attendance')
      .update({ makeup_session_id: newSession.id, updated_at: new Date().toISOString() })
      .in('id', missedIds)

    if (linkError) return `Makeup created but failed to link original records: ${linkError.message}`
  }

  revalidatePath(`/admin/courses/${courseId}`)
  redirect(`/admin/courses/${courseId}`)
}

export async function updateSession(
  sessionId: string,
  courseId: string,
  formData: FormData
): Promise<string | null> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sessions')
    .update({
      date: formData.get('date') as string,
      start_time: formData.get('start_time') as string,
      end_time: formData.get('end_time') as string,
      location: (formData.get('location') as string) || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  if (error) return error.message
  revalidatePath(`/admin/courses/${courseId}`)
  return null
}

export async function updateSessionInstructor(
  sessionId: string,
  courseId: string,
  instructorId: string | null
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('sessions')
    .update({ instructor_id: instructorId, updated_at: new Date().toISOString() })
    .eq('id', sessionId)
  if (error) return { error: error.message }
  revalidatePath(`/admin/courses/${courseId}`)
  return { error: null }
}

export async function deleteSession(sessionId: string, courseId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('sessions').delete().eq('id', sessionId)
  if (error) return { error: error.message }
  revalidatePath(`/admin/courses/${courseId}`)
  return { error: null }
}
