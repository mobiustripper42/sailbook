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

  // Fetch attendance records with student profiles via enrollment
  const { data: attendanceRecords } = await supabase
    .from('session_attendance')
    .select(`
      enrollment_id, status, notes,
      enrollment:enrollments!session_attendance_enrollment_id_fkey (
        id,
        student:profiles!enrollments_student_id_fkey ( id, first_name, last_name, email )
      )
    `)
    .eq('session_id', sessionId)

  // Build student list from attendance records
  const students = (attendanceRecords ?? []).map((a) => {
    const enrollment = a.enrollment as unknown as {
      id: string
      student: { id: string; first_name: string; last_name: string; email: string }
    }
    return {
      enrollment_id: a.enrollment_id,
      student_id: enrollment.student.id,
      first_name: enrollment.student.first_name,
      last_name: enrollment.student.last_name,
      email: enrollment.student.email,
      current_status: a.status as 'expected' | 'attended' | 'missed' | 'excused',
      notes: a.notes ?? null,
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

      {session.notes && (
        <div className="rounded-md border bg-muted/50 p-4 text-sm text-muted-foreground">
          {session.notes}
        </div>
      )}

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

