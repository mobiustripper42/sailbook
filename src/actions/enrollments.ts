'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'

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
  if (!['cash', 'check', 'venmo', 'stripe_manual'].includes(paymentMethod)) return 'Invalid payment method.'
  if (isNaN(amountDollars) || amountDollars < 0) return 'Invalid amount.'

  const amountCents = Math.round(amountDollars * 100)

  // Prevent duplicate enrollment
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('course_id', courseId)
    .eq('student_id', studentId)
    .not('status', 'eq', 'cancelled')
    .maybeSingle()

  if (existing) return 'This student is already enrolled in this course.'

  // Use admin client so the insert bypasses RLS (service role).
  // The admin RLS check above is the access gate.
  const adminClient = createAdminClient()

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
    await adminClient.from('session_attendance').upsert(
      sessions.map((s) => ({
        session_id: s.id,
        enrollment_id: enrollment.id,
        status: 'expected' as const,
      })),
      { onConflict: 'session_id,enrollment_id' },
    )
  }

  // Record the manual payment
  if (amountCents > 0) {
    await adminClient.from('payments').insert({
      enrollment_id: enrollment.id,
      student_id: studentId,
      amount_cents: amountCents,
      status: 'succeeded',
      payment_method: paymentMethod,
    })
  }

  revalidatePath(`/admin/courses/${courseId}`)
  return null
}

export async function confirmEnrollment(enrollmentId: string, courseId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('enrollments')
    .update({ status: 'confirmed', updated_at: new Date().toISOString() })
    .eq('id', enrollmentId)
  if (error) return { error: error.message }
  revalidatePath(`/admin/courses/${courseId}`)
  return { error: null }
}

export async function cancelEnrollment(enrollmentId: string, courseId: string) {
  const supabase = await createClient()
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
  }

  // Cancel the enrollment and flip attendance records
  return cancelEnrollment(enrollmentId, courseId)
}
