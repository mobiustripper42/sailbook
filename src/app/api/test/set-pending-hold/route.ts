/**
 * DEV/TEST ONLY — creates or updates an enrollment to pending_payment status.
 * Used by Playwright tests to set up hold expiry scenarios.
 *
 * POST /api/test/set-pending-hold
 * Body: { courseId: string; studentEmail: string; expired?: boolean; checkoutSessionId?: string }
 *   expired: true  → hold_expires_at set 1 minute in the past
 *   expired: false → hold_expires_at set 30 minutes in the future (default)
 *   checkoutSessionId → stripe_checkout_session_id to set (default: 'cs_test_placeholder')
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 403 })
  }

  const { courseId, studentEmail, expired = false, checkoutSessionId = 'cs_test_placeholder' } = await req.json() as {
    courseId: string
    studentEmail: string
    expired?: boolean
    checkoutSessionId?: string
  }

  if (!courseId || !studentEmail) {
    return NextResponse.json({ error: 'courseId and studentEmail are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: users, error: userErr } = await admin.auth.admin.listUsers()
  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 })

  const user = users.users.find((u) => u.email === studentEmail)
  if (!user) return NextResponse.json({ error: `No user found for ${studentEmail}` }, { status: 404 })

  const now = new Date()
  const holdExpiresAt = expired
    ? new Date(now.getTime() - 60 * 1000).toISOString()
    : new Date(now.getTime() + 30 * 60 * 1000).toISOString()

  const { data: existing } = await admin
    .from('enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('student_id', user.id)
    .maybeSingle()

  if (existing) {
    const { error } = await admin
      .from('enrollments')
      .update({
        status: 'pending_payment',
        hold_expires_at: holdExpiresAt,
        stripe_checkout_session_id: checkoutSessionId,
      })
      .eq('id', existing.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ enrollmentId: existing.id, holdExpiresAt })
  }

  const { data: newEnrollment, error: insertErr } = await admin
    .from('enrollments')
    .insert({
      course_id: courseId,
      student_id: user.id,
      status: 'pending_payment',
      hold_expires_at: holdExpiresAt,
      stripe_checkout_session_id: checkoutSessionId,
    })
    .select('id')
    .single()

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

  return NextResponse.json({ enrollmentId: newEnrollment.id, holdExpiresAt })
}
