import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CourseForm from '@/components/admin/course-form'

export default async function NewCoursePage() {
  const supabase = await createClient()

  const [{ data: courseTypes }, { data: instructors }] = await Promise.all([
    supabase.from('course_types').select('id, name, short_code, max_students').eq('is_active', true).order('name'),
    supabase.from('profiles').select('id, first_name, last_name').eq('is_instructor', true).eq('is_active', true).order('last_name'),
  ])

  if (!courseTypes?.length) {
    redirect('/admin/course-types/new?from=courses')
  }

  return (
    <div className="p-8 max-w-2xl">
      <p className="text-sm text-muted-foreground mb-1">
        <Link href="/admin/courses" className="hover:underline">Courses</Link>
        {' / New'}
      </p>
      <h1 className="text-2xl font-semibold mb-6">New Course</h1>
      <CourseForm courseTypes={courseTypes} instructors={instructors ?? []} />
    </div>
  )
}
