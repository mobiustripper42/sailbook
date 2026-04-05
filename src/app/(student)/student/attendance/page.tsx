import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { fmtDate, fmtTime } from '@/lib/utils'

type AttendanceRecord = {
  sessionId: string
  sessionDate: string
  startTime: string
  endTime: string
  location: string | null
  status: string
  makeupSessionId: string | null
  cancelled: boolean
}

type CourseAttendance = {
  courseId: string
  courseName: string
  instructorName: string | null
  records: AttendanceRecord[]
  missedCount: number
}

async function getAttendanceHistory(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('session_attendance')
    .select(`
      status,
      makeup_session_id,
      session:sessions!session_attendance_session_id_fkey (
        id, date, start_time, end_time, location, cancelled,
        course:courses!sessions_course_id_fkey (
          id, title,
          course_types ( name ),
          instructor:profiles!courses_instructor_id_fkey ( first_name, last_name )
        )
      ),
      enrollment:enrollments!session_attendance_enrollment_id_fkey (
        student_id
      )
    `)
    .eq('enrollment.student_id', userId)
    .not('enrollment', 'is', null)

  if (error) return { error: error.message, data: [] as CourseAttendance[] }

  type RawSession = {
    id: string; date: string; start_time: string; end_time: string
    location: string | null; cancelled: boolean
    course: {
      id: string; title: string | null
      course_types: { name: string } | null
      instructor: { first_name: string; last_name: string } | null
    }
  }

  // Group by course
  const courseMap = new Map<string, CourseAttendance>()

  for (const row of data ?? []) {
    const enrollment = row.enrollment as unknown as { student_id: string } | null
    if (!enrollment) continue

    const session = row.session as unknown as RawSession
    const course = session.course
    const courseId = course.id

    let group = courseMap.get(courseId)
    if (!group) {
      const instructor = course.instructor
      group = {
        courseId,
        courseName: course.title ?? course.course_types?.name ?? 'Course',
        instructorName: instructor ? `${instructor.first_name} ${instructor.last_name}` : null,
        records: [],
        missedCount: 0,
      }
      courseMap.set(courseId, group)
    }

    const isMissedNeedingMakeup = row.status === 'missed' && !row.makeup_session_id
    if (isMissedNeedingMakeup) group.missedCount++

    group.records.push({
      sessionId: session.id,
      sessionDate: session.date,
      startTime: session.start_time,
      endTime: session.end_time,
      location: session.location,
      status: row.status as string,
      makeupSessionId: row.makeup_session_id as string | null,
      cancelled: session.cancelled,
    })
  }

  // Sort records within each course by date
  for (const group of courseMap.values()) {
    group.records.sort((a, b) => a.sessionDate.localeCompare(b.sessionDate))
  }

  // Sort courses: those with missed sessions first, then alphabetically
  const courses = Array.from(courseMap.values()).sort((a, b) =>
    b.missedCount - a.missedCount || a.courseName.localeCompare(b.courseName)
  )

  return { error: null, data: courses }
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  attended: { label: 'Attended', variant: 'default' },
  missed: { label: 'Missed', variant: 'destructive' },
  excused: { label: 'Excused', variant: 'secondary' },
  expected: { label: 'Upcoming', variant: 'outline' },
}

export default async function StudentAttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error, data: courses } = await getAttendanceHistory(user.id)
  if (error) return <div className="p-8 text-destructive">{error}</div>

  const totalMissed = courses.reduce((sum, c) => sum + c.missedCount, 0)

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Attendance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your attendance history across all courses.
        </p>
      </div>

      {totalMissed > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4">
            <p className="text-sm font-medium">
              You have {totalMissed} missed {totalMissed === 1 ? 'session' : 'sessions'} that
              {totalMissed === 1 ? ' needs' : ' need'} a makeup. Contact the school to schedule.
            </p>
          </CardContent>
        </Card>
      )}

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No attendance records yet. Enroll in a course to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <Card key={course.courseId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{course.courseName}</CardTitle>
                  {course.missedCount > 0 && (
                    <Badge variant="destructive">
                      {course.missedCount} needs makeup
                    </Badge>
                  )}
                </div>
                {course.instructorName && (
                  <p className="text-xs text-muted-foreground">
                    Instructor: {course.instructorName}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {course.records.map((r) => {
                    const config = statusConfig[r.status] ?? statusConfig.expected
                    const needsMakeup = r.status === 'missed' && !r.makeupSessionId

                    return (
                      <div
                        key={r.sessionId}
                        className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-2">
                          <span className={r.cancelled ? 'line-through text-muted-foreground' : ''}>
                            {fmtDate(r.sessionDate)} · {fmtTime(r.startTime)}–{fmtTime(r.endTime)}
                          </span>
                          {r.location && (
                            <span className="text-muted-foreground">· {r.location}</span>
                          )}
                          {r.cancelled && (
                            <Badge variant="outline" className="text-xs">Cancelled</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {needsMakeup && (
                            <span className="text-xs text-destructive font-medium">
                              Needs makeup
                            </span>
                          )}
                          {r.status === 'missed' && r.makeupSessionId && (
                            <span className="text-xs text-muted-foreground">
                              Makeup scheduled
                            </span>
                          )}
                          <Badge variant={config.variant}>{config.label}</Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
