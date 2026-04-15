import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchStudentHistory } from '@/lib/student-history'
import StudentHistoryList from '@/components/student/student-history-list'

export default async function InstructorStudentViewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, experience_level')
    .eq('id', id)
    .eq('is_student', true)
    .single()

  if (!profile) notFound()

  const { data: courses, error } = await fetchStudentHistory(supabase, id)

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href="/instructor/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to dashboard
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">
          {profile.first_name} {profile.last_name}
        </h1>
        {profile.experience_level && (
          <p className="text-sm text-muted-foreground capitalize">
            Experience: {profile.experience_level}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-semibold">Course History</h2>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <StudentHistoryList
            courses={courses}
            emptyMessage="No course history for this student."
          />
        )}
      </div>
    </div>
  )
}
