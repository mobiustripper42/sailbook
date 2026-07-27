import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchMyCourses } from '@/lib/student-courses'
import MyCoursesList from '@/components/student/my-courses-list'

export const metadata = { title: 'SailBook — My Courses' }

export default async function MyCoursesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: courses, error }] = await Promise.all([
    supabase.from('profiles').select('asa_number').eq('id', user.id).maybeSingle(),
    fetchMyCourses(supabase, user.id),
  ])

  if (error) return <div className="text-destructive">{error}</div>

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">My Courses</h1>
        <p className="text-sm text-muted-foreground">
          Your schedule, attendance, and course history in one place.
          {profile?.asa_number ? ` ASA #: ${profile.asa_number}` : ''}
        </p>
      </div>
      <MyCoursesList courses={courses} />
    </div>
  )
}
