import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/(auth)/actions'

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const firstName = user.user_metadata?.first_name ?? ''
  const name = `${firstName} ${user.user_metadata?.last_name ?? ''}`.trim() || user.email

  return (
    <>
    <title>{firstName ? `SailBook - ${firstName}` : 'SailBook'}</title>
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-white flex flex-col shrink-0">
        <div className="px-4 py-5 border-b">
          <Link href="/instructor/dashboard" className="font-semibold text-sm tracking-tight">
            SailBook
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">Instructor</p>
        </div>
        <nav className="flex-1 px-2 py-3">
          <Link
            href="/instructor/dashboard"
            className="block px-3 py-2 rounded-lg text-sm bg-foreground text-background font-medium"
          >
            Dashboard
          </Link>
        </nav>
        <div className="px-4 py-4 border-t mt-auto">
          <p className="text-xs text-muted-foreground truncate">{name}</p>
          <form action={signOut}>
            <button type="submit" className="text-xs text-muted-foreground hover:text-foreground mt-1">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 min-w-0 bg-background">
        {children}
      </main>
    </div>
    </>
  )
}
