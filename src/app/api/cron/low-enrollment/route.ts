import { NextRequest, NextResponse } from 'next/server'
import { notifyLowEnrollmentCourses } from '@/lib/notifications/triggers'
import { verifyCron } from '@/lib/cron-auth'

export async function GET(req: NextRequest) {
  const blocked = verifyCron(req)
  if (blocked) return blocked

  const alerted = await notifyLowEnrollmentCourses()
  return NextResponse.json({ alerted })
}
