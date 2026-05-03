import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getPrimaryHome } from '@/lib/auth/primary-home'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const dashboardHref = user ? getPrimaryHome(user.user_metadata ?? {}) : null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="SailBook" width={28} height={28} className="rounded-xs" />
            <span className="font-semibold text-sm">SailBook</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {user && dashboardHref ? (
              <Link
                href={dashboardHref}
                className="bg-primary text-primary-foreground px-3 py-1.5 rounded-xs font-medium hover:bg-primary/90 transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/register" className="text-muted-foreground hover:text-foreground transition-colors">
                  Create account
                </Link>
                <Link
                  href="/login"
                  className="bg-primary text-primary-foreground px-3 py-1.5 rounded-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
