import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { fmtDate, fmtTime } from '@/lib/utils'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('course_types')
    .select('name')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  return { title: data?.name ?? 'Course' }
}

export default async function PublicCoursePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: courseType } = await supabase
    .from('course_types')
    .select('id, name, short_code, certification_body, description, is_drop_in')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!courseType) notFound()

  const today = new Date().toISOString().split('T')[0]

  const { data: courses } = await supabase
    .from('courses')
    .select(`
      id, title, price,
      sessions ( id, date, start_time, end_time, location, status )
    `)
    .eq('course_type_id', courseType.id)
    .eq('status', 'active')
    .order('created_at')

  // Filter to courses with at least one future session, then sort by first session date
  const upcoming = (courses ?? [])
    .map((course) => {
      const sessions = (course.sessions ?? []) as { id: string; date: string; start_time: string; end_time: string; location: string | null; status: string }[]
      const futureSessions = sessions
        .filter((s) => s.status !== 'cancelled' && s.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date))
      return { ...course, sessions, futureSessions }
    })
    .filter((c) => c.futureSessions.length > 0)
    .sort((a, b) => a.futureSessions[0].date.localeCompare(b.futureSessions[0].date))

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground mb-1">
          <Link href="/courses" className="hover:underline hover:text-foreground">Courses</Link>
          {' / '}
          {courseType.name}
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold">{courseType.name}</h1>
          {courseType.short_code && (
            <Badge variant="neutral">{courseType.short_code}</Badge>
          )}
          {courseType.certification_body && (
            <Badge variant="neutral">{courseType.certification_body}</Badge>
          )}
        </div>
        {courseType.description && (
          <p className="text-muted-foreground">{courseType.description}</p>
        )}
        {courseType.is_drop_in && (
          <div className="rounded-xs border border-warning/50 bg-warning/10 px-4 py-2 text-sm">
            <span className="font-medium">Drop-in sessions.</span>{' '}
            Pay to reserve your spot. Remaining balance paid to the captain on the day.
          </div>
        )}
      </div>

      {upcoming.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No upcoming sections are currently scheduled.{' '}
            <Link href="/login" className="underline hover:text-foreground">
              Log in
            </Link>{' '}
            to stay notified when new sections open.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Upcoming sections</h2>
          <div className="space-y-3">
            {upcoming.map((course) => {
              const first = course.futureSessions[0]
              const last = course.futureSessions[course.futureSessions.length - 1]
              const dateRange =
                first.date === last.date
                  ? fmtDate(first.date)
                  : `${fmtDate(first.date)} – ${fmtDate(last.date)}`
              const price = course.price != null ? `$${course.price}` : null

              return (
                <Card key={course.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium">
                      {course.title ?? courseType.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Dates</p>
                        <p className="font-medium">{dateRange}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Time</p>
                        <p className="font-medium">
                          {fmtTime(first.start_time)} – {fmtTime(first.end_time)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Location</p>
                        <p className="font-medium">{first.location ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Price</p>
                        <p className="font-medium">{price ?? '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-xs text-muted-foreground">
                        {course.futureSessions.length}{' '}
                        {course.futureSessions.length === 1 ? 'session' : 'sessions'}
                      </p>
                      <Button asChild size="sm">
                        <Link href={`/login?next=/student/courses/${course.id}`}>
                          Enroll →
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center pb-4">
        Already have an account?{' '}
        <Link href="/login" className="underline hover:text-foreground">
          Log in
        </Link>
      </p>
    </div>
  )
}
