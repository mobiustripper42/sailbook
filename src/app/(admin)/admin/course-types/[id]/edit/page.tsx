import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CourseTypeForm from '@/components/admin/course-type-form'
import CourseTypePrerequisites from '@/components/admin/course-type-prerequisites'

export default async function EditCourseTypePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: courseType } = await supabase.from('course_types').select('*').eq('id', id).single()

  if (!courseType) notFound()

  const { data: prerequisites } = await supabase
    .from('course_type_prerequisites')
    .select('id, required_course_type_id, required:course_types!course_type_prerequisites_required_course_type_id_fkey(name, short_code)')
    .eq('course_type_id', id)
    .order('created_at')

  const { data: candidates } = await supabase
    .from('course_types')
    .select('id, name, short_code')
    .eq('is_active', true)
    .order('short_code')

  type PrereqRow = {
    id: string
    required_course_type_id: string
    required: { name: string; short_code: string } | { name: string; short_code: string }[] | null
  }
  const prereqsNormalized = ((prerequisites ?? []) as PrereqRow[]).map((p) => ({
    id: p.id,
    required_course_type_id: p.required_course_type_id,
    required: Array.isArray(p.required) ? (p.required[0] ?? null) : p.required,
  }))

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <p className="text-sm text-muted-foreground mb-1">
          <Link href="/admin/course-types" className="hover:underline">Course Types</Link>
          {' / '}
          {courseType.name}
          {' / Edit'}
        </p>
        <h1 className="text-2xl font-semibold mb-6">Edit Course Type</h1>
        <CourseTypeForm courseType={courseType} />
      </div>

      <CourseTypePrerequisites
        courseTypeId={id}
        prerequisites={prereqsNormalized}
        candidates={candidates ?? []}
      />
    </div>
  )
}
