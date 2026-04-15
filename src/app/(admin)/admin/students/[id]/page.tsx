import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchStudentHistory } from '@/lib/student-history'
import StudentHistoryList from '@/components/student/student-history-list'

export default async function AdminStudentViewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, phone, experience_level')
    .eq('id', id)
    .eq('is_student', true)
    .single()

  if (!profile) notFound()

  const { data: courses, error } = await fetchStudentHistory(supabase, id)

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div>
        <p className="text-sm text-muted-foreground mb-1">
          <Link href="/admin/students" className="hover:underline">Students</Link>
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
          {profile.experience_level && (
            <p className="capitalize">Experience: {profile.experience_level}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-medium">Course History</h2>
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
