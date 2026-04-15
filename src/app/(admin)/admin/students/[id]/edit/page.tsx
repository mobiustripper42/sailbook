import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileEditForm from '@/components/admin/profile-edit-form'

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, phone, experience_level, asa_number, is_active, is_student, is_instructor')
    .eq('id', id)
    .eq('is_student', true)
    .single()

  if (!profile) notFound()

  return (
    <div className="">
      <p className="text-sm text-muted-foreground mb-1">
        <Link href="/admin/students" className="hover:underline">Students</Link>
        {' / '}
        {profile.first_name} {profile.last_name}
        {' / Edit'}
      </p>
      <h1 className="text-2xl font-semibold mb-6">
        Edit Student — {profile.first_name} {profile.last_name}
      </h1>
      <ProfileEditForm profile={profile} returnPath="/admin/students" />
    </div>
  )
}
