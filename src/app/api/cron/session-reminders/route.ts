import { NextRequest, NextResponse } from 'next/server'
import { notifyUpcomingSessionReminders } from '@/lib/notifications/triggers'
import { verifyCron } from '@/lib/cron-auth'

// Daily cron — fires reminders for scheduled sessions whose date is exactly
// 1 day or 7 days from "today" (per SESSION_REMINDER_LEAD_TIMES in triggers.ts).
export async function GET(req: NextRequest) {
  const blocked = verifyCron(req)
  if (blocked) return blocked

  const fired = await notifyUpcomingSessionReminders()
  return NextResponse.json({ fired })
}
