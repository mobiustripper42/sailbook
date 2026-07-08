/**
 * DEV/TEST ONLY — directly inserts a credit_ledger row for a student, so
 * #107 checkout-redemption tests don't need to drive the full #106 admin
 * refund/credit UI just to set up a balance.
 *
 * POST /api/test/seed-credit
 * Body: {
 *   studentEmail: string
 *   amountCents: number
 *   absolute?: boolean   // if true, first offsets the CURRENT balance to
 *                         // zero (an extra ledger row — the log stays
 *                         // append-only) so the student ends up at exactly
 *                         // `amountCents`, regardless of leftover balance
 *                         // from other tests/runs on a shared fixture.
 * }
 * Returns: { studentId: string }
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

  const { studentEmail, amountCents, absolute } = await req.json() as {
    studentEmail: string
    amountCents: number
    absolute?: boolean
  }

  if (!studentEmail || !amountCents) {
    return NextResponse.json({ error: 'studentEmail and amountCents are required' }, { status: 400 })
  }

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: users, error: userErr } = await admin.auth.admin.listUsers()
  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 })

  const user = users.users.find((u) => u.email === studentEmail)
  if (!user) return NextResponse.json({ error: `No user found for ${studentEmail}` }, { status: 404 })

  if (absolute) {
    const { data: rows, error: sumErr } = await admin
      .from('credit_ledger')
      .select('amount_cents')
      .eq('student_id', user.id)
    if (sumErr) return NextResponse.json({ error: sumErr.message }, { status: 500 })

    const currentBalance = (rows ?? []).reduce((sum, r) => sum + r.amount_cents, 0)
    if (currentBalance !== 0) {
      const { error: offsetErr } = await admin.from('credit_ledger').insert({
        student_id: user.id,
        amount_cents: -currentBalance,
        reason: 'Test fixture reset to zero',
      })
      if (offsetErr) return NextResponse.json({ error: offsetErr.message }, { status: 500 })
    }
  }

  const { error: insertErr } = await admin.from('credit_ledger').insert({
    student_id: user.id,
    amount_cents: amountCents,
    reason: 'Test fixture seed',
  })
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

  return NextResponse.json({ studentId: user.id })
}
