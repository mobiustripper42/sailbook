import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchStudentHistory } from '@/lib/student-history'
import StudentHistoryList from '@/components/student/student-history-list'
import AdminEnrollCoursePanel from '@/components/admin/admin-enroll-course-panel'

export default async function AdminStudentViewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, phone, experience_level, asa_number, address_line1, address_line2, city, state, postal_code')
    .eq('id', id)
    .eq('is_student', true)
    .single()

  if (!profile) notFound()

  const { data: courses, error } = await fetchStudentHistory(supabase, id)

  // Courses this student could still be enrolled in (#137) — active courses
  // minus the ones they already hold a non-cancelled enrollment in, so the
  // picker can't offer a duplicate the action would just reject.
  const [{ data: activeCourses }, { data: heldEnrollments }] = await Promise.all([
    supabase
      .from('courses')
      .select('id, title, price, course_types ( name )')
      .eq('status', 'active')
      .order('title'),
    supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', id)
      .neq('status', 'cancelled'),
  ])

  const takenCourseIds = new Set((heldEnrollments ?? []).map((e) => e.course_id))
  const enrollableCourses = (activeCourses ?? [])
    .filter((c) => !takenCourseIds.has(c.id))
    .map((c) => {
      const type = c.course_types as unknown as { name: string } | null
      return {
        id: c.id,
        title: c.title ?? type?.name ?? 'Course',
        priceCents: c.price != null ? Math.round(c.price * 100) : null,
      }
    })

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="text-sm text-muted-foreground mb-1">
          <Link href="/admin/users" className="hover:underline hover:text-foreground">Users</Link>
          {' / '}
          {profile.first_name} {profile.last_name}
        </p>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold">
            {profile.first_name} {profile.last_name}
          </h1>
          <Link
            href={`/admin/students/${id}/edit`}
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 shrink-0"
          >
            Edit
          </Link>
        </div>
        <div className="mt-2 space-y-0.5 text-sm text-muted-foreground">
          <p>{profile.email}</p>
          {profile.phone && <p>{profile.phone}</p>}
          {profile.asa_number && <p>ASA #: {profile.asa_number}</p>}
          {profile.experience_level && (
            <p className="capitalize">Experience: {profile.experience_level}</p>
          )}
        </div>
        {profile.address_line1 && (
          <div className="mt-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Mailing address</p>
            <p>{profile.address_line1}</p>
            {profile.address_line2 && <p>{profile.address_line2}</p>}
            <p>
              {[profile.city, profile.state].filter(Boolean).join(', ')}
              {profile.postal_code ? ` ${profile.postal_code}` : ''}
            </p>
          </div>
        )}
      </div>

      <AdminEnrollCoursePanel studentId={id} courses={enrollableCourses} />

      <div className="space-y-3">
        <h2 className="text-base font-semibold">Course History</h2>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <StudentHistoryList
            courses={courses}
            emptyMessage="No course history for this student."
            courseBasePath="/admin/courses"
          />
        )}
      </div>
    </div>
  )
}
