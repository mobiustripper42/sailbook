'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { MANUAL_PAYMENT_METHODS } from '@/lib/constants'
import { notifyEnrollmentConfirmed, notifyWaitlistSpotOpened } from '@/lib/notifications/triggers'

export async function adminEnrollStudent(
  _: unknown,
  formData: FormData,
): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'Not authenticated.'

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()
  if (!callerProfile?.is_admin) return 'Unauthorized.'

  const courseId = formData.get('course_id') as string
  const studentId = formData.get('student_id') as string
  const paymentMethod = formData.get('payment_method') as string
  const amountDollars = parseFloat(formData.get('amount') as string)

  if (!courseId || !studentId) return 'Course and student are required.'
  if (!(MANUAL_PAYMENT_METHODS as readonly string[]).includes(paymentMethod)) return 'Invalid payment method.'
  if (isNaN(amountDollars) || amountDollars < 0) return 'Invalid amount.'

  const amountCents = Math.round(amountDollars * 100)

  // Use adminClient for all reads + writes so behavior is unconditional
  // regardless of RLS state. The is_admin check above is the access gate.
  const adminClient = createAdminClient()

  // Prevent duplicate enrollment
  const { data: existing } = await adminClient
    .from('enrollments')
    .select('id, status')
    .eq('course_id', courseId)
    .eq('student_id', studentId)
    .not('status', 'eq', 'cancelled')
    .maybeSingle()

  if (existing) return 'This student is already enrolled in this course.'

  const { data: enrollment, error: enrollError } = await adminClient
    .from('enrollments')
    .insert({
      course_id: courseId,
      student_id: studentId,
      status: 'confirmed',
    })
    .select('id')
    .single()

  if (enrollError) return enrollError.message

  // Seed session_attendance rows for all sessions in the course
  const { data: sessions } = await adminClient
    .from('sessions')
    .select('id')
    .eq('course_id', courseId)

  if (sessions && sessions.length > 0) {
    const { error: attendanceError } = await adminClient.from('session_attendance').upsert(
      sessions.map((s) => ({
        session_id: s.id,
        enrollment_id: enrollment.id,
        status: 'expected' as const,
      })),
      { onConflict: 'session_id,enrollment_id' },
    )
    if (attendanceError) return `Enrollment created but attendance seeding failed: ${attendanceError.message}`
  }

  // Record the manual payment
  if (amountCents > 0) {
    const { error: paymentError } = await adminClient.from('payments').insert({
      enrollment_id: enrollment.id,
      student_id: studentId,
      amount_cents: amountCents,
      status: 'succeeded',
      payment_method: paymentMethod,
    })
    if (paymentError) return `Enrollment created but payment record failed: ${paymentError.message}`
  }

  // Best-effort: if this student happened to be on the course's waitlist,
  // remove them. Failure is non-fatal — admins can clean up by hand.
  await adminClient
    .from('waitlist_entries')
    .delete()
    .eq('course_id', courseId)
    .eq('student_id', studentId)

  await notifyEnrollmentConfirmed(enrollment.id)

  revalidatePath(`/admin/courses/${courseId}`)
  return null
}

export async function confirmEnrollment(enrollmentId: string, courseId: string) {
  const supabase = await createClient()

  // Look up student_id BEFORE flipping status, so we can clear the waitlist
  // entry afterward without a second round-trip via the enrollments table.
  const { data: enrollmentRow } = await supabase
    .from('enrollments')
    .select('student_id')
    .eq('id', enrollmentId)
    .maybeSingle()

  const { error } = await supabase
    .from('enrollments')
    .update({ status: 'confirmed', updated_at: new Date().toISOString() })
    .eq('id', enrollmentId)
  if (error) return { error: error.message }

  if (enrollmentRow?.student_id) {
    await supabase
      .from('waitlist_entries')
      .delete()
      .eq('course_id', courseId)
      .eq('student_id', enrollmentRow.student_id)
  }

  await notifyEnrollmentConfirmed(enrollmentId)

  revalidatePath(`/admin/courses/${courseId}`)
  return { error: null }
}

export async function cancelEnrollment(enrollmentId: string, courseId: string) {
  const supabase = await createClient()

  // Read prior status BEFORE the update. Two reasons:
  //   1) Only confirmed/cancel_requested rows hold a real seat — cancelling
  //      a pending_hold or already-cancelled row must not blast the waitlist.
  //   2) If RLS hides the row, we'd otherwise no-op the update silently and
  //      still fire the notification — the prior-status read also returns
  //      nothing in that case, so we bail early.
  const { data: prior } = await supabase
    .from('enrollments')
    .select('status')
    .eq('id', enrollmentId)
    .maybeSingle()

  const heldASpot = prior?.status === 'confirmed' || prior?.status === 'cancel_requested'

  const { error } = await supabase
    .from('enrollments')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', enrollmentId)
  if (error) return { error: error.message }

  // Flip outstanding attendance records to 'missed'
  await supabase
    .from('session_attendance')
    .update({ status: 'missed', updated_at: new Date().toISOString() })
    .eq('enrollment_id', enrollmentId)
    .eq('status', 'expected')

  // A spot just opened — fan out to the waitlist. Skip when the prior status
  // never held a confirmed seat, so we don't blast on no-op cancels.
  if (heldASpot) {
    await notifyWaitlistSpotOpened(courseId)
  }

  revalidatePath(`/admin/courses/${courseId}`)
  return { error: null }
}

