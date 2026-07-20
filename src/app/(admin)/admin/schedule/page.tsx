export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ScheduleView } from '@/components/admin/schedule-view'
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

// The admin Schedule (task 10.3): all active-course sessions, viewable as a
// Month calendar or a List agenda. The course *table* lives at /admin/courses.
export default async function AdminSchedulePage() {
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

  const { data: activeCourses, error } = await supabase
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

  if (error) return <div className="text-destructive text-sm">{error.message}</div>

  const sessions: SessionEvent[] = []
  for (const course of (activeCourses as unknown as RawCourse[]) ?? []) {
    for (const s of course.sessions ?? []) {
      const effectiveInstructor = s.session_instructor ?? course.course_instructor
      sessions.push({
        id: s.id,
        date: s.date,
        startTime: s.start_time,
        endTime: s.end_time,
        location: s.location,
        label: course.title ?? course.course_type?.name ?? 'Session',
        // ?from=schedule so the course-detail breadcrumb points back to Schedule.
        href: `/admin/courses/${course.id}?from=schedule`,
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

  // Hydrate rosters for the student filter (flat query on loaded session ids).
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

    if (rosterError) console.error('Schedule roster fetch failed:', rosterError.message)

    for (const row of (roster as unknown as RawRosterRow[]) ?? []) {
      const enrollment = row.enrollment
      if (!enrollment || enrollment.status === 'cancelled') continue
      const student = enrollment.student
      if (!student) continue
      sessionById
        .get(row.session_id)
        ?.studentNames?.push(`${student.first_name} ${student.last_name}`)
    }
  }

  sessions.sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Schedule</h1>
        <Button asChild>
          <Link href="/admin/courses/new">New Course</Link>
        </Button>
      </div>
      <ScheduleView sessions={sessions} />
    </div>
  )
}
