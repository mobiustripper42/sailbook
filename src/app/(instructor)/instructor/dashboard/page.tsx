import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fmtTime, fmtDateRelative } from '@/lib/utils'
import { EmptyState } from '@/components/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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

  // DEC-007: two queries, same pattern as instructor/calendar/page.tsx.
  // Query 1: sessions where this instructor is the course default and no session-level
  // override exists (instructor_id IS NULL on the session).
  const { data: courseSessions, error: e1 } = await supabase
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
    .eq('courses.status', 'active')
    .is('instructor_id', null)
    .order('date')
    .order('start_time')

  // Query 2: sessions directly assigned to this instructor at the session level.
  const { data: overrideSessions, error: e2 } = await supabase
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
    .eq('instructor_id', user.id)
    .eq('courses.status', 'active')
    .order('date')
    .order('start_time')

  if (e1) return <div className="text-destructive text-sm">{e1.message}</div>
  if (e2) return <div className="text-destructive text-sm">{e2.message}</div>

  // Deduplicate and sort
  const seen = new Set<string>()
  const rows: SessionRow[] = []
  for (const s of [...(courseSessions ?? []), ...(overrideSessions ?? [])]) {
    if (seen.has(s.id)) continue
    seen.add(s.id)
    rows.push(s as unknown as SessionRow)
  }
  rows.sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))

  const upcomingCount = rows.length

  const studentIds = new Set<string>()
  for (const s of rows) {
    for (const e of s.courses.enrollments) {
      if (e.status === 'confirmed' || e.status === 'completed') studentIds.add(e.student_id)
    }
  }

  const courseIds = new Set(rows.map((s) => s.courses.id))

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">
          {firstName ? `Welcome back, ${firstName}.` : 'Dashboard'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Your upcoming schedule.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Active Courses" value={courseIds.size} />
        <StatCard label="Upcoming Sessions" value={upcomingCount} />
        <StatCard label="Total Students" value={studentIds.size} />
      </div>

      {rows.length === 0 ? (
        <EmptyState message="No upcoming sessions assigned to you." />
      ) : (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">Upcoming Sessions</h2>
          <div className="divide-y rounded-lg border">
            {rows.map((s) => {
              const course = s.courses
              const confirmedCount = course.enrollments.filter(
                (e) => e.status === 'confirmed' || e.status === 'completed'
              ).length
              return (
                <div key={s.id} className="px-4 py-3 flex items-start justify-between gap-4">
                  <div className="space-y-0.5 min-w-0">
                    <Link
                      href={`/instructor/sessions/${s.id}`}
                      className="text-sm font-medium truncate hover:underline underline-offset-2 block"
                    >
                      {course.title ?? course.course_types?.name ?? '—'}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {fmtDateRelative(s.date)} · {fmtTime(s.start_time)} – {fmtTime(s.end_time)}
                      {s.location ? ` · ${s.location}` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {confirmedCount} / {course.capacity}
                  </span>
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
    <Card size="sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}