export async function restoreEnrollment(enrollmentId: string, courseId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.is_admin) return { error: 'Unauthorized.' }

  const adminClient = createAdminClient()

  const { data: course } = await adminClient
    .from('courses')
    .select('capacity')
    .eq('id', courseId)
    .single()
  if (!course) return { error: 'Course not found.' }

  const { count: confirmedCount } = await adminClient
    .from('enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', courseId)
    .eq('status', 'confirmed')

  if (confirmedCount !== null && confirmedCount >= course.capacity) {
    return { error: 'Course is at capacity — cannot restore enrollment.' }
  }

  const { error } = await adminClient
    .from('enrollments')
    .update({ status: 'confirmed', updated_at: new Date().toISOString() })
    .eq('id', enrollmentId)
    .eq('status', 'cancelled')

  if (error) return { error: error.message }

  // Restore attendance for sessions still scheduled
  const { data: scheduledSessions } = await adminClient
    .from('sessions')
    .select('id')
    .eq('course_id', courseId)
    .eq('status', 'scheduled')

  if (scheduledSessions && scheduledSessions.length > 0) {
    await adminClient
      .from('session_attendance')
      .update({ status: 'expected', updated_at: new Date().toISOString() })
      .eq('enrollment_id', enrollmentId)
      .eq('status', 'missed')
      .in('session_id', scheduledSessions.map((s) => s.id))
  }

  revalidatePath(`/admin/courses/${courseId}`)
  return { error: null }
}

export async function requestCancellation(enrollmentId: string, courseId: string) {
  const supabase = await createClient()

  // Verify the enrollment is in a cancellable state before attempting the update.
  // RLS enforces ownership + confirmed-only transition; this check surfaces a
  // clear error instead of a silent RLS rejection.
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('status')
    .eq('id', enrollmentId)
    .maybeSingle()

  if (!enrollment) return { error: 'Enrollment not found.' }
  if (enrollment.status !== 'confirmed') return { error: 'Only confirmed enrollments can be cancelled.' }

  const { error } = await supabase
    .from('enrollments')
    .update({ status: 'cancel_requested', updated_at: new Date().toISOString() })
    .eq('id', enrollmentId)

  if (error) return { error: error.message }

  revalidatePath(`/student/courses/${courseId}`)
  revalidatePath('/student/courses')
  return { error: null }
}

export async function processRefund(
  enrollmentId: string,
  courseId: string,
  refundAmountCents?: number,
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.is_admin) return { error: 'Unauthorized.' }

  const { data: payment } = await supabase
    .from('payments')
    .select('id, stripe_payment_intent_id, amount_cents, status')
    .eq('enrollment_id', enrollmentId)
    .eq('status', 'succeeded')
    .maybeSingle()

  if (payment?.stripe_payment_intent_id) {
    const amountToRefund = refundAmountCents ?? payment.amount_cents
    if (amountToRefund <= 0 || amountToRefund > payment.amount_cents) {
      return { error: 'Refund amount must be between $0.01 and the original charge.' }
    }

    try {
      await stripe.refunds.create({
        payment_intent: payment.stripe_payment_intent_id,
        ...(refundAmountCents ? { amount: refundAmountCents } : {}),
      }, { idempotencyKey: `${payment.id}-${amountToRefund}` })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Stripe refund failed.'
      return { error: msg }
    }

    const { error: updateErr } = await supabase
      .from('payments')
      .update({
        status: 'refunded',
        refund_amount_cents: amountToRefund,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id)

    if (updateErr) {
      console.error('processRefund: Stripe refund succeeded but payments row update failed', updateErr)
      return { error: updateErr.message }
    }
  } else if (payment) {
    // Manual payment (no Stripe) — mark refunded in DB before cancelling
    const amountToRefund = refundAmountCents ?? payment.amount_cents
    const { error: updateErr } = await supabase
      .from('payments')
      .update({
        status: 'refunded',
        refund_amount_cents: amountToRefund,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id)

    if (updateErr) return { error: updateErr.message }
  }

  // Cancel the enrollment and flip attendance records
  return cancelEnrollment(enrollmentId, courseId)
}
