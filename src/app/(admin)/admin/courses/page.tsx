import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function CoursesPage() {
  const supabase = await createClient()
  const { data: courses, error } = await supabase
    .from('courses')
    .select(`
      id, title, status, capacity, price,
      course_types ( name, short_code ),
      instructor:profiles!courses_instructor_id_fkey ( first_name, last_name ),
      sessions ( id ),
      enrollments ( id, status )
    `)
    .order('created_at', { ascending: false })

  if (error) return <div className="p-8 text-destructive">{error.message}</div>

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Courses</h1>
        <Button asChild>
          <Link href="/admin/courses/new">New Course</Link>
        </Button>
      </div>

      {courses?.length === 0 ? (
        <EmptyState
          message="No courses yet."
          action={
            <Button asChild>
              <Link href="/admin/courses/new">New Course</Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Enrolled / Cap</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses?.map((c) => {
                const type = c.course_types as unknown as { name: string; short_code: string } | null
                const instructor = c.instructor as unknown as { first_name: string; last_name: string } | null
                const sessionCount = Array.isArray(c.sessions) ? c.sessions.length : 0
                const enrollmentCount = Array.isArray(c.enrollments)
                  ? c.enrollments.filter((e: { id: string; status: string }) => e.status !== 'cancelled').length
                  : 0

                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div>
                        <Link href={`/admin/courses/${c.id}`} className="font-medium hover:underline underline-offset-2">
                          {c.title ?? type?.name ?? '—'}
                        </Link>
                        {c.title && <p className="text-xs text-muted-foreground">{type?.name}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {instructor ? `${instructor.first_name} ${instructor.last_name}` : '—'}
                    </TableCell>
                    <TableCell>{sessionCount}</TableCell>
                    <TableCell>{enrollmentCount} / {c.capacity}</TableCell>
                    <TableCell>{c.price != null ? `$${c.price}` : '—'}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'active' ? 'default' : 'secondary'}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/courses/${c.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
