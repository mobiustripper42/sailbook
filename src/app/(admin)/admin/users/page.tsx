import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import UsersList from '@/components/admin/users-list'
import InvitePanel from '@/components/admin/invite-panel'

export default async function UsersPage() {
  const supabase = await createClient()

  const [usersResult, invitesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, first_name, last_name, email, is_admin, is_instructor, is_student, is_active')
      .order('last_name'),
    supabase
      .from('invites')
      .select('role, token, created_at'),
  ])

  const { data: users, error } = usersResult
  if (error) return <div className="text-destructive text-sm">{error.message}</div>

  const invites = invitesResult.data ?? []
  const adminInvite = invites.find((i) => i.role === 'admin')
  const instructorInvite = invites.find((i) => i.role === 'instructor')

  return (
    <div className="">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">{users?.length ?? 0} total</p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/students/new">Add Student</Link>
        </Button>
      </div>

      {invitesResult.error && (
        <div className="text-destructive mb-4 text-sm">
          Could not load invite links: {invitesResult.error.message}
        </div>
      )}

      <div className="space-y-2 mb-6">
        <details className="group rounded-md border bg-card">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium select-none list-none flex items-center justify-between">
            <span>Admin invites</span>
            <span className="text-muted-foreground text-xs group-open:hidden">Show</span>
            <span className="text-muted-foreground text-xs hidden group-open:inline">Hide</span>
          </summary>
          <div className="px-4 pb-4">
            <InvitePanel role="admin" token={adminInvite?.token ?? null} createdAt={adminInvite?.created_at ?? null} />
          </div>
        </details>
        <details className="group rounded-md border bg-card">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium select-none list-none flex items-center justify-between">
            <span>Instructor invites</span>
            <span className="text-muted-foreground text-xs group-open:hidden">Show</span>
            <span className="text-muted-foreground text-xs hidden group-open:inline">Hide</span>
          </summary>
          <div className="px-4 pb-4">
            <InvitePanel role="instructor" token={instructorInvite?.token ?? null} createdAt={instructorInvite?.created_at ?? null} />
          </div>
        </details>
      </div>

      <UsersList users={users ?? []} />
    </div>
  )
}
