import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fmtTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}


export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().slice(0, 10)
  const firstName = user.user_metadata?.first_name as string | undefined

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id, status,
      courses (
        id, title,
        course_types ( name ),
        instructor:profiles!courses_instructor_id_fkey ( first_name, last_name ),
        sessions ( id, date, start_time, end_time, location, status )
      )
    `)
    .eq('student_id', user.id)
    .neq('status', 'cancelled')

  type RawSession = { id: string; date: string; start_time: string; end_time: string; location: string | null; status: string }
  type RawCourse = {
    id: string; title: string | null
    course_types: { name: string } | null
    instructor: { first_name: string; last_name: string } | null
    sessions: RawSession[]
  }

  const active = (enrollments ?? []).map((e) => {
    const course = e.courses as unknown as RawCourse | null
    const upcomingSessions = (course?.sessions ?? [])
      .filter((s) => s.date >= today && s.status !== 'cancelled')
      .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
    return { enrollment: e, course, upcomingSessions }
  })

  const enrolledCount = active.length

  // All upcoming sessions across all courses, sorted
  const allUpcoming = active
    .flatMap(({ course, upcomingSessions }) =>
      upcomingSessions.map((s) => ({ ...s, course }))
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))

  const upcomingSessionCount = allUpcoming.length
  const nextSession = allUpcoming[0] ?? null

  // Courses that still have upcoming sessions, sorted by next session date
  const upcomingCourses = active
    .filter((e) => e.upcomingSessions.length > 0)
    .sort((a, b) =>
      a.upcomingSessions[0].date.localeCompare(b.upcomingSessions[0].date)
    )
    .slice(0, 4)

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">
          {firstName ? `Welcome back, ${firstName}.` : 'Dashboard'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Here&apos;s what&apos;s coming up.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Enrolled Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{enrolledCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{upcomingSessionCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Next session highlight */}
      {nextSession ? (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Next Session</h2>
          <Card className="border-foreground/20 bg-muted/30">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <p className="font-semibold">
                    {nextSession.course?.title ?? nextSession.course?.course_types?.name ?? '—'}
                  </p>
                  <p className="text-sm text-muted-foreground">{fmtDate(nextSession.date)}</p>
                  <p className="text-sm text-muted-foreground">
                    {fmtTime(nextSession.start_time)} – {fmtTime(nextSession.end_time)}
                    {nextSession.location ? ` · ${nextSession.location}` : ''}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <Link href={`/student/courses/${nextSession.course?.id}`}>View Course</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : enrolledCount === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 pb-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">You&apos;re not enrolled in any courses yet.</p>
            <Button asChild size="sm">
              <Link href="/student/courses">Browse Available Courses</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Upcoming courses list */}
      {upcomingCourses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground">Upcoming Courses</h2>
            <Link href="/student/my-courses" className="text-xs text-muted-foreground hover:text-foreground">
              View all →
            </Link>
          </div>
          <div className="divide-y rounded-lg border">
            {upcomingCourses.map(({ enrollment, course, upcomingSessions }) => {
              const next = upcomingSessions[0]
              const instructor = course?.instructor
              return (
                <div key={enrollment.id} className="px-4 py-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/student/courses/${course?.id}`}
                        className="text-sm font-medium hover:underline underline-offset-2 truncate"
                      >
                        {course?.title ?? course?.course_types?.name ?? '—'}
                      </Link>
                      <Badge variant={enrollment.status === 'confirmed' ? 'default' : 'secondary'} className="capitalize text-xs shrink-0">
                        {enrollment.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {instructor ? `${instructor.first_name} ${instructor.last_name} · ` : ''}
                      {upcomingSessions.length} session{upcomingSessions.length !== 1 ? 's' : ''} remaining
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground sm:text-right shrink-0">
                    <p>{fmtDate(next.date)}</p>
                    <p>{fmtTime(next.start_time)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
