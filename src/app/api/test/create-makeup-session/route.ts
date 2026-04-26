/**
 * DEV/TEST ONLY — creates a makeup session for an originally-cancelled session,
 * links missed-attendance rows to it, and optionally fires the makeup-assignment
 * notification trigger. Mirrors `createMakeupSession`'s side effects so tests
 * can drive it without going through the admin UI form.
 *
 * Gated behind devOnly() — local dev only, refused on Vercel deployments.
 *
 * POST /api/test/create-makeup-session
 * Body: {
 *   originalSessionId: string;
 *   courseId: string;
 *   date: string;          // 'YYYY-MM-DD'
 *   startTime: string;     // 'HH:MM'
 *   endTime: string;       // 'HH:MM'
 *   location?: string;
 *   notify?: boolean;
 * }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { notifyMakeupAssigned } from '@/lib/notifications/triggers'
import { devOnly } from '@/lib/dev-only'

export async function POST(req: NextRequest) {
  const blocked = devOnly()
  if (blocked) return blocked

  const body = (await req.json()) as {
    originalSessionId: string
    courseId: string
    date: string
    startTime: string
    endTime: string
    location?: string
    notify?: boolean
  }

  if (!body.originalSessionId || !body.courseId || !body.date || !body.startTime || !body.endTime) {
    return NextResponse.json(
      { error: 'originalSessionId, courseId, date, startTime, endTime required' },
      { status: 400 },
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const admin = createClient<Database>(supabaseUrl, serviceKey)

  // Create the makeup session
  const { data: newSession, error: sessionErr } = await admin
    .from('sessions')
    .insert({
      course_id: body.courseId,
      date: body.date,
      start_time: body.startTime,
      end_time: body.endTime,
      location: body.location ?? null,
      notes: 'Makeup for cancelled session',
    })
    .select('id')
    .single()

  if (sessionErr) return NextResponse.json({ error: sessionErr.message }, { status: 500 })

  // Find missed attendance on the original session that has no makeup yet
  const { data: missedRecords, error: missedErr } = await admin
    .from('session_attendance')
    .select('id, enrollment_id')
    .eq('session_id', body.originalSessionId)
    .eq('status', 'missed')
    .is('makeup_session_id', null)

  if (missedErr) return NextResponse.json({ error: missedErr.message }, { status: 500 })

  if (missedRecords && missedRecords.length > 0) {
    // Insert attendance rows on the new makeup session
    const attendanceRows = missedRecords.map((r) => ({
      session_id: newSession.id,
      enrollment_id: r.enrollment_id,
      status: 'expected' as const,
    }))
    const { error: insertErr } = await admin.from('session_attendance').insert(attendanceRows)
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

    // Link original missed records to the makeup session
    const missedIds = missedRecords.map((r) => r.id)
    const { error: linkErr } = await admin
      .from('session_attendance')
      .update({ makeup_session_id: newSession.id, updated_at: new Date().toISOString() })
      .in('id', missedIds)

    if (linkErr) return NextResponse.json({ error: linkErr.message }, { status: 500 })

    if (body.notify) {
      await notifyMakeupAssigned(newSession.id)
    }
  }

  return NextResponse.json({ makeupSessionId: newSession.id })
}
