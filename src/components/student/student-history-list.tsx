import { EmptyState } from '@/components/empty-state'
import CourseAttendanceCard from '@/components/student/course-attendance-card'
import type { CourseHistory } from '@/lib/student-history'

export default function StudentHistoryList({
  courses,
  emptyMessage = 'No course history yet.',
  courseBasePath,
}: {
  courses: CourseHistory[]
  emptyMessage?: string
  // When set, each course title links to `${courseBasePath}/${courseId}`.
  // Omit on surfaces with no course-detail route (e.g. instructor).
  courseBasePath?: string
}) {
  if (courses.length === 0) {
    return <EmptyState message={emptyMessage} />
  }

  return (
    <div className="space-y-4">
      {courses.map((course) => (
        <CourseAttendanceCard
          key={course.courseId}
          course={course}
          courseHref={courseBasePath ? `${courseBasePath}/${course.courseId}` : undefined}
        />
      ))}
    </div>
  )
}
