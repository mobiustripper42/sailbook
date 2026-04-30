/**
 * DEV/TEST ONLY — cancels a session (status → 'cancelled', flips expected
 * attendance to missed) and optionally fires the cancellation notification
 * trigger. Mirrors the `cancelSession` server action's side effects so tests
 * can drive it without going through the admin UI form.
 *
 * Gated behind devOnly() — local dev only, refused on Vercel deployments.
 *
 * POST /api/test/cancel-session
 * Body: { sessionId: string; cancelReason?: string; notify?: boolean }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { notifySessionCancelled } from '@/lib/notifications/triggers'
import { devOnly } from '@/lib/dev-only'

export async function POST(req: NextRequest) {
  const blocked = devOnly()
  if (blocked) return blocked

  const { sessionId, cancelReason, notify } = (await req.json()) as {
    sessionId: string
    cancelReason?: string
    notify?: boolean
  }

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const admin = createClient<Database>(supabaseUrl, serviceKey)

  const { error: sessionErr } = await admin
    .from('sessions')
    .update({
      status: 'cancelled',
      cancel_reason: cancelReason ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  if (sessionErr) return NextResponse.json({ error: sessionErr.message }, { status: 500 })

  const { error: attendanceErr } = await admin
    .from('session_attendance')
    .update({ status: 'missed', updated_at: new Date().toISOString() })
    .eq('session_id', sessionId)
    .eq('status', 'expected')

  if (attendanceErr) return NextResponse.json({ error: attendanceErr.message }, { status: 500 })

  if (notify) {
    await notifySessionCancelled(sessionId)
  }

  return NextResponse.json({ ok: true })
}
