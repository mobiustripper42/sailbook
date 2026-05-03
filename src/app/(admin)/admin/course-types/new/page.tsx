import Link from 'next/link'
import CourseTypeForm from '@/components/admin/course-type-form'

export default function NewCourseTypePage() {
  return (
    <div className="max-w-lg">
      <p className="text-sm text-muted-foreground mb-1">
        <Link href="/admin/course-types" className="hover:underline hover:text-foreground">Course Types</Link>
        {' / New'}
      </p>
      <h1 className="text-2xl font-semibold mb-6">Add Course Type</h1>
      <CourseTypeForm />
    </div>
  )
}
