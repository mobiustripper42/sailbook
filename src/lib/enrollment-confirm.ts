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

// #107 — the zero-charge checkout path (credit fully covers the price, no
// Stripe involved at all). Debits credit_ledger BEFORE flipping the
// enrollment to 'confirmed' — the reverse order is a real bug: if the ledger
// insert fails after status is already 'confirmed', the student ends up
// enrolled with nothing actually deducted. The webhook's equivalent
// (route.ts) already does payment-record-before-status-flip; this mirrors
// that. The credit_ledger_prevent_overdraw trigger (migration
// 20260702171443) is what actually closes the race between reading the
// balance and writing this debit — this function alone can't.
export async function confirmWithFullCredit(
  admin: AdminClient,
  params: {
    existingEnrollmentId: string | null
    courseId: string
    studentId: string
    creditAppliedCents: number
    courseTitle: string | null
  },
): Promise<{ error: string | null; enrollmentId: string | null }> {
  let enrollmentId: string

  if (params.existingEnrollmentId) {
    // Leave status untouched until the debit is secured — confirmEnrollment
    // below does the final 'confirmed' flip regardless of the prior status.
    enrollmentId = params.existingEnrollmentId
  } else {
    const { data: inserted, error: insertErr } = await admin
      .from('enrollments')
      .insert({
        course_id: params.courseId,
        student_id: params.studentId,
        status: 'pending_payment',
      })
      .select('id')
      .single()
    if (insertErr) return { error: insertErr.message, enrollmentId: null }
    enrollmentId = inserted.id
  }

  if (params.creditAppliedCents > 0) {
    const { error: redeemErr } = await admin.from('credit_ledger').insert({
      student_id: params.studentId,
      amount_cents: -params.creditAppliedCents,
      reason: `Applied to enrollment: ${params.courseTitle ?? params.courseId}`,
      enrollment_id: enrollmentId,
    })
    // Fatal — nothing was actually paid via Stripe on this path, so a failed
    // debit must not leave the enrollment confirmed. The DB trigger rejects
    // this the same way if the balance can't cover it (concurrent overdraw).
    if (redeemErr) return { error: redeemErr.message, enrollmentId: null }
  }

  await confirmEnrollment(admin, { id: enrollmentId, student_id: params.studentId, course_id: params.courseId })
  return { error: null, enrollmentId }
}
