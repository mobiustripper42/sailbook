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

type RawRosterRow = {
  session_id: string
  enrollment: {
    status: string
    student: { first_name: string; last_name: string } | null
  } | null
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
        studentNames: [],
      })
    }
  }

  // Attach the roster per session so the calendar can filter by student.
  // Second flat query keyed on the loaded session ids, rather than a deep
  // courses→sessions→attendance→enrollments→profiles nested select.
  const sessionById = new Map(sessions.map((s) => [s.id, s]))
  if (sessionById.size > 0) {
    const { data: roster, error: rosterError } = await supabase
      .from('session_attendance')
      .select(`
        session_id,
        enrollment:enrollments!session_attendance_enrollment_id_fkey (
          status,
          student:profiles!enrollments_student_id_fkey ( first_name, last_name )
        )
      `)
      .in('session_id', [...sessionById.keys()])

    // Non-fatal to the page render — a failure just leaves the student filter
    // empty rather than blanking the calendar, but it shouldn't fail silently.
    if (rosterError) console.error('Calendar roster fetch failed:', rosterError.message)

    for (const row of (roster as unknown as RawRosterRow[]) ?? []) {
      const enrollment = row.enrollment
      // Skip cancelled enrollments; every remaining status that has attendance
      // rows (in practice confirmed onward — rows are seeded at confirmation)
      // counts toward the session's effective roster.
      if (!enrollment || enrollment.status === 'cancelled') continue
      const student = enrollment.student
      if (!student) continue
      const name = `${student.first_name} ${student.last_name}`
      sessionById.get(row.session_id)?.studentNames?.push(name)
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
