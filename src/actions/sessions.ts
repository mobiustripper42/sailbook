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

export async function deleteSession(sessionId: string, courseId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('sessions').delete().eq('id', sessionId)
  if (error) return { error: error.message }
  revalidatePath(`/admin/courses/${courseId}`)
  return { error: null }
}
