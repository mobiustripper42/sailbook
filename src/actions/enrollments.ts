'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

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
