import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fmtTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AddSessionForm from '@/components/admin/add-session-form'
import SessionActions from '@/components/admin/session-actions'
import CourseStatusActions from '@/components/admin/course-status-actions'
import EnrollmentActions from '@/components/admin/enrollment-actions'

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select(`
      *,
      course_types ( name, short_code ),
      instructor:profiles!courses_instructor_id_fkey ( id, first_name, last_name )
    `)
    .eq('id', id)
    .single()

  if (!course) notFound()

  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      *,
      instructor:profiles!sessions_instructor_id_fkey ( first_name, last_name )
    `)
    .eq('course_id', id)
    .order('date')

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      *,
      student:profiles!enrollments_student_id_fkey ( first_name, last_name, email )
    `)
    .eq('course_id', id)
    .order('enrolled_at')

  const type = course.course_types as { name: string; short_code: string } | null
  const instructor = course.instructor as { id: string; first_name: string; last_name: string } | null

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">
            <Link href="/admin/courses" className="hover:underline">Courses</Link>
            {' / '}
            {course.title ?? type?.name}
          </p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{course.title ?? type?.name}</h1>
            <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>{course.status}</Badge>
          </div>
          {course.title && <p className="text-muted-foreground">{type?.name}</p>}
          <p className="text-sm text-muted-foreground mt-1">
            Instructor: {instructor ? `${instructor.first_name} ${instructor.last_name}` : '—'} ·
            Capacity: {enrollments?.length ?? 0} / {course.capacity}
            {course.price != null && ` · $${course.price}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/courses/${id}/edit`}>Edit</Link>
          </Button>
          <CourseStatusActions id={id} status={course.status} />
        </div>
      </div>

      {course.description && (
        <p className="text-sm text-muted-foreground">{course.description}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sessions?.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">No sessions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions?.map((s) => {
                  const si = s.instructor as { first_name: string; last_name: string } | null
                  return (
                    <TableRow key={s.id}>
                      <TableCell>{new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</TableCell>
                      <TableCell className="whitespace-nowrap">{fmtTime(s.start_time)} – {fmtTime(s.end_time)}</TableCell>
                      <TableCell>{s.location ?? '—'}</TableCell>
                      <TableCell>
                        {si ? `${si.first_name} ${si.last_name}` : 'Course default'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.status === 'scheduled' ? 'default' : 'secondary'}>
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/courses/${id}/sessions/${s.id}/attendance`}>
                              Attendance
                            </Link>
                          </Button>
                          <SessionActions sessionId={s.id} courseId={id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          <div className="border-t px-6 py-4">
            <AddSessionForm courseId={id} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enrollments ({enrollments?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {enrollments?.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">No enrollments yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments?.map((e) => {
                  const student = e.student as { first_name: string; last_name: string; email: string } | null
                  return (
                    <TableRow key={e.id}>
                      <TableCell>{student ? `${student.first_name} ${student.last_name}` : '—'}</TableCell>
                      <TableCell>{student?.email ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={e.status === 'confirmed' ? 'default' : 'secondary'}>
                          {e.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(e.enrolled_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <EnrollmentActions enrollmentId={e.id} courseId={id} status={e.status} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

