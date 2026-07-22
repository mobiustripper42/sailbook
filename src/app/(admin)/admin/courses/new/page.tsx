import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CourseForm from '@/components/admin/course-form'

export default async function NewCoursePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>
}) {
  const supabase = await createClient()

  // Return to the origin on Cancel / breadcrumb, so Schedule → New → Cancel
  // lands back on Schedule rather than the courses list.
  // Allowlist the origin — only known keys thread through to Cancel / the
  // post-save breadcrumb; anything else falls back to the courses list.
  const from = (await searchParams).from
  const origin =
    from === 'schedule'
      ? { key: 'schedule' as const, href: '/admin/schedule', label: 'Schedule' }
      : { key: undefined, href: '/admin/courses', label: 'Courses' }

  const [{ data: courseTypes }, { data: instructors }] = await Promise.all([
    supabase.from('course_types').select('id, name, short_code, max_students').eq('is_active', true).order('name'),
    supabase.from('profiles').select('id, first_name, last_name').eq('is_instructor', true).eq('is_active', true).order('last_name'),
  ])

  if (!courseTypes?.length) {
    redirect('/admin/course-types/new?from=courses')
  }

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-muted-foreground mb-1">
        <Link href={origin.href} className="hover:underline hover:text-foreground">{origin.label}</Link>
        {' / New'}
      </p>
      <h1 className="text-2xl font-semibold mb-6">New Course</h1>
      <CourseForm
        courseTypes={courseTypes}
        instructors={instructors ?? []}
        cancelHref={origin.href}
        fromParam={origin.key}
      />
    </div>
  )
}
