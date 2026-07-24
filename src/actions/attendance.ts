'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { AttendanceStatus } from '@/lib/attendance'

type AttendanceRecord = {
  enrollment_id: string
  status: AttendanceStatus
  notes: string | null
}

// DEC-037: attendance writes go through the `save_attendance` SECURITY DEFINER
// RPC — authorized for admin OR the assigned instructor, preserving the status
// vocabulary and never touching makeup_session_id. Both the admin and the
// instructor capture forms call this one path (the RPC authorizes admin too), so
// there is a single tested write surface.
export async function saveAttendance(
  sessionId: string,
  records: AttendanceRecord[],
  revalidate: string[] = [],
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('save_attendance', {
    p_session_id: sessionId,
    p_records: records,
  })

  if (error) return { error: error.message }
  // The RPC returns NULL on success, or an error string (auth / invalid status).
  if (data) return { error: data }

  for (const path of revalidate) revalidatePath(path)
  return { error: null }
}
