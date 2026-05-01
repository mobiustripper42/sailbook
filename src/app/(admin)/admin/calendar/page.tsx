export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminCalendarView } from '@/components/admin/admin-calendar-view'
import type { SessionEvent } from '@/components/shared/sessions-calendar'

export default async function AdminCalendarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: courses } = await supabase
    .from('courses')
    .select(`
      id, title,
      course_type:course_types ( id, name ),
      course_instructor:profiles!courses_instructor_id_fkey ( first_name, last_name ),
      sessions (
        id, date, start_time, end_time, location, status, instructor_id,
        session_instructor:profiles!sessions_instructor_id_fkey ( first_name, last_name )
      )
    `)
    .eq('status', 'active')
    .order('created_at')

  const sessions: SessionEvent[] = []

  for (const course of courses ?? []) {
    const ct = course.course_type as unknown as { id: string; name: string } | null
    const courseInstructor = course.course_instructor as unknown as {
      first_name: string
      last_name: string
    } | null

    for (const s of (course.sessions as unknown as {
      id: string
      date: string
      start_time: string
      end_time: string
      location: string | null
      status: string
      instructor_id: string | null
      session_instructor: { first_name: string; last_name: string } | null
    }[]) ?? []) {
      const effectiveInstructor = s.session_instructor ?? courseInstructor
      sessions.push({
        id: s.id,
        date: s.date,
        startTime: s.start_time,
        endTime: s.end_time,
        location: s.location,
        label: course.title ?? ct?.name ?? 'Session',
        href: `/admin/courses/${course.id}`,
        cancelled: s.status === 'cancelled',
        courseTypeId: ct?.id,
        courseTypeName: ct?.name,
        instructorName: effectiveInstructor
          ? `${effectiveInstructor.first_name} ${effectiveInstructor.last_name}`
          : null,
      })
    }
  }

  sessions.sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Calendar</h1>
      <AdminCalendarView sessions={sessions} />
    </div>
  )
}
