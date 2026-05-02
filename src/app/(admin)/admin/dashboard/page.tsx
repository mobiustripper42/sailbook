import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { findLowEnrollmentCourses } from '@/lib/low-enrollment'
import { EnrollmentQueueCard } from '@/components/admin/enrollment-queue-card'
import type { QueueRow } from '@/components/admin/enrollment-queue-card'

async function getDashboardData() {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)
  const sevenDaysOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const lowEnrollmentPromise = findLowEnrollmentCourses(supabase)

  const [activeCourses, unassigned, upcomingSessions, pendingEnrollments, pendingCount, cancelRequests, cancelCount] = await Promise.all([
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
    // Newest-first: admin wants to see what just arrived, not what's been sitting.
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
      .eq('status', 'cancel_requested')
      .order('enrolled_at', { ascending: false })
      .limit(10),
    supabase
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'cancel_requested'),
  ])

  const lowEnrollmentCourses = await lowEnrollmentPromise

  return {
    activeCourses: activeCourses.count ?? 0,
    coursesWithoutInstructor: unassigned.count ?? 0,
    lowEnrollmentCount: lowEnrollmentCourses.length,
    upcomingSessions: upcomingSessions.data ?? [],
    pendingEnrollments: pendingEnrollments.data ?? [],
    pendingTotal: pendingCount.count ?? 0,
    cancelRequests: cancelRequests.data ?? [],
    cancelTotal: cancelCount.count ?? 0,
  }
}

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>
type UpcomingSession = DashboardData['upcomingSessions'][number]

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

function dayHeader(dateStr: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  const diffDays = Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  return target.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

function todayHeading(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function toQueueRows(enrollments: DashboardData['pendingEnrollments']): QueueRow[] {
  return enrollments.map((e) => {
    const course = e.course as unknown as { id: string; title: string | null; course_type: { name: string } | null } | null
    const student = e.student as unknown as { first_name: string; last_name: string } | null
    return {
      id: e.id,
      studentName: student ? `${student.first_name} ${student.last_name}` : '—',
      courseName: course?.title ?? course?.course_type?.name ?? '—',
      courseId: course?.id ?? null,
      date: e.enrolled_at,
    }
  })
}

export default async function AdminDashboard() {
  const data = await getDashboardData()

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">{todayHeading()}</p>
      </header>

      <QuickActions />

      <StatRow
        activeCourses={data.activeCourses}
        coursesWithoutInstructor={data.coursesWithoutInstructor}
        lowEnrollmentCount={data.lowEnrollmentCount}
      />

      <UpcomingSessions sessions={data.upcomingSessions} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <EnrollmentQueueCard
          title="Pending Confirmation"
          emptyMessage="No enrollments pending confirmation."
          rows={toQueueRows(data.pendingEnrollments)}
          totalCount={data.pendingTotal}
        />
        <EnrollmentQueueCard
          title="Cancellation Requests"
          emptyMessage="No cancellation requests pending."
          rows={toQueueRows(data.cancelRequests)}
          totalCount={data.cancelTotal}
        />
      </div>
    </div>
  )
}

function QuickActions() {
  return (
    <nav aria-label="Quick actions" className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href="/admin/courses/new">+ New Course</Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href="/admin/students/new">+ New Student</Link>
      </Button>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/calendar">Calendar</Link>
      </Button>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/missed-sessions">Missed Sessions</Link>
      </Button>
    </nav>
  )
}

function StatRow({
  activeCourses,
  coursesWithoutInstructor,
  lowEnrollmentCount,
}: {
  activeCourses: number
  coursesWithoutInstructor: number
  lowEnrollmentCount: number
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard label="Active Courses" value={activeCourses} />
      {coursesWithoutInstructor > 0 ? (
        <InstructorWarningCard value={coursesWithoutInstructor} />
      ) : (
        <CleanIndicator label="All instructors assigned" />
      )}
      {lowEnrollmentCount > 0 ? (
        <LowEnrollmentWarningCard value={lowEnrollmentCount} />
      ) : (
        <CleanIndicator label="Enrollment is healthy" />
      )}
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

function InstructorWarningCard({ value }: { value: number }) {
  return (
    <Card size="sm" className="border-warning/40 bg-warning/10">
      <CardHeader className="h-14 items-start justify-end pb-0">
        <CardTitle className="text-sm font-medium flex items-center gap-1.5 text-warning">
          <span aria-hidden="true">⚠</span>
          No Instructor Assigned
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold text-right text-warning">{value}</p>
        <p className="text-xs text-warning mt-1 text-right">Assign before publishing</p>
      </CardContent>
    </Card>
  )
}

function LowEnrollmentWarningCard({ value }: { value: number }) {
  return (
    <Card size="sm" className="border-warning/40 bg-warning/10">
      <CardHeader className="h-14 items-start justify-end pb-0">
        <CardTitle className="text-sm font-medium flex items-center gap-1.5 text-warning">
          <span aria-hidden="true">⚠</span>
          Low Enrollment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold text-right text-warning">{value}</p>
        <p className="text-xs text-warning mt-1 text-right">Below minimum, starting soon</p>
      </CardContent>
    </Card>
  )
}

function CleanIndicator({ label }: { label: string }) {
  return (
    <Card size="sm" className="border-dashed bg-transparent">
      <CardContent className="flex h-full items-center gap-2 text-sm text-muted-foreground">
        <span aria-hidden="true">✓</span>
        {label}
      </CardContent>
    </Card>
  )
}

function UpcomingSessions({ sessions }: { sessions: UpcomingSession[] }) {
  const grouped = new Map<string, UpcomingSession[]>()
  for (const s of sessions) {
    const list = grouped.get(s.date) ?? []
    list.push(s)
    grouped.set(s.date, list)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Sessions in Next 7 Days</CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sessions scheduled in the next 7 days.</p>
        ) : (
          <div className="space-y-4">
            {Array.from(grouped.entries()).map(([date, items]) => (
              <SessionDayGroup key={date} date={date} sessions={items} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SessionDayGroup({ date, sessions }: { date: string; sessions: UpcomingSession[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b">
        {dayHeader(date)}
      </h3>
      <ul className="divide-y">
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
            <li key={s.id} className="py-2 flex items-center gap-3 text-sm">
              <span className="text-muted-foreground tabular-nums whitespace-nowrap shrink-0 w-32 sm:w-40">
                {formatTime(s.start_time)}–{formatTime(s.end_time)}
              </span>
              <span className="flex-1 min-w-0 truncate">
                {attendanceHref ? (
                  <Link href={attendanceHref} className="hover:underline">
                    {courseName}
                  </Link>
                ) : (
                  courseName
                )}
                <span className="hidden sm:inline text-muted-foreground">
                  {' · '}
                  {instructor ? (
                    `${instructor.first_name} ${instructor.last_name}`
                  ) : (
                    <span className="text-warning">⚠ Unassigned</span>
                  )}
                </span>
              </span>
              <span className="text-muted-foreground tabular-nums shrink-0">
                {activeCount}/{capacity}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
