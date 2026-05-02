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
import CancelEnrollmentButton from '@/components/student/cancel-enrollment-button'
import WaitlistButton from '@/components/student/waitlist-button'

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
      id, title, description, capacity, price, member_price, status,
      course_types ( name, short_code, description, certification_body, is_drop_in ),
      instructor:profiles!courses_instructor_id_fkey ( first_name, last_name )
    `)
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (!course) notFound()

  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id, date, start_time, end_time, location, status,
      session_instructor:profiles!sessions_instructor_id_fkey ( first_name, last_name )
    `)
    .eq('course_id', id)
    .order('date')

  // Count active enrollments for spots remaining
  // Must use RPC (SECURITY DEFINER) — direct count query is filtered by student RLS
  // to the student's own rows, so unenrolled students always see count = 0.
  const { data: activeEnrollments } = await supabase
    .rpc('get_course_active_enrollment_count', { p_course_id: id })

  // Check current user's enrollment status
  const { data: myEnrollment } = user
    ? await supabase
        .from('enrollments')
        .select('id, status, hold_expires_at')
        .eq('course_id', id)
        .eq('student_id', user.id)
        .maybeSingle()
    : { data: null }

  const isEnrolled = myEnrollment &&
    myEnrollment.status !== 'cancelled' &&
    myEnrollment.status !== 'pending_payment' &&
    myEnrollment.status !== 'cancel_requested'
  const isCancellationRequested = myEnrollment?.status === 'cancel_requested'
  const hasPendingPayment = myEnrollment?.status === 'pending_payment'
  const isHoldExpired = hasPendingPayment &&
    (myEnrollment?.hold_expires_at == null || new Date(myEnrollment.hold_expires_at) <= new Date())
  const now = new Date().getTime()
  const holdMinutesRemaining = hasPendingPayment && !isHoldExpired && myEnrollment?.hold_expires_at
    ? Math.ceil((new Date(myEnrollment.hold_expires_at).getTime() - now) / 60000)
    : 0

  // Fetch attendance records if enrolled
  const { data: myAttendance } = isEnrolled
    ? await supabase
        .from('session_attendance')
        .select('session_id, status, makeup_session_id')
        .eq('enrollment_id', myEnrollment.id)
    : { data: null }

  // Waitlist status — only relevant when not (already) enrolled.
  const { data: myWaitlistEntry } = user && !isEnrolled
    ? await supabase
        .from('waitlist_entries')
        .select('id')
        .eq('course_id', id)
        .eq('student_id', user.id)
        .maybeSingle()
    : { data: null }
  const isOnWaitlist = !!myWaitlistEntry

  const { data: waitlistPosition } = isOnWaitlist
    ? await supabase.rpc('get_waitlist_position', { p_course_id: id })
    : { data: null }

  const attendanceMap = new Map(
    myAttendance?.map((a) => [a.session_id, a]) ?? []
  )

  const { data: myProfile } = user
    ? await supabase.from('profiles').select('is_member').eq('id', user.id).single()
    : { data: null }

  const isMember = myProfile?.is_member ?? false
  const displayPrice = (isMember && course.member_price != null) ? course.member_price : course.price

  const type = course.course_types as unknown as {
    name: string
    short_code: string
    description: string | null
    certification_body: string | null
    is_drop_in: boolean
  } | null
  const instructor = course.instructor as unknown as { first_name: string; last_name: string } | null

  const spotsRemaining = course.capacity - (activeEnrollments ?? 0)
  const isFull = spotsRemaining <= 0
  const description = course.description ?? type?.description
  const cancelledCount = sessions?.filter((s) => s.status === 'cancelled').length ?? 0

  return (
    <div className="space-y-6 max-w-3xl">
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
            <Badge variant="neutral">{type.short_code}</Badge>
          )}
          {type?.certification_body && (
            <Badge variant="neutral">{type.certification_body}</Badge>
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
          <p className="font-medium">
            {displayPrice != null ? `$${displayPrice}` : '—'}
            {isMember && course.member_price != null && (
              <span className="ml-2 text-xs text-muted-foreground line-through">${course.price}</span>
            )}
          </p>
          {isMember && course.member_price != null && (
            <p className="text-xs text-primary">Member price applied</p>
          )}
        </div>
        <div>
          <p className="text-muted-foreground">{(sessions?.length ?? 0) === 1 ? 'Session' : 'Sessions'}</p>
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
                  const sessionInstructor = s.session_instructor as unknown as { first_name: string; last_name: string } | null

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
                          <Badge variant="neutral">Cancelled</Badge>
                        )}
                        {sessionInstructor && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {sessionInstructor.first_name} {sessionInstructor.last_name}
                          </p>
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

      {type?.is_drop_in && (
        <div className="rounded-xs border border-warning/50 bg-warning/10 px-4 py-3 text-sm text-foreground">
          <span className="font-medium">Drop-in session.</span>{' '}
          Pay {displayPrice != null ? `$${displayPrice}` : 'the hold amount'} now to reserve your spot.
          The remaining balance is paid to the captain on the day.
        </div>
      )}

      <div className="pt-2">
        {isCancellationRequested ? (
          <div className="flex items-center gap-3">
            <Badge variant="warn">Cancellation Requested</Badge>
            <span className="text-sm text-muted-foreground">Pending admin review. You&apos;ll be contacted once processed.</span>
          </div>
        ) : isEnrolled ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {myEnrollment.status === 'registered' ? (
                <>
                  <Badge variant="neutral">Pending confirmation</Badge>
                  <span className="text-sm text-muted-foreground">Pending admin review.</span>
                </>
              ) : (
                <Badge variant="ok">Enrolled</Badge>
              )}
            </div>
            {myEnrollment.status === 'confirmed' && (
              <CancelEnrollmentButton enrollmentId={myEnrollment.id} courseId={id} />
            )}
          </div>
        ) : hasPendingPayment && !isHoldExpired ? (
          <div className="space-y-2">
            <EnrollButton courseId={id} label="Resume Payment" />
            <p className="text-sm text-muted-foreground">
              Your spot is held for {holdMinutesRemaining} more {holdMinutesRemaining === 1 ? 'minute' : 'minutes'}.
            </p>
          </div>
        ) : isFull ? (
          <WaitlistButton
            courseId={id}
            isOnWaitlist={isOnWaitlist}
            position={waitlistPosition ?? null}
          />
        ) : (
          <EnrollButton courseId={id} />
        )}
      </div>
    </div>
  )
}
