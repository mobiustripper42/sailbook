import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { fmtTime } from '@/lib/utils'
import EnrollButton from '@/components/student/enroll-button'


function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

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

  const type = course.course_types as unknown as {
    name: string
    short_code: string
    description: string | null
    certification_body: string | null
  } | null
  const instructor = course.instructor as unknown as { first_name: string; last_name: string } | null

  const spotsRemaining = course.capacity - (activeEnrollments ?? 0)
  const isFull = spotsRemaining <= 0
  const isEnrolled = myEnrollment && myEnrollment.status !== 'cancelled'
  const description = course.description ?? type?.description

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
          <p className="font-medium">{sessions?.length ?? 0}</p>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{fmtDate(s.date)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {fmtTime(s.start_time)} – {fmtTime(s.end_time)}
                    </TableCell>
                    <TableCell>{s.location ?? '—'}</TableCell>
                  </TableRow>
                ))}
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
