import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MyCoursesList from '@/components/student/my-courses-list'

export default async function MyCoursesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: enrollments, error } = await supabase
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
    .eq('student_id', user.id)
    .neq('status', 'cancelled')
    .order('enrolled_at', { ascending: false })

  if (error) return <div className="text-destructive">{error.message}</div>

  type RawCourse = {
    id: string
    title: string | null
    price: number | null
    course_types: { name: string; short_code: string } | null
    instructor: { first_name: string; last_name: string } | null
    sessions: { id: string; date: string; start_time: string; end_time: string; location: string | null }[]
  }

  const now = new Date()
  // Filter out pending_payment with expired hold — those are stale records
  // waiting on the daily expire-holds cron sweep. From the student's perspective
  // the enrollment is gone (no spot held); showing it would lie about state.
  const filtered = (enrollments ?? []).filter((e) => {
    if (e.status !== 'pending_payment') return true
    if (!e.hold_expires_at) return false
    return new Date(e.hold_expires_at) > now
  })

  const courses = filtered.map((e) => {
    const course = e.courses as unknown as RawCourse | null
    const sessions = (course?.sessions ?? []).sort((a, b) => a.date.localeCompare(b.date))
    const lastSessionDate = sessions.length > 0 ? sessions[sessions.length - 1].date : null
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
      lastSessionDate,
    }
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">My Courses</h1>
      </div>
      <MyCoursesList courses={courses} />
    </div>
  )
}
