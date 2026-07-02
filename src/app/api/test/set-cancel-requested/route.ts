/**
 * DEV/TEST ONLY — sets an enrollment's status (cancel_requested by default)
 * and optionally seeds a payment row. Pass a real Stripe test PI id via
 * stripePaymentIntentId when you want the full refund flow exercised
 * end-to-end.
 *
 * POST /api/test/set-cancel-requested
 * Body: {
 *   enrollmentId: string
 *   stripePaymentIntentId?: string   // if provided, inserts a succeeded payment row
 *   amountCents?: number             // defaults to 25000
 *   status?: string                  // defaults to 'cancel_requested'; pass
 *                                     // 'confirmed' to seed a payment on a
 *                                     // still-confirmed enrollment (#106
 *                                     // admin-initiated refund/credit path)
 * }
 * Returns: { enrollmentId }
 *
 * Gated behind devOnly() — local dev only, refused on Vercel deployments.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { devOnly } from '@/lib/dev-only'

export async function POST(req: NextRequest) {
  const blocked = devOnly()
  if (blocked) return blocked

  const {
    enrollmentId,
    stripePaymentIntentId,
    amountCents = 25000,
    status = 'cancel_requested',
  } = await req.json() as {
    enrollmentId: string
    stripePaymentIntentId?: string
    amountCents?: number
    status?: string
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
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', enrollmentId)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ enrollmentId })
}
