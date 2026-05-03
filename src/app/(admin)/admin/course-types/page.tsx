import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'
import CourseTypesList from '@/components/admin/course-types-list'

export default async function CourseTypesPage() {
  const supabase = await createClient()
  const { data: courseTypes, error } = await supabase
    .from('course_types')
    .select('id, name, short_code, certification_body, max_students, min_hours, is_active')
    .order('name')

  if (error) return <div className="text-destructive text-sm">{error.message}</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Course Types</h1>
        <Button asChild>
          <Link href="/admin/course-types/new">New Course Type</Link>
        </Button>
      </div>

      {courseTypes?.length === 0 ? (
        <EmptyState
          message="No course types yet."
          action={
            <Button asChild>
              <Link href="/admin/course-types/new">New Course Type</Link>
            </Button>
          }
        />
      ) : (
        <CourseTypesList courseTypes={courseTypes ?? []} />
      )}
    </div>
  )
}
