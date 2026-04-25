import { NextRequest, NextResponse } from 'next/server'
import { notifyLowEnrollmentCourses } from '@/lib/notifications/triggers'

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const alerted = await notifyLowEnrollmentCourses()
  return NextResponse.json({ alerted })
}
