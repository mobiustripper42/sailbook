import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/(auth)/actions'
import StudentNav from '@/components/student/student-nav'
import MobileNavDrawer from '@/components/student/mobile-nav-drawer'

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

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-56 border-r bg-white flex-col shrink-0">
        <div className="px-4 py-5 border-b">
          <Link href="/student/dashboard" className="font-semibold text-sm tracking-tight">
            SailBook
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">Student</p>
        </div>
        <StudentNav />
        <div className="px-4 py-4 border-t mt-auto">
          <p className="text-xs text-muted-foreground truncate">{name}</p>
          <form action={signOut}>
            <button
              type="submit"
              className="text-xs text-muted-foreground hover:text-foreground mt-1"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col">
        <MobileNavDrawer name={name} />
        <main className="flex-1 bg-background p-4 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
