import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/empty-state'
import { Badge } from '@/components/ui/badge'
import { fmtDate, fmtTime } from '@/lib/utils'

type MissedRecord = {
  studentId: string
  studentName: string
  email: string
  courseId: string
  courseName: string
  sessionId: string
  sessionDate: string
  startTime: string
  endTime: string
  location: string | null
}

async function getMissedSessions() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('session_attendance')
    .select(`
      status,
      makeup_session_id,
      session:sessions!session_attendance_session_id_fkey (
        id, date, start_time, end_time, location,
        course:courses!sessions_course_id_fkey (
          id, title,
          course_types ( name )
        )
      ),
      enrollment:enrollments!session_attendance_enrollment_id_fkey (
        student:profiles!enrollments_student_id_fkey (
          id, first_name, last_name, email
        )
      )
    `)
    .eq('status', 'missed')
    .is('makeup_session_id', null)

  if (error) return { error: error.message, data: [] as MissedRecord[] }

  return { error: null, data: (data ?? []).map((row) => {
    const session = row.session as unknown as {
      id: string; date: string; start_time: string; end_time: string; location: string | null
      course: { id: string; title: string | null; course_types: { name: string } | null }
    }
    const student = (row.enrollment as unknown as {
      student: { id: string; first_name: string; last_name: string; email: string }
    }).student

    return {
      studentId: student.id,
      studentName: `${student.first_name} ${student.last_name}`,
      email: student.email,
      courseId: session.course.id,
      courseName: session.course.title ?? session.course.course_types?.name ?? 'Course',
      sessionId: session.id,
      sessionDate: session.date,
      startTime: session.start_time,
      endTime: session.end_time,
      location: session.location,
    }
  }).sort((a, b) => a.studentName.localeCompare(b.studentName) || a.sessionDate.localeCompare(b.sessionDate)) }
}

type GroupedByStudent = {
  studentId: string
  studentName: string
  email: string
  records: MissedRecord[]
}

function groupByStudent(records: MissedRecord[]): GroupedByStudent[] {
  const map = new Map<string, GroupedByStudent>()
  for (const r of records) {
    let group = map.get(r.studentId)
    if (!group) {
      group = { studentId: r.studentId, studentName: r.studentName, email: r.email, records: [] }
      map.set(r.studentId, group)
    }
    group.records.push(r)
  }
  return Array.from(map.values()).sort((a, b) => b.records.length - a.records.length)
}

export default async function MissedSessionsPage() {
  const { error, data: records } = await getMissedSessions()
  if (error) return <div className="text-destructive text-sm">{error}</div>
  const groups = groupByStudent(records)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Missed Sessions</h1>

      {groups.length === 0 ? (
        <EmptyState message="No outstanding missed sessions. Everyone's accounted for." />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {records.length} missed {records.length === 1 ? 'session' : 'sessions'} across{' '}
            {groups.length} {groups.length === 1 ? 'student' : 'students'}
          </p>

          {groups.map((group) => (
            <Card key={group.studentId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    <Link
                      href={`/admin/students/${group.studentId}/edit`}
                      className="hover:underline"
                    >
                      {group.studentName}
                    </Link>
                  </CardTitle>
                  <Badge variant="warn">
                    {group.records.length} missed
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{group.email}</p>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {group.records.map((r) => (
                    <div
                      key={`${r.sessionId}`}
                      className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0"
                    >
                      <div>
                        <Link
                          href={`/admin/courses/${r.courseId}`}
                          className="font-medium hover:underline"
                        >
                          {r.courseName}
                        </Link>
                        <span className="text-muted-foreground ml-2">
                          {fmtDate(r.sessionDate)} · {fmtTime(r.startTime)}–{fmtTime(r.endTime)}
                        </span>
                        {r.location && (
                          <span className="text-muted-foreground"> · {r.location}</span>
                        )}
                      </div>
                      <Link
                        href={`/admin/courses/${r.courseId}/sessions/${r.sessionId}/attendance`}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        View attendance
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
