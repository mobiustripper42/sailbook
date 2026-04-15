import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchStudentHistory } from '@/lib/student-history'
import StudentHistoryList from '@/components/student/student-history-list'

export default async function StudentHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: courses, error } = await fetchStudentHistory(supabase, user.id)
  if (error) return <div className="text-destructive">{error}</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Experience</h1>
      <StudentHistoryList
        courses={courses}
        emptyMessage="No course history yet. Enroll in a course to get started."
      />
    </div>
  )
}
