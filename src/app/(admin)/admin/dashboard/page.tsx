import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { findLowEnrollmentCourses } from '@/lib/low-enrollment'

async function getDashboardData() {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)
  const sevenDaysOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const lowEnrollmentPromise = findLowEnrollmentCourses(supabase)

  const [activeCourses, unassigned, upcomingSessions, pendingEnrollments, pendingCount] = await Promise.all([
    supabase
      .from('courses')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('courses')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .is('instructor_id', null),
    supabase
      .from('sessions')
      .select(`
        id,
        date,
        start_time,
        end_time,
        instructor:instructor_id ( first_name, last_name ),
        course:courses (
          id,
          title,
          capacity,
          course_instructor:profiles!courses_instructor_id_fkey ( first_name, last_name ),
          course_type:course_types ( name ),
          enrollments ( id, status )
        )
      `)
      .gte('date', today)
      .lte('date', sevenDaysOut)
      .eq('status', 'scheduled')
      .order('date')
      .order('start_time'),
    supabase
      .from('enrollments')
      .select(`
        id,
        enrolled_at,
        student:profiles!enrollments_student_id_fkey ( first_name, last_name ),
        course:courses (
          id,
          title,
          course_type:course_types ( name )
        )
      `)
      .eq('status', 'registered')
      .order('enrolled_at', { ascending: true })
      .limit(10),
    supabase
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'registered'),
  ])

  const lowEnrollmentCourses = await lowEnrollmentPromise

  return {
    activeCourses: activeCourses.count ?? 0,
    coursesWithoutInstructor: unassigned.count ?? 0,
    lowEnrollmentCount: lowEnrollmentCourses.length,
    upcomingSessions: upcomingSessions.data ?? [],
    pendingEnrollments: pendingEnrollments.data ?? [],
    pendingTotal: pendingCount.count ?? 0,
  }
}

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>
type UpcomingSession = DashboardData['upcomingSessions'][number]
type PendingEnrollment = DashboardData['pendingEnrollments'][number]

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default async function AdminDashboard() {
  const data = await getDashboardData()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Active Courses" value={data.activeCourses} />
        <InstructorCard value={data.coursesWithoutInstructor} />
        <LowEnrollmentCard value={data.lowEnrollmentCount} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UpcomingSessions sessions={data.upcomingSessions} />
        <PendingEnrollments enrollments={data.pendingEnrollments} totalCount={data.pendingTotal} />
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card size="sm">
      <CardHeader className="h-14 items-start justify-end pb-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold text-right">{value}</p>
      </CardContent>
    </Card>
  )
}

function InstructorCard({ value }: { value: number }) {
  const isWarning = value > 0
  return (
    <Card size="sm" className={isWarning ? 'border-warning/40 bg-warning/10' : undefined}>
      <CardHeader className="h-14 items-start justify-end pb-0">
        <CardTitle className={`text-sm font-medium flex items-center gap-1.5 ${isWarning ? 'text-warning' : 'text-muted-foreground'}`}>
          {isWarning && <span aria-hidden="true">⚠</span>}
          {isWarning ? 'No Instructor Assigned' : 'All Instructors Assigned'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isWarning ? (
          <>
            <p className="text-3xl font-semibold text-right text-warning">{value}</p>
            <p className="text-xs text-warning mt-1 text-right">Assign before publishing</p>
          </>
        ) : (
          <p className="text-3xl font-semibold text-right">✓</p>
        )}
      </CardContent>
    </Card>
  )
}

function LowEnrollmentCard({ value }: { value: number }) {
  const isWarning = value > 0
  return (
    <Card size="sm" className={isWarning ? 'border-warning/40 bg-warning/10' : undefined}>
      <CardHeader className="h-14 items-start justify-end pb-0">
        <CardTitle className={`text-sm font-medium flex items-center gap-1.5 ${isWarning ? 'text-warning' : 'text-muted-foreground'}`}>
          {isWarning && <span aria-hidden="true">⚠</span>}
          {isWarning ? 'Low Enrollment' : 'Enrollment Healthy'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isWarning ? (
          <>
            <p className="text-3xl font-semibold text-right text-warning">{value}</p>
            <p className="text-xs text-warning mt-1 text-right">Below minimum, starting soon</p>
          </>
        ) : (
          <p className="text-3xl font-semibold text-right">✓</p>
        )}
      </CardContent>
    </Card>
  )
}

function UpcomingSessions({ sessions }: { sessions: UpcomingSession[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Sessions in Next 7 Days</CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sessions scheduled in the next 7 days.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left pb-2 font-medium">Course</th>
                <th className="text-left pb-2 font-medium">Date / Time</th>
                <th className="text-left pb-2 font-medium">Instructor</th>
                <th className="text-right pb-2 font-medium">Enrolled</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const course = s.course as unknown as {
                  id: string
                  title: string | null
                  capacity: number
                  course_instructor: { first_name: string; last_name: string } | null
                  course_type: { name: string } | null
                  enrollments: { id: string; status: string }[]
                } | null
                const sessionInstructor = s.instructor as unknown as { first_name: string; last_name: string } | null
                const instructor = sessionInstructor ?? course?.course_instructor ?? null
                const courseName = course?.title ?? course?.course_type?.name ?? '—'
                const activeCount = (course?.enrollments ?? []).filter((e) => e.status === 'confirmed').length
                const capacity = course?.capacity ?? 0
                const attendanceHref = course?.id
                  ? `/admin/courses/${course.id}/sessions/${s.id}/attendance`
                  : undefined

                return (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      {attendanceHref ? (
                        <Link href={attendanceHref} className="hover:underline">{courseName}</Link>
                      ) : courseName}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {formatDate(s.date)}, {formatTime(s.start_time)}–{formatTime(s.end_time)}
                    </td>
                    <td className="py-2 pr-4">
                      {instructor ? (
                        `${instructor.first_name} ${instructor.last_name}`
                      ) : (
                        <span className="text-warning">⚠ Unassigned</span>
                      )}
                    </td>
                    <td className="py-2 text-right">{activeCount}/{capacity}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}

function PendingEnrollments({ enrollments, totalCount }: { enrollments: PendingEnrollment[]; totalCount: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Pending Confirmation{totalCount > 0 && ` (${totalCount})`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No enrollments pending confirmation.</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left pb-2 font-medium">Student</th>
                  <th className="text-left pb-2 font-medium">Course</th>
                  <th className="text-right pb-2 font-medium">Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => {
                  const course = e.course as unknown as { id: string; title: string | null; course_type: { name: string } | null } | null
                  const student = e.student as unknown as { first_name: string; last_name: string } | null
                  const courseName = course?.title ?? course?.course_type?.name ?? '—'

                  return (
                    <tr key={e.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        {student ? `${student.first_name} ${student.last_name}` : '—'}
                      </td>
                      <td className="py-2 pr-4">
                        {course?.id ? (
                          <Link href={`/admin/courses/${course.id}`} className="hover:underline">{courseName}</Link>
                        ) : courseName}
                      </td>
                      <td className="py-2 text-right whitespace-nowrap">{formatDate(e.enrolled_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {totalCount > 10 && (
              <p className="mt-3 text-xs text-muted-foreground text-right">
                Showing 10 of {totalCount} pending
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
