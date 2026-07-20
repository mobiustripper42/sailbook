import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from './app-sidebar'
import { AppMobileDrawer } from './app-mobile-drawer'
import type { Role } from './nav-config'

// Unified role shell: replaces the three near-identical route-group layouts.
// Server component — runs the auth guard and reads all three role flags once,
// then hands them to the (client) sidebar + drawer.
export async function AppShell({
  role,
  children,
}: {
  role: Role
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name =
    (`${user.user_metadata?.first_name ?? ''} ${user.user_metadata?.last_name ?? ''}`.trim() ||
      user.email) ??
    ''

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, is_instructor, is_student')
    .eq('id', user.id)
    .single()
  const p = profile as
    | { is_admin?: boolean; is_instructor?: boolean; is_student?: boolean }
    | null
  const roles: Record<Role, boolean> = {
    admin: p?.is_admin ?? false,
    instructor: p?.is_instructor ?? false,
    student: p?.is_student ?? false,
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar name={name} role={role} roles={roles} />
      <div className="flex-1 min-w-0 flex flex-col">
        <AppMobileDrawer name={name} role={role} roles={roles} />
        <main className="flex-1 min-w-0 bg-background p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
