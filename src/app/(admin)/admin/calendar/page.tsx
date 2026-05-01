export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminCalendarView } from '@/components/admin/admin-calendar-view'
import type { SessionEvent } from '@/components/shared/sessions-calendar'

type RawSessionRow = {
  id: string
  date: string
  start_time: string
  end_time: string
  location: string | null
  status: string
  instructor_id: string | null
  session_instructor: { first_name: string; last_name: string } | null
}

type RawCourse = {
  id: string
  title: string | null
  course_type: { id: string; name: string } | null
  course_instructor: { first_name: string; last_name: string } | null
  sessions: RawSessionRow[]
}

export default async function AdminCalendarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.is_admin) redirect('/login')

  const { data: courses, error } = await supabase
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

  if (error) return <div className="text-destructive">{error.message}</div>

  const sessions: SessionEvent[] = []

  for (const course of (courses as unknown as RawCourse[]) ?? []) {
    for (const s of course.sessions ?? []) {
      const effectiveInstructor = s.session_instructor ?? course.course_instructor
      sessions.push({
        id: s.id,
        date: s.date,
        startTime: s.start_time,
        endTime: s.end_time,
        location: s.location,
        label: course.title ?? course.course_type?.name ?? 'Session',
        href: `/admin/courses/${course.id}`,
        cancelled: s.status === 'cancelled',
        courseTypeId: course.course_type?.id,
        courseTypeName: course.course_type?.name,
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
