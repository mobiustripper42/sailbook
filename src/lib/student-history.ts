import type { SupabaseClient } from '@supabase/supabase-js'
import type { AttendanceStatus } from '@/lib/attendance'

export type CourseHistory = {
  courseId: string
  courseName: string
  enrollmentStatus: string
  instructorId: string | null
  instructorName: string | null
  records: {
    sessionId: string
    sessionDate: string
    startTime: string
    endTime: string
    location: string | null
    status: AttendanceStatus
    makeupSessionId: string | null
    cancelled: boolean
    sessionInstructorName: string | null
  }[]
  missedCount: number
  latestSessionDate: string | null
}

type RawSession = {
  id: string
  date: string
  start_time: string
  end_time: string
  location: string | null
  status: string
  session_instructor: { first_name: string; last_name: string } | null
  course: {
    id: string
    title: string | null
    instructor_id: string | null
    course_types: { name: string } | null
    instructor: { first_name: string; last_name: string } | null
  }
}

export async function fetchStudentHistory(
  supabase: SupabaseClient,
  studentId: string
): Promise<{ data: CourseHistory[]; error: string | null }> {
  const { data, error } = await supabase
    .from('session_attendance')
    .select(`
      status,
      makeup_session_id,
      session:sessions!session_attendance_session_id_fkey (
        id, date, start_time, end_time, location, status,
        session_instructor:profiles!sessions_instructor_id_fkey ( first_name, last_name ),
        course:courses!sessions_course_id_fkey (
          id, title, instructor_id,
          course_types ( name ),
          instructor:profiles!courses_instructor_id_fkey ( first_name, last_name )
        )
      ),
      enrollment:enrollments!session_attendance_enrollment_id_fkey (
        student_id,
        status
      )
    `)
    .eq('enrollment.student_id', studentId)
    .not('enrollment', 'is', null)

  if (error) return { error: error.message, data: [] }

  const courseMap = new Map<string, CourseHistory>()

  for (const row of data ?? []) {
    const enrollment = row.enrollment as unknown as { student_id: string; status: string } | null
    if (!enrollment) continue

    const session = row.session as unknown as RawSession
    const course = session.course
    const courseId = course.id

    let group = courseMap.get(courseId)
    if (!group) {
      const instructor = course.instructor
      group = {
        courseId,
        courseName: course.title ?? course.course_types?.name ?? 'Course',
        enrollmentStatus: enrollment.status,
        instructorId: course.instructor_id,
        instructorName: instructor ? `${instructor.first_name} ${instructor.last_name}` : null,
        records: [],
        missedCount: 0,
        latestSessionDate: null,
      }
      courseMap.set(courseId, group)
    }

    if (row.status === 'missed' && !row.makeup_session_id) group.missedCount++

    const si = session.session_instructor
    group.records.push({
      sessionId: session.id,
      sessionDate: session.date,
      startTime: session.start_time,
      endTime: session.end_time,
      location: session.location,
      status: row.status as AttendanceStatus,
      makeupSessionId: row.makeup_session_id as string | null,
      cancelled: session.status === 'cancelled',
      sessionInstructorName: si ? `${si.first_name} ${si.last_name}` : null,
    })

    if (!group.latestSessionDate || session.date > group.latestSessionDate) {
      group.latestSessionDate = session.date
    }
  }

  for (const group of courseMap.values()) {
    group.records.sort((a, b) => a.sessionDate.localeCompare(b.sessionDate))
  }

  const courses = Array.from(courseMap.values()).sort((a, b) => {
    const aDate = a.latestSessionDate ?? ''
    const bDate = b.latestSessionDate ?? ''
    return bDate.localeCompare(aDate) || a.courseName.localeCompare(b.courseName)
  })

  return { data: courses, error: null }
}
