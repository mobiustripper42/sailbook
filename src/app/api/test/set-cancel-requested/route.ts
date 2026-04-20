/**
 * DEV/TEST ONLY — sets an enrollment to cancel_requested and optionally seeds
 * a payment row. Pass a real Stripe test PI id via stripePaymentIntentId when
 * you want the full refund flow exercised end-to-end.
 *
 * POST /api/test/set-cancel-requested
 * Body: {
 *   enrollmentId: string
 *   stripePaymentIntentId?: string   // if provided, inserts a succeeded payment row
 *   amountCents?: number             // defaults to 25000
 * }
 * Returns: { enrollmentId }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 403 })
  }

  const {
    enrollmentId,
    stripePaymentIntentId,
    amountCents = 25000,
  } = await req.json() as {
    enrollmentId: string
    stripePaymentIntentId?: string
    amountCents?: number
  }

  if (!enrollmentId) {
    return NextResponse.json({ error: 'enrollmentId is required' }, { status: 400 })
  }

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: enrollment, error: fetchErr } = await admin
    .from('enrollments')
    .select('id, student_id')
    .eq('id', enrollmentId)
    .single()

  if (fetchErr || !enrollment) {
    return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
  }

  if (stripePaymentIntentId) {
    const { error: paymentErr } = await admin
      .from('payments')
      .insert({
        enrollment_id: enrollmentId,
        student_id: enrollment.student_id,
        stripe_payment_intent_id: stripePaymentIntentId,
        amount_cents: amountCents,
        status: 'succeeded',
      })

    if (paymentErr) return NextResponse.json({ error: paymentErr.message }, { status: 500 })
  }

  const { error: updateErr } = await admin
    .from('enrollments')
    .update({ status: 'cancel_requested', updated_at: new Date().toISOString() })
    .eq('id', enrollmentId)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ enrollmentId })
}
