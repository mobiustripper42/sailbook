export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

function formatDateRange(dates: string[]): string {
  if (dates.length === 0) return 'No sessions scheduled'
  const sorted = [...dates].sort()
  const fmt = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (sorted.length === 1) return fmt(sorted[0])
  return `${fmt(sorted[0])} – ${fmt(sorted[sorted.length - 1])}`
}

function enrollmentStatusLabel(status: string): string {
  if (status === 'registered') return 'Pending confirmation'
  if (status === 'confirmed') return 'Enrolled'
  if (status === 'cancelled') return 'Cancelled'
  if (status === 'completed') return 'Completed'
  if (status === 'cancel_requested') return 'Cancellation Requested'
  return status
}

export default async function CourseBrowsePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: courses, error },
    { data: enrollmentCounts },
    { data: myEnrollments, error: enrollmentError },
  ] = await Promise.all([
    supabase
      .from('courses')
      .select(`
        id, title, capacity, price,
        course_types ( name, short_code, description ),
        instructor:profiles!courses_instructor_id_fkey ( first_name, last_name ),
        sessions ( date )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: true }),
    // Must use RPC (SECURITY DEFINER) — direct query is filtered by student RLS
    // to the student's own rows, breaking the "Full" badge for unenrolled students.
    supabase.rpc('get_all_course_enrollment_counts'),
    supabase
      .from('enrollments')
      .select('course_id, status')
      .eq('student_id', user.id)
      .neq('status', 'cancelled'),
  ])

  if (error) return <div className="text-destructive">{error.message}</div>
  if (enrollmentError) return <div className="text-destructive">{enrollmentError.message}</div>

  const today = new Date().toISOString().slice(0, 10)

  // Hide courses where every session is in the past. Courses with no sessions yet remain visible.
  const visibleCourses = (courses ?? []).filter((c) => {
    const sessions = (c.sessions as unknown as { date: string }[]) ?? []
    return sessions.length === 0 || sessions.some((s) => s.date >= today)
  })

  const countMap = new Map<string, number>(
    enrollmentCounts?.map(({ course_id, active_count }: { course_id: string; active_count: number }) => [course_id, active_count]) ?? []
  )

  const enrollmentMap = new Map<string, string>(
    myEnrollments?.map(({ course_id, status }: { course_id: string; status: string }) => [course_id, status]) ?? []
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Available Courses</h1>
      </div>

      {visibleCourses.length === 0 ? (
        <EmptyState message="No courses are available right now. Check back soon." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCourses.map((c) => {
            const type = c.course_types as unknown as { name: string; short_code: string; description: string | null } | null
            const instructor = c.instructor as unknown as { first_name: string; last_name: string } | null
            const sessions = (c.sessions as unknown as { date: string }[]) ?? []

            const activeEnrollments = countMap.get(c.id) ?? 0
            const spotsRemaining = c.capacity - activeEnrollments
            const isFull = spotsRemaining <= 0
            const myStatus = enrollmentMap.get(c.id)
            const isEnrolled = myStatus !== undefined

            return (
              <Card key={c.id} size="sm" className="flex flex-col" data-testid="course-card">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">
                      {c.title ?? type?.name ?? '—'}
                    </CardTitle>
                    {isEnrolled ? (
                      <Badge variant={myStatus === 'confirmed' ? 'default' : 'secondary'} className="shrink-0">
                        {enrollmentStatusLabel(myStatus!)}
                      </Badge>
                    ) : isFull ? (
                      <Badge variant="secondary" className="shrink-0">Full</Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {spotsRemaining} spot{spotsRemaining !== 1 ? 's' : ''} left
                      </Badge>
                    )}
                  </div>
                  {c.title && type?.name && (
                    <CardDescription>{type.name}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex-1 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{sessions.length === 1 ? 'Date' : 'Dates'}</span>
                    <span className="text-foreground font-medium">
                      {formatDateRange(sessions.map((s) => s.date))}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Sessions</span>
                    <span className="text-foreground">{sessions.length}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Instructor</span>
                    <span className="text-foreground">
                      {instructor ? `${instructor.first_name} ${instructor.last_name}` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Price</span>
                    <span className="text-foreground font-medium">
                      {c.price != null ? `$${c.price}` : '—'}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    asChild
                    className="w-full"
                    variant={!isEnrolled && isFull ? 'secondary' : 'default'}
                    disabled={!isEnrolled && isFull}
                  >
                    <Link href={`/student/courses/${c.id}`}>
                      {isEnrolled ? 'View' : isFull ? 'Course Full' : 'View & Enroll'}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
