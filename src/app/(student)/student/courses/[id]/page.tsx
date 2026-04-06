import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { fmtDateLong, fmtTime } from '@/lib/utils'
import { attendanceStatusConfig } from '@/lib/attendance'
import type { AttendanceStatus } from '@/lib/attendance'
import EnrollButton from '@/components/student/enroll-button'

export default async function StudentCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: course } = await supabase
    .from('courses')
    .select(`
      id, title, description, capacity, price, status,
      course_types ( name, short_code, description, certification_body ),
      instructor:profiles!courses_instructor_id_fkey ( first_name, last_name )
    `)
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (!course) notFound()

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, date, start_time, end_time, location, status')
    .eq('course_id', id)
    .order('date')

  // Count active enrollments for spots remaining
  const { count: activeEnrollments } = await supabase
    .from('enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', id)
    .neq('status', 'cancelled')

  // Check current user's enrollment status
  const { data: myEnrollment } = user
    ? await supabase
        .from('enrollments')
        .select('id, status')
        .eq('course_id', id)
        .eq('student_id', user.id)
        .single()
    : { data: null }

  const isEnrolled = myEnrollment && myEnrollment.status !== 'cancelled'

  // Fetch attendance records if enrolled
  const { data: myAttendance } = isEnrolled
    ? await supabase
        .from('session_attendance')
        .select('session_id, status, makeup_session_id')
        .eq('enrollment_id', myEnrollment.id)
    : { data: null }

  const attendanceMap = new Map(
    myAttendance?.map((a) => [a.session_id, a]) ?? []
  )

  const type = course.course_types as unknown as {
    name: string
    short_code: string
    description: string | null
    certification_body: string | null
  } | null
  const instructor = course.instructor as unknown as { first_name: string; last_name: string } | null

  const spotsRemaining = course.capacity - (activeEnrollments ?? 0)
  const isFull = spotsRemaining <= 0
  const description = course.description ?? type?.description
  const cancelledCount = sessions?.filter((s) => s.status === 'cancelled').length ?? 0

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div>
        <Link
          href="/student/courses"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to courses
        </Link>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold">{course.title ?? type?.name}</h1>
          {type?.short_code && (
            <Badge variant="outline">{type.short_code}</Badge>
          )}
          {type?.certification_body && (
            <Badge variant="secondary">{type.certification_body}</Badge>
          )}
        </div>
        {course.title && type?.name && (
          <p className="text-muted-foreground">{type.name}</p>
        )}
      </div>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Instructor</p>
          <p className="font-medium">
            {instructor ? `${instructor.first_name} ${instructor.last_name}` : '—'}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Price</p>
          <p className="font-medium">{course.price != null ? `$${course.price}` : '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Sessions</p>
          <p className="font-medium">
            {sessions?.length ?? 0}
            {cancelledCount > 0 && (
              <span className="text-muted-foreground font-normal"> ({cancelledCount} cancelled)</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Spots</p>
          <p className="font-medium">
            {isFull ? (
              <span className="text-muted-foreground">Full</span>
            ) : (
              `${spotsRemaining} of ${course.capacity} remaining`
            )}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!sessions?.length ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">No sessions scheduled yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  {isEnrolled && <TableHead>Attendance</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => {
                  const isCancelled = s.status === 'cancelled'
                  const attendance = attendanceMap.get(s.id)
                  const dimClass = isCancelled ? 'text-muted-foreground' : ''

                  return (
                    <TableRow key={s.id} className={isCancelled ? 'opacity-60' : ''}>
                      <TableCell className={isCancelled ? 'line-through text-muted-foreground' : ''}>
                        {fmtDateLong(s.date)}
                      </TableCell>
                      <TableCell className={`whitespace-nowrap ${dimClass}`}>
                        {fmtTime(s.start_time)} – {fmtTime(s.end_time)}
                      </TableCell>
                      <TableCell className={dimClass}>{s.location ?? '—'}</TableCell>
                      <TableCell>
                        {isCancelled && (
                          <Badge variant="outline">Cancelled</Badge>
                        )}
                      </TableCell>
                      {isEnrolled && (
                        <TableCell>
                          {attendance ? (
                            <div className="flex items-center gap-2">
                              <Badge variant={attendanceStatusConfig[attendance.status as AttendanceStatus].variant}>
                                {attendanceStatusConfig[attendance.status as AttendanceStatus].label}
                              </Badge>
                              {attendance.status === 'missed' && !attendance.makeup_session_id && (
                                <span className="text-xs text-destructive font-medium">
                                  Needs makeup
                                </span>
                              )}
                              {attendance.status === 'missed' && attendance.makeup_session_id && (
                                <span className="text-xs text-muted-foreground">
                                  Makeup scheduled
                                </span>
                              )}
                            </div>
                          ) : (
                            !isCancelled && <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="pt-2">
        {isEnrolled ? (
          <div className="flex items-center gap-3">
            <Badge className="text-sm px-3 py-1">Enrolled</Badge>
            <span className="text-sm text-muted-foreground capitalize">{myEnrollment.status}</span>
          </div>
        ) : (
          <EnrollButton
            courseId={id}
            disabled={isFull}
            disabledReason={isFull ? 'Course Full' : undefined}
          />
        )}
      </div>
    </div>
  )
}
