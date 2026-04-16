import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/(auth)/actions'
import StudentNav from '@/components/student/student-nav'
import MobileNavDrawer from '@/components/student/mobile-nav-drawer'
import { ThemeToggle } from '@/components/theme-toggle'
import RoleToggle from '@/components/role-toggle'

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const firstName = user?.user_metadata?.first_name
  return { title: firstName ? `SailBook - ${firstName}` : 'SailBook' }
}

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = (`${user.user_metadata?.first_name ?? ''} ${user.user_metadata?.last_name ?? ''}`.trim() || user.email) ?? ''

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_instructor')
    .eq('id', user.id)
    .single()
  const isInstructor = (profile as { is_instructor?: boolean } | null)?.is_instructor ?? false

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-56 border-r bg-sidebar flex-col shrink-0">
        <div className="px-4 py-5 border-b">
          <Link href="/student/dashboard" className="font-semibold text-sm tracking-tight">
            SailBook
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">Student</p>
        </div>
        <StudentNav />
        <div className="px-4 py-4 border-t mt-auto">
          <p className="text-xs text-muted-foreground truncate">{name}</p>
          {isInstructor && (
            <RoleToggle href="/instructor/dashboard" label="Switch to Instructor View" />
          )}
          <div className="flex items-center justify-between mt-1">
            <form action={signOut}>
              <button
                type="submit"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Sign out
              </button>
            </form>
            <ThemeToggle />
          </div>
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col">
        <MobileNavDrawer name={name} isInstructor={isInstructor} />
        <main className="flex-1 bg-background p-4 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
