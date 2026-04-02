import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CourseTypeForm from '@/components/admin/course-type-form'

export default async function EditCourseTypePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: courseType } = await supabase.from('course_types').select('*').eq('id', id).single()

  if (!courseType) notFound()

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-semibold mb-6">Edit Course Type</h1>
      <CourseTypeForm courseType={courseType} />
    </div>
  )
}
