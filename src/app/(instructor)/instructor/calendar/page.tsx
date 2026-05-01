export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SessionsCalendar } from '@/components/shared/sessions-calendar'
import { SessionsList } from '@/components/shared/sessions-list'
import { SessionsViewSwitcher } from '@/components/shared/sessions-view-switcher'
import type { SessionEvent } from '@/components/shared/sessions-calendar'

type RawSession = {
  id: string
  date: string
  start_time: string
  end_time: string
  location: string | null
  status: string
  courses: {
    id: string
    title: string | null
    course_types: { name: string } | null
  }
}

export default async function InstructorCalendarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // DEC-007: sessions where this instructor is the course default (no session override)
  const { data: courseSessions } = await supabase
    .from('sessions')
    .select(`
      id, date, start_time, end_time, location, status,
      courses!inner ( id, title, course_types ( name ) )
    `)
    .eq('courses.instructor_id', user.id)
    .eq('courses.status', 'active')
    .is('instructor_id', null)
    .order('date')

  // DEC-007: sessions where this instructor is assigned at the session level
  const { data: overrideSessions } = await supabase
    .from('sessions')
    .select(`
      id, date, start_time, end_time, location, status,
      courses!inner ( id, title, course_types ( name ) )
    `)
    .eq('instructor_id', user.id)
    .eq('courses.status', 'active')
    .order('date')

  const seen = new Set<string>()
  const allRaw: RawSession[] = []

  for (const s of [...(courseSessions ?? []), ...(overrideSessions ?? [])]) {
    if (seen.has(s.id)) continue
    seen.add(s.id)
    allRaw.push(s as unknown as RawSession)
  }

  const sessions: SessionEvent[] = allRaw
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({
      id: s.id,
      date: s.date,
      startTime: s.start_time,
      endTime: s.end_time,
      location: s.location,
      label: s.courses.title ?? s.courses.course_types?.name ?? 'Session',
      href: `/instructor/sessions/${s.id}`,
      cancelled: s.status === 'cancelled',
    }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Calendar</h1>
      <SessionsViewSwitcher
        calendar={<SessionsCalendar sessions={sessions} />}
        list={<SessionsList sessions={sessions} />}
      />
    </div>
  )
}
