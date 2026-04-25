export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CoursesCardList, type CourseCardData } from '@/components/student/courses-card-list'
import { CoursesCalendar } from '@/components/student/courses-calendar'
import { CoursesViewSwitcher } from '@/components/student/courses-view-switcher'

export default async function CourseBrowsePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: courses, error },
    { data: enrollmentCounts },
    { data: myEnrollments, error: enrollmentError },
  ] = await Promise.all([
    supabase
      .from('courses')
      .select(`
        id, title, capacity, price,
        course_types ( name, short_code, description ),
        instructor:profiles!courses_instructor_id_fkey ( first_name, last_name ),
        sessions ( date )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: true }),
    // Must use RPC (SECURITY DEFINER) — direct query is filtered by student RLS
    // to the student's own rows, breaking the "Full" badge for unenrolled students.
    supabase.rpc('get_all_course_enrollment_counts'),
    supabase
      .from('enrollments')
      .select('course_id, status')
      .eq('student_id', user.id)
      .neq('status', 'cancelled'),
  ])

  if (error) return <div className="text-destructive">{error.message}</div>
  if (enrollmentError) return <div className="text-destructive">{enrollmentError.message}</div>

  const today = new Date().toISOString().slice(0, 10)

  // Hide courses where every session is in the past. Courses with no sessions yet remain visible.
  const visibleCourses = (courses ?? []).filter((c) => {
    const sessions = (c.sessions as unknown as { date: string }[]) ?? []
    return sessions.length === 0 || sessions.some((s) => s.date >= today)
  })

  const countMap = new Map<string, number>(
    enrollmentCounts?.map(({ course_id, active_count }: { course_id: string; active_count: number }) => [course_id, active_count]) ?? []
  )

  const enrollmentMap = new Map<string, string>(
    myEnrollments?.map(({ course_id, status }: { course_id: string; status: string }) => [course_id, status]) ?? []
  )

  const cardData: CourseCardData[] = visibleCourses.map((c) => {
    const type = c.course_types as unknown as { name: string; short_code: string; description: string | null } | null
    const instructor = c.instructor as unknown as { first_name: string; last_name: string } | null
    const sessions = (c.sessions as unknown as { date: string }[]) ?? []
    const activeEnrollments = countMap.get(c.id) ?? 0
    const spotsRemaining = c.capacity - activeEnrollments
    return {
      id: c.id,
      title: c.title,
      typeName: type?.name ?? null,
      typeShortCode: type?.short_code ?? null,
      typeDescription: type?.description ?? null,
      instructorName: instructor ? `${instructor.first_name} ${instructor.last_name}` : null,
      capacity: c.capacity,
      price: c.price,
      sessionDates: sessions.map((s) => s.date),
      myStatus: enrollmentMap.get(c.id) ?? null,
      spotsRemaining,
      isFull: spotsRemaining <= 0,
    }
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Available Courses</h1>
      </div>

      <CoursesViewSwitcher
        calendar={<CoursesCalendar courses={cardData} />}
        list={<CoursesCardList courses={cardData} />}
      />
    </div>
  )
}
