import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'
import CoursesList from '@/components/admin/courses-list'

export default async function CoursesPage() {
  const supabase = await createClient()
  const { data: courses, error } = await supabase
    .from('courses')
    .select(`
      id, title, status, capacity, price, created_at,
      course_types ( name, short_code ),
      instructor:profiles!courses_instructor_id_fkey ( first_name, last_name ),
      sessions ( id ),
      enrollments ( id, status )
    `)
    .order('created_at', { ascending: false })

  if (error) return <div className="text-destructive text-sm">{error.message}</div>

  return (
    <div>
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
        <CoursesList courses={(courses ?? []) as unknown as Parameters<typeof CoursesList>[0]['courses']} />
      )}
    </div>
  )
}
