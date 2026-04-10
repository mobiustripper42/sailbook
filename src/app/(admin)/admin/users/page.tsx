import { createClient } from '@/lib/supabase/server'
import UsersList from '@/components/admin/users-list'

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, is_admin, is_instructor, is_student, is_active')
    .order('last_name')

  if (error) return <div className="p-8 text-destructive">{error.message}</div>

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">{users?.length ?? 0} total</p>
      </div>
      <UsersList users={users ?? []} />
    </div>
  )
}
