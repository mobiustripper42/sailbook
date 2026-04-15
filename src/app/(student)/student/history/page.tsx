import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchStudentHistory } from '@/lib/student-history'
import StudentHistoryList from '@/components/student/student-history-list'

export default async function StudentHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('asa_number')
    .eq('id', user.id)
    .single()

  const { data: courses, error } = await fetchStudentHistory(supabase, user.id)
  if (error) return <p className="text-sm text-destructive">{error}</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Experience</h1>
        {profile?.asa_number && (
          <p className="text-sm text-muted-foreground mt-1">ASA #: {profile.asa_number}</p>
        )}
      </div>
      <StudentHistoryList
        courses={courses}
        emptyMessage="No course history yet. Enroll in a course to get started."
      />
    </div>
  )
}
