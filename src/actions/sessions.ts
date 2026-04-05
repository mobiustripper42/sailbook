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

  const { error } = await supabase.from('sessions').insert(payload)
  if (error) return error.message

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

export async function deleteSession(sessionId: string, courseId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('sessions').delete().eq('id', sessionId)
  if (error) return { error: error.message }
  revalidatePath(`/admin/courses/${courseId}`)
  return { error: null }
}
