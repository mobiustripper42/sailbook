import CourseTypeForm from '@/components/admin/course-type-form'

export default function NewCourseTypePage() {
  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-semibold mb-6">Add Course Type</h1>
      <CourseTypeForm />
    </div>
  )
}
