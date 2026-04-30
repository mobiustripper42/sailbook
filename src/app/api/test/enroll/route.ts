/**
 * DEV/TEST ONLY — creates a confirmed enrollment without going through Stripe.
 * Gated behind NODE_ENV !== 'development'. Never deploy with NODE_ENV=development.
 *
 * POST /api/test/enroll
 * Body: { courseId: string; studentEmail: string; notify?: boolean }
 *   - notify: when true, fires notifyEnrollmentConfirmed after the upsert
 *     (used by enrollment-notifications.spec.ts to exercise the trigger)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { notifyEnrollmentConfirmed } from '@/lib/notifications/triggers'
import { devOnly } from '@/lib/dev-only'

export async function POST(req: NextRequest) {
  const blocked = devOnly()
  if (blocked) return blocked

  const { courseId, studentEmail, notify } = await req.json() as {
    courseId: string
    studentEmail: string
    notify?: boolean
  }

  if (!courseId || !studentEmail) {
    return NextResponse.json({ error: 'courseId and studentEmail are required' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  // Service role client bypasses RLS — only safe in dev mode
  const admin = createClient<Database>(supabaseUrl, serviceKey)

  // Look up the student by email
  const { data: users, error: userErr } = await admin.auth.admin.listUsers()
  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 })

  const user = users.users.find((u) => u.email === studentEmail)
  if (!user) return NextResponse.json({ error: `No user found for ${studentEmail}` }, { status: 404 })

  // Upsert enrollment as confirmed
  const { data: existing } = await admin
    .from('enrollments')
    .select('id, status')
    .eq('course_id', courseId)
    .eq('student_id', user.id)
    .maybeSingle()

  let enrollmentId: string

  if (existing) {
    const { error } = await admin
      .from('enrollments')
      .update({ status: 'confirmed', enrolled_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    enrollmentId = existing.id
  } else {
    const { data: newEnrollment, error } = await admin
      .from('enrollments')
      .insert({ course_id: courseId, student_id: user.id, status: 'confirmed' })
      .select('id')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    enrollmentId = newEnrollment.id
  }

  // Auto-create attendance records
  const { data: sessions } = await admin
    .from('sessions')
    .select('id')
    .eq('course_id', courseId)

  if (sessions && sessions.length > 0) {
    const { error: attendanceErr } = await admin
      .from('session_attendance')
      .upsert(
        sessions.map((s) => ({
          session_id: s.id,
          enrollment_id: enrollmentId,
          status: 'expected' as const,
        })),
        { onConflict: 'session_id,enrollment_id' }
      )
    if (attendanceErr) return NextResponse.json({ error: attendanceErr.message }, { status: 500 })
  }

  if (notify) {
    await notifyEnrollmentConfirmed(enrollmentId)
  }

  return NextResponse.json({ enrollmentId })
}
