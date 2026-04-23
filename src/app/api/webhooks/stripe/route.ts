import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Signature verification failed: ${message}` }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object
  const admin = createAdminClient()

  const { data: enrollment, error: enrollmentErr } = await admin
    .from('enrollments')
    .select('id, student_id, course_id, status')
    .eq('stripe_checkout_session_id', session.id)
    .maybeSingle()

  if (enrollmentErr) {
    console.error('Webhook: enrollment lookup failed:', enrollmentErr.message)
    return NextResponse.json({ error: enrollmentErr.message }, { status: 500 })
  }

  if (!enrollment) {
    // Unknown session — return 200 so Stripe stops retrying
    console.warn('Webhook: no enrollment found for Stripe session:', session.id)
    return NextResponse.json({ received: true })
  }

  // Idempotency guard — webhook may fire more than once
  if (enrollment.status === 'confirmed') {
    return NextResponse.json({ received: true })
  }

  const { error: updateErr } = await admin
    .from('enrollments')
    .update({
      status: 'confirmed',
      hold_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', enrollment.id)

  if (updateErr) {
    console.error('Webhook: failed to confirm enrollment:', updateErr.message)
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  const { error: paymentErr } = await admin.from('payments').insert({
    enrollment_id: enrollment.id,
    student_id: enrollment.student_id,
    stripe_payment_intent_id:
      typeof session.payment_intent === 'string' ? session.payment_intent : null,
    stripe_checkout_session_id: session.id,
    amount_cents: session.amount_total ?? 0,
    currency: session.currency ?? 'usd',
    status: 'succeeded',
  })

  if (paymentErr) {
    // Non-fatal: enrollment is confirmed. Payment record can be reconciled manually.
    console.error('Webhook: failed to record payment:', paymentErr.message)
  }

  const { data: sessions, error: sessionsErr } = await admin
    .from('sessions')
    .select('id')
    .eq('course_id', enrollment.course_id)

  if (sessionsErr) {
    console.error('Webhook: failed to fetch sessions for attendance:', sessionsErr.message)
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
      console.error('Webhook: failed to create attendance records:', attendanceErr.message)
    }
  }

  return NextResponse.json({ received: true })
}
