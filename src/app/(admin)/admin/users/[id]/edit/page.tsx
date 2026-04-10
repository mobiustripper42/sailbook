import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import UserEditForm from '@/components/admin/user-edit-form'

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: profile }, { data: { user } }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, first_name, last_name, email, phone, is_admin, is_instructor, is_student, is_active')
      .eq('id', id)
      .single(),
    supabase.auth.getUser(),
  ])

  if (!profile) notFound()

  return (
    <div className="p-8">
      <p className="text-sm text-muted-foreground mb-1">
        <Link href="/admin/users" className="hover:underline">Users</Link>
        {' / '}
        {profile.first_name} {profile.last_name}
        {' / Edit'}
      </p>
      <h1 className="text-2xl font-semibold mb-6">
        Edit User — {profile.first_name} {profile.last_name}
      </h1>
      <UserEditForm profile={profile} isSelf={user?.id === profile.id} />
    </div>
  )
}
