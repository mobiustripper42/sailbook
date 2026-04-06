import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fmtTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

type SessionRow = {
  id: string
  date: string
  start_time: string
  end_time: string
  location: string | null
  status: string
  courses: {
    id: string
    title: string | null
    capacity: number
    course_types: { name: string } | null
    enrollments: { student_id: string; status: string }[]
  }
}

export default async function InstructorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().slice(0, 10)
  const firstName = user.user_metadata?.first_name as string | undefined

  // Upcoming sessions for courses this instructor is assigned to
  // Note: session-level instructor override (DEC-007) is Phase 5.2;
  // for now we scope by courses.instructor_id only.
  const { data: mySessions } = await supabase
    .from('sessions')
    .select(`
      id, date, start_time, end_time, location, status,
      courses!inner (
        id, title, capacity,
        course_types ( name ),
        enrollments ( student_id, status )
      )
    `)
    .eq('status', 'scheduled')
    .gte('date', today)
    .eq('courses.instructor_id', user.id)
    .order('date')
    .order('start_time')

  const rows = (mySessions ?? []) as unknown as SessionRow[]

  const upcomingCount = rows.length

  // Count unique active students across all upcoming sessions
  const studentIds = new Set<string>()
  for (const s of rows) {
    for (const e of s.courses.enrollments) {
      if (e.status !== 'cancelled') studentIds.add(e.student_id)
    }
  }

  const courseIds = new Set(rows.map((s) => s.courses.id))

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
        <StatCard label="Active Courses" value={courseIds.size} />
        <StatCard label="Upcoming Sessions" value={upcomingCount} />
        <StatCard label="Total Students" value={studentIds.size} />
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
                      href={`/instructor/sessions/${s.id}`}
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}
