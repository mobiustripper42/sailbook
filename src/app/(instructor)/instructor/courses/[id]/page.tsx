import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fmtDateLong, fmtTime } from '@/lib/utils'
import { formatSchedule } from '@/lib/course-schedule'

// #142: read-only instructor course view — the click-through target for course
// titles in a student's history. Access mirrors the session roster page (DEC-007):
// the course-level instructor, OR any instructor who teaches one of its sessions.
export default async function InstructorCoursePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: course } = await supabase
    .from('courses')
    .select(`
      id, title, section_label, capacity, status, instructor_id,
      course_types ( name, short_code ),
      sessions ( id, date, start_time, end_time, location, status, instructor_id )
    `)
    .eq('id', id)
    .single()

  if (!course) notFound()

  const type = course.course_types as unknown as { name: string; short_code: string } | null
  const sessions = (course.sessions as unknown as {
    id: string; date: string; start_time: string; end_time: string
    location: string | null; status: string; instructor_id: string | null
  }[]) ?? []

  // DEC-007 authorization: course-level OR any session-level assignment.
  const teaches = course.instructor_id === user.id || sessions.some((s) => s.instructor_id === user.id)
  if (!teaches) redirect('/instructor/dashboard')

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id, student_id, status,
      student:profiles!enrollments_student_id_fkey ( first_name, last_name )
    `)
    .eq('course_id', id)
    .neq('status', 'cancelled')
    .order('enrolled_at')

  const roster = (enrollments ?? []).map((e) => {
    const student = e.student as unknown as { first_name: string; last_name: string } | null
    return {
      id: e.id,
      studentId: e.student_id,
      name: student ? `${student.last_name}, ${student.first_name}` : '—',
      status: e.status as string,
    }
  })

  const confirmed = roster.filter((r) => r.status === 'confirmed' || r.status === 'completed').length
  const courseTitle = course.title ?? type?.name ?? 'Course'
  const sortedSessions = [...sessions].sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
  const schedule = formatSchedule(
    sessions
      .filter((s) => s.status !== 'cancelled')
      .map((s) => ({ date: s.date, start_time: s.start_time, end_time: s.end_time })),
  )

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/instructor/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to dashboard
        </Link>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold">{courseTitle}</h1>
          {course.section_label && (
            <Badge variant="neutral" className="font-normal">{course.section_label}</Badge>
          )}
        </div>
        {course.title && type?.name && <p className="text-muted-foreground">{type.name}</p>}
        <p className="text-sm text-muted-foreground">{schedule}</p>
        <p className="text-sm text-muted-foreground">
          Enrolled: {confirmed} / {course.capacity}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roster</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {roster.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">No students enrolled.</p>
          ) : (
            <ul className="divide-y">
              {roster.map((r) => (
                <li key={r.id} className="flex items-center justify-between px-6 py-2.5 text-sm">
                  <Link
                    href={`/instructor/students/${r.studentId}`}
                    className="font-medium hover:underline underline-offset-2"
                  >
                    {r.name}
                  </Link>
                  {r.status !== 'confirmed' && (
                    <span className="text-xs text-muted-foreground capitalize">{r.status}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sortedSessions.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">No sessions scheduled.</p>
          ) : (
            <ul className="divide-y">
              {sortedSessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between px-6 py-2.5 text-sm">
                  <Link
                    href={`/instructor/sessions/${s.id}`}
                    className="font-medium hover:underline underline-offset-2"
                  >
                    {fmtDateLong(s.date)}
                    <span className="ml-2 text-muted-foreground font-normal">
                      {fmtTime(s.start_time)}–{fmtTime(s.end_time)}
                    </span>
                  </Link>
                  {s.status === 'cancelled' && <Badge variant="alert">Cancelled</Badge>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
