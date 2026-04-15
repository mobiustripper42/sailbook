import { EmptyState } from '@/components/empty-state'
import CourseAttendanceCard from '@/components/student/course-attendance-card'
import type { CourseHistory } from '@/lib/student-history'

export default function StudentHistoryList({
  courses,
  emptyMessage = 'No course history yet.',
}: {
  courses: CourseHistory[]
  emptyMessage?: string
}) {
  if (courses.length === 0) {
    return <EmptyState message={emptyMessage} />
  }

  return (
    <div className="space-y-4">
      {courses.map((course) => (
        <CourseAttendanceCard key={course.courseId} course={course} />
      ))}
    </div>
  )
}
