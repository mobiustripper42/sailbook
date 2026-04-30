/**
 * DEV/TEST ONLY — runs the session-reminders trigger directly. Optional
 * `referenceDate` lets tests simulate "today" without faking the system clock,
 * so a session dated 7 days from `referenceDate` will fire its 1-week reminder.
 *
 * Gated behind devOnly() — local dev only, refused on Vercel deployments.
 *
 * POST /api/test/run-session-reminders
 * Body: { referenceDate?: string }   // 'YYYY-MM-DD'
 * Returns: { fired: number }
 */
import { NextRequest, NextResponse } from 'next/server'
import { notifyUpcomingSessionReminders } from '@/lib/notifications/triggers'
import { devOnly } from '@/lib/dev-only'

export async function POST(req: NextRequest) {
  const blocked = devOnly()
  if (blocked) return blocked

  const { referenceDate } = (await req.json().catch(() => ({}))) as {
    referenceDate?: string
  }

  // Parse referenceDate as UTC midnight to match the trigger's UTC date math.
  let ref: Date | undefined
  if (referenceDate) {
    const [y, m, d] = referenceDate.split('-').map(Number)
    if (!y || !m || !d) {
      return NextResponse.json({ error: 'referenceDate must be YYYY-MM-DD' }, { status: 400 })
    }
    ref = new Date(Date.UTC(y, m - 1, d))
  }

  const fired = await notifyUpcomingSessionReminders(ref)
  return NextResponse.json({ fired })
}
