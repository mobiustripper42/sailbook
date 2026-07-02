// Shared "confirm an enrollment" steps used by both the Stripe webhook
// (checkout.session.completed) and the #107 fully-credit-covered checkout
// path, which skips Stripe entirely. Keeping this in one place means the two
// paths can't silently drift apart — payment/credit bookkeeping differs
// between them, but everything else (status, attendance, waitlist,
// notification) must stay identical.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { notifyEnrollmentConfirmed } from '@/lib/notifications/triggers'

type AdminClient = SupabaseClient<Database>

export async function confirmEnrollment(
  admin: AdminClient,
  enrollment: { id: string; student_id: string; course_id: string },
): Promise<void> {
  const { error: updateErr } = await admin
    .from('enrollments')
    .update({
      status: 'confirmed',
      hold_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', enrollment.id)

  if (updateErr) {
    console.error('confirmEnrollment: failed to confirm enrollment:', updateErr.message)
    return
  }

  const { data: sessions, error: sessionsErr } = await admin
    .from('sessions')
    .select('id')
    .eq('course_id', enrollment.course_id)

  if (sessionsErr) {
    console.error('confirmEnrollment: failed to fetch sessions for attendance:', sessionsErr.message)
  }

  if (sessions && sessions.length > 0) {
    const { error: attendanceErr } = await admin.from('session_attendance').upsert(
      sessions.map((s) => ({
        session_id: s.id,
        enrollment_id: enrollment.id,
        status: 'expected' as const,
      })),
      { onConflict: 'session_id,enrollment_id' }
    )

    if (attendanceErr) {
      // Non-fatal: attendance records can be created by admin if needed
      console.error('confirmEnrollment: failed to create attendance records:', attendanceErr.message)
    }
  }

  // If this student happened to be on the waitlist for this course, drop the
  // entry. Best-effort — failure is non-fatal.
  const { error: waitlistErr } = await admin
    .from('waitlist_entries')
    .delete()
    .eq('course_id', enrollment.course_id)
    .eq('student_id', enrollment.student_id)
  if (waitlistErr) {
    console.error('confirmEnrollment: failed to clear waitlist entry:', waitlistErr.message)
  }

  // Fire-and-await: trigger swallows its own errors, so a caller never 500s
  // from a notification failure.
  await notifyEnrollmentConfirmed(enrollment.id)
}
