import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CourseEditForm from '@/components/admin/course-edit-form'

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: course }, { data: courseTypes }, { data: instructors }] = await Promise.all([
    supabase.from('courses').select('*').eq('id', id).single(),
    supabase.from('course_types').select('id, name, short_code, max_students').eq('is_active', true).order('name'),
    supabase.from('profiles').select('id, first_name, last_name').eq('is_instructor', true).eq('is_active', true).order('last_name'),
  ])

  if (!course) notFound()

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-muted-foreground mb-1">
        <Link href="/admin/courses" className="hover:underline hover:text-foreground">Courses</Link>
        {' / '}
        <Link href={`/admin/courses/${id}`} className="hover:underline hover:text-foreground">{course.title ?? 'Course'}</Link>
        {' / Edit'}
      </p>
      <h1 className="text-2xl font-semibold mb-6">Edit Course</h1>
      <CourseEditForm course={course} courseTypes={courseTypes ?? []} instructors={instructors ?? []} />
    </div>
  )
}
