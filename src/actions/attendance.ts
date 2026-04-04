'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type AttendanceRecord = {
  session_id: string
  enrollment_id: string
  status: 'expected' | 'attended' | 'missed' | 'excused'
  notes: string | null
}

export async function saveAttendance(courseId: string, sessionId: string, records: AttendanceRecord[]) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('session_attendance')
    .upsert(
      records.map((r) => ({
        session_id: r.session_id,
        enrollment_id: r.enrollment_id,
        status: r.status,
        notes: r.notes,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'session_id,enrollment_id' }
    )

  if (error) return { error: error.message }

  revalidatePath(`/admin/courses/${courseId}/sessions/${sessionId}/attendance`)
  revalidatePath(`/admin/courses/${courseId}`)
  return { error: null }
}
