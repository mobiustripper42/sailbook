import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h < 12 ? 'am' : 'pm'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')}${ampm}`
}

export default async function InstructorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().slice(0, 10)
  const firstName = user.user_metadata?.first_name as string | undefined

  // Upcoming sessions for courses this instructor is assigned to
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id, date, start_time, end_time, location, status,
      courses (
        id, title, capacity,
        course_types ( name ),
        enrollments ( id, status )
      )
    `)
    .eq('status', 'scheduled')
    .gte('date', today)
    .order('date')
    .order('start_time')

  // Filter to sessions on courses where this instructor is the course instructor
  // (session-level instructor override is Phase 4 / 5.2)
  type RawEnrollment = { id: string; status: string }
  type RawCourse = {
    id: string
    title: string | null
    capacity: number
    course_types: { name: string } | null
    enrollments: RawEnrollment[]
    instructor_id?: string
  }

  // Re-fetch with instructor_id on the course so we can filter
  const { data: mySessions } = await supabase
    .from('sessions')
    .select(`
      id, date, start_time, end_time, location, status,
      courses!inner (
        id, title, capacity, instructor_id,
        course_types ( name ),
        enrollments ( id, status )
      )
    `)
    .eq('status', 'scheduled')
    .gte('date', today)
    .eq('courses.instructor_id', user.id)
    .order('date')
    .order('start_time')

  type SessionRow = {
    id: string
    date: string
    start_time: string
    end_time: string
    location: string | null
    status: string
    courses: RawCourse
  }

  const rows = (mySessions ?? []) as unknown as SessionRow[]

  const upcomingCount = rows.length
  const totalStudents = rows.reduce((sum, s) => {
    const active = s.courses.enrollments.filter((e) => e.status !== 'cancelled').length
    return sum + active
  }, 0)

  // Unique active courses
  const courseIds = new Set(rows.map((s) => s.courses.id))
  const activeCourseCount = courseIds.size

  return (
    <div className="p-8 space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">
          {firstName ? `Welcome back, ${firstName}.` : 'Dashboard'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Your upcoming schedule.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{activeCourseCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{upcomingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{totalStudents}</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming sessions */}
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No upcoming sessions assigned to you.</p>
      ) : (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Upcoming Sessions</h2>
          <div className="divide-y rounded-lg border">
            {rows.map((s) => {
              const course = s.courses
              const activeEnrollments = course.enrollments.filter((e) => e.status !== 'cancelled').length
              return (
                <div key={s.id} className="px-4 py-3 flex items-start justify-between gap-4">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {course.title ?? course.course_types?.name ?? '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fmtDate(s.date)} · {fmtTime(s.start_time)} – {fmtTime(s.end_time)}
                      {s.location ? ` · ${s.location}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {activeEnrollments} / {course.capacity}
                    </Badge>
                    <Link
                      href={`/admin/courses/${course.id}`}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Roster →
                    </Link>
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
