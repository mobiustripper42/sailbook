'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/(auth)/actions'

const links = [
  { href: '/student/dashboard', label: 'Dashboard' },
  { href: '/student/courses', label: 'Browse Courses' },
  { href: '/student/my-courses', label: 'My Courses' },
  { href: '/student/attendance', label: 'Attendance' },
]

export default function MobileNavDrawer({ name }: { name: string }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 h-14 border-b bg-white">
        <Link href="/student/dashboard" className="font-semibold text-sm tracking-tight">
          SailBook
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="p-2 -mr-2 text-muted-foreground hover:text-foreground"
          aria-label="Open navigation"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="2" y1="5" x2="18" y2="5" />
            <line x1="2" y1="10" x2="18" y2="10" />
            <line x1="2" y1="15" x2="18" y2="15" />
          </svg>
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'md:hidden fixed inset-y-0 left-0 z-40 w-64 bg-white flex flex-col border-r transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        )}
      >
        <div className="px-4 py-5 border-b flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm tracking-tight">SailBook</p>
            <p className="text-xs text-muted-foreground">Student</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 text-muted-foreground hover:text-foreground"
            aria-label="Close navigation"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="2" y1="2" x2="14" y2="14" />
              <line x1="14" y1="2" x2="2" y2="14" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'block px-3 py-2 rounded-lg text-sm transition-colors',
                pathname === href || (href !== '/student/dashboard' && pathname.startsWith(href))
                  ? 'bg-foreground text-background font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-4 border-t">
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
      </div>
    </>
  )
}
