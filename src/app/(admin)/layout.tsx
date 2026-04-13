import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/(auth)/actions'
import AdminNav from '@/components/admin/admin-nav'
import { ThemeToggle } from '@/components/theme-toggle'
import { ThemeSync } from '@/components/theme-sync'

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

  const name = `${user.user_metadata?.first_name ?? ''} ${user.user_metadata?.last_name ?? ''}`.trim() || user.email

  const { data: profile } = await supabase
    .from('profiles')
    .select('theme_preference')
    .eq('id', user.id)
    .single()
  const themePreference = (profile as { theme_preference?: string } | null)?.theme_preference ?? 'dark'

  return (
    <div className="flex min-h-screen">
      <ThemeSync preference={themePreference} />
      <aside className="w-56 border-r bg-sidebar flex flex-col shrink-0">
        <div className="px-4 py-5 border-b">
          <Link href="/admin/dashboard" className="font-semibold text-sm tracking-tight">
            SailBook
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">Admin</p>
        </div>
        <AdminNav />
        <div className="px-4 py-4 border-t mt-auto">
          <p className="text-xs text-muted-foreground truncate">{name}</p>
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
      <main className="flex-1 min-w-0 bg-background">
        {children}
      </main>
    </div>
  )
}
