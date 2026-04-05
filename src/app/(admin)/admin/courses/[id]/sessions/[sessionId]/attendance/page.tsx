import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fmtTime } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import AttendanceForm from '@/components/admin/attendance-form'

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>
}) {
  const { id: courseId, sessionId } = await params
  const supabase = await createClient()

  // Fetch session with course info
  const { data: session } = await supabase
    .from('sessions')
    .select(`
      *,
      course:courses!sessions_course_id_fkey (
        id, title, capacity,
        course_types ( name, short_code )
      ),
      session_instructor:profiles!sessions_instructor_id_fkey ( first_name, last_name )
    `)
    .eq('id', sessionId)
    .eq('course_id', courseId)
    .single()

  if (!session) notFound()

  const course = session.course as {
    id: string; title: string | null; capacity: number
    course_types: { name: string; short_code: string } | null
  }
  const sessionInstructor = session.session_instructor as { first_name: string; last_name: string } | null

  // Fetch enrollments (non-cancelled) with student profiles
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      student:profiles!enrollments_student_id_fkey ( id, first_name, last_name, email )
    `)
    .eq('course_id', courseId)
    .neq('status', 'cancelled')
    .order('enrolled_at')

  // Fetch existing attendance records for this session
  const { data: existingAttendance } = await supabase
    .from('session_attendance')
    .select('enrollment_id, status, notes')
    .eq('session_id', sessionId)

  const attendanceMap = new Map(
    (existingAttendance ?? []).map((a) => [a.enrollment_id, a])
  )

  // Build student list with current attendance status
  const students = (enrollments ?? []).map((e) => {
    const student = e.student as unknown as { id: string; first_name: string; last_name: string; email: string }
    const existing = attendanceMap.get(e.id)
    return {
      enrollment_id: e.id,
      student_id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      current_status: (existing?.status ?? 'expected') as 'expected' | 'attended' | 'missed' | 'excused',
      notes: existing?.notes ?? null,
    }
  })

  const courseName = course.title ?? course.course_types?.name ?? 'Course'
  const dateStr = new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/admin/courses" className="hover:underline">Courses</Link>
            {' / '}
            <Link href={`/admin/courses/${courseId}`} className="hover:underline">{courseName}</Link>
            {' / Attendance'}
          </p>
          <h1 className="text-2xl font-semibold mt-1">{dateStr}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {fmtTime(session.start_time)} – {fmtTime(session.end_time)}
            {session.location && ` · ${session.location}`}
            {sessionInstructor && ` · ${sessionInstructor.first_name} ${sessionInstructor.last_name}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={session.status === 'scheduled' ? 'default' : session.status === 'cancelled' ? 'destructive' : 'secondary'}>
            {session.status}
          </Badge>
          <Button variant="outline" asChild>
            <Link href={`/admin/courses/${courseId}`}>Back to Course</Link>
          </Button>
        </div>
      </div>

      {session.status === 'cancelled' && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm">
          This session was cancelled{session.cancel_reason ? `: ${session.cancel_reason}` : '.'}
          {' '}Outstanding attendance records were marked as missed.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Attendance ({students.length} students)</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceForm courseId={courseId} sessionId={sessionId} students={students} />
        </CardContent>
      </Card>
    </div>
  )
}

