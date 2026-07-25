import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchStudentHistory } from '@/lib/student-history'
import type { AttendanceStatus } from '@/lib/attendance'

// One row per session in a course the student is enrolled in. `status` is the
// attendance record when one exists — sessions seeded but never marked come
// back as 'expected'; a session with no attendance row at all (seeding gap,
// session added after enrollment) gets null so the UI can stay quiet about it.
export type MyCourseSession = {
  id: string
  date: string
  startTime: string
  endTime: string
  location: string | null
  status: AttendanceStatus | null
  makeupSessionId: string | null
  cancelled: boolean
}

export type MyCourseEntry = {
  enrollmentId: string
  enrollmentStatus: string
  courseId: string
  title: string
  typeName: string
  instructorName: string | null
  price: number | null
  sessions: MyCourseSession[]
  lastSessionDate: string | null
  // Missed sessions with no makeup scheduled — the one thing a student is
  // expected to act on from this page.
  missedCount: number
}

type RawCourse = {
  id: string
  title: string | null
  price: number | null
  course_types: { name: string; short_code: string } | null
  instructor: { first_name: string; last_name: string } | null
  sessions: { id: string; date: string; start_time: string; end_time: string; location: string | null }[]
}

/**
 * Everything the student's My Courses page shows (10.7): enrollments joined to
 * their attendance records. Replaces the separate /student/attendance and
 * /student/history pages, which read the same two sources independently and
 * made the student check three places to answer "what am I in, and did I miss
 * anything?".
 *
 * Enrollments are the spine — a course with no attendance rows yet still shows
 * its schedule. Attendance comes from the shared `fetchStudentHistory` helper
 * so this page and the admin/instructor student views can't drift.
 */
export async function fetchMyCourses(
  supabase: SupabaseClient,
  studentId: string,
): Promise<{ data: MyCourseEntry[]; error: string | null }> {
  const [enrollmentsResult, history] = await Promise.all([
    supabase
      .from('enrollments')
      .select(`
        id, status, hold_expires_at,
        courses (
          id, title, price,
          course_types ( name, short_code ),
          instructor:profiles!courses_instructor_id_fkey ( first_name, last_name ),
          sessions ( id, date, start_time, end_time, location )
        )
      `)
      .eq('student_id', studentId)
      .neq('status', 'cancelled')
      .order('enrolled_at', { ascending: false }),
    fetchStudentHistory(supabase, studentId),
  ])

  if (enrollmentsResult.error) return { data: [], error: enrollmentsResult.error.message }
  if (history.error) return { data: [], error: history.error }

  // sessionId -> attendance, flattened across every course in the history.
  const attendanceBySession = new Map(
    history.data.flatMap((c) => c.records.map((r) => [r.sessionId, r] as const)),
  )

  const now = new Date()

  // Filter out pending_payment with an expired hold — those are stale records
  // waiting on the daily expire-holds cron sweep. From the student's
  // perspective the enrollment is gone (no spot held); showing it would lie.
  const live = (enrollmentsResult.data ?? []).filter((e) => {
    if (e.status !== 'pending_payment') return true
    if (!e.hold_expires_at) return false
    return new Date(e.hold_expires_at) > now
  })

  const data = live.map((e) => {
    const course = e.courses as unknown as RawCourse | null
    const raw = [...(course?.sessions ?? [])].sort((a, b) => a.date.localeCompare(b.date))

    let missedCount = 0
    const sessions: MyCourseSession[] = raw.map((s) => {
      const record = attendanceBySession.get(s.id)
      if (record && record.status === 'missed' && !record.makeupSessionId) missedCount++
      return {
        id: s.id,
        date: s.date,
        startTime: s.start_time,
        endTime: s.end_time,
        location: s.location,
        status: record?.status ?? null,
        makeupSessionId: record?.makeupSessionId ?? null,
        cancelled: record?.cancelled ?? false,
      }
    })

    const instructor = course?.instructor
    return {
      enrollmentId: e.id,
      enrollmentStatus: e.status,
      courseId: course?.id ?? '',
      title: course?.title ?? course?.course_types?.name ?? '—',
      typeName: course?.course_types?.name ?? '—',
      instructorName: instructor ? `${instructor.first_name} ${instructor.last_name}` : null,
      price: course?.price ?? null,
      sessions,
      lastSessionDate: sessions.length > 0 ? sessions[sessions.length - 1].date : null,
      missedCount,
    }
  })

  return { data, error: null }
}
