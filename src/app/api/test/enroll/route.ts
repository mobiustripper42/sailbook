/**
 * DEV/TEST ONLY — creates a confirmed enrollment without going through Stripe.
 * Gated behind NEXT_PUBLIC_DEV_MODE. Never deploy this without that flag false.
 *
 * POST /api/test/enroll
 * Body: { courseId: string; studentEmail: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 403 })
  }

  const { courseId, studentEmail } = await req.json() as {
    courseId: string
    studentEmail: string
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
    await admin
      .from('session_attendance')
      .upsert(
        sessions.map((s) => ({
          session_id: s.id,
          enrollment_id: enrollmentId,
          status: 'expected' as const,
        })),
        { onConflict: 'session_id,enrollment_id' }
      )
  }

  return NextResponse.json({ enrollmentId })
}
