import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CreateAdminStudentForm from '@/components/admin/create-admin-student-form'

export default async function NewStudentPage() {
  const supabase = await createClient()

  const { data: codes } = await supabase
    .from('codes')
    .select('value, label')
    .eq('category', 'experience_level')
    .eq('is_active', true)
    .order('sort_order')

  return (
    <div className="max-w-lg">
      <p className="text-sm text-muted-foreground mb-1">
        <Link href="/admin/students" className="hover:underline">Students</Link>
        {' / New'}
      </p>
      <h1 className="text-2xl font-semibold mb-1">Add Student</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Creates a student account without a password. The student can log in later using "Forgot Password" with their email.
      </p>
      <CreateAdminStudentForm experienceCodes={codes ?? []} />
    </div>
  )
}
