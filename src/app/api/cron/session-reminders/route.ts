import { NextRequest, NextResponse } from 'next/server'
import { notifyUpcomingSessionReminders } from '@/lib/notifications/triggers'

// Daily cron — fires reminders for scheduled sessions whose date is exactly
// 1 day or 7 days from "today" (per SESSION_REMINDER_LEAD_TIMES in triggers.ts).
//
// Auth: same pattern as expire-holds and low-enrollment. CRON_SECRET unset in
// dev (open access); in prod Vercel sends Authorization: Bearer $CRON_SECRET.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const fired = await notifyUpcomingSessionReminders()
  return NextResponse.json({ fired })
}
