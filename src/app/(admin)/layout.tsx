import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/(auth)/actions'
import AdminNav from '@/components/admin/admin-nav'
import AdminMobileNavDrawer from '@/components/admin/admin-mobile-nav-drawer'
import { ThemeToggle } from '@/components/theme-toggle'
import RoleToggle from '@/components/role-toggle'

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const firstName = user?.user_metadata?.first_name
  return { title: firstName ? `SailBook - ${firstName}` : 'SailBook' }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = (`${user.user_metadata?.first_name ?? ''} ${user.user_metadata?.last_name ?? ''}`.trim() || user.email) ?? ''

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_instructor, is_student')
    .eq('id', user.id)
    .single()
  const isInstructor = (profile as { is_instructor?: boolean } | null)?.is_instructor ?? false
  const isStudent = (profile as { is_student?: boolean } | null)?.is_student ?? false

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-56 border-r bg-sidebar flex-col shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="px-4 py-5 border-b">
          <Link href="/admin/dashboard" className="font-semibold text-sm tracking-tight">
            SailBook
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">Admin</p>
        </div>
        <AdminNav />
        <div className="px-4 py-4 border-t mt-auto">
          <p className="text-xs text-muted-foreground truncate">{name}</p>
          {isInstructor && (
            <RoleToggle href="/instructor/dashboard" label="Switch to Instructor View" />
          )}
          {isStudent && (
            <RoleToggle href="/student/dashboard" label="Switch to Student View" />
          )}
          <div className="flex items-end justify-between mt-1">
            <div className="flex flex-col gap-0.5">
              <Link
                href="/account/password"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Change password
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Sign out
                </button>
              </form>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col">
        <AdminMobileNavDrawer name={name} isInstructor={isInstructor} isStudent={isStudent} />
        <main className="flex-1 min-w-0 bg-background p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
