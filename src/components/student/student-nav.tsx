'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const links = [
  { href: '/student/dashboard', label: 'Dashboard' },
  { href: '/student/courses', label: 'Browse Courses' },
  { href: '/student/my-courses', label: 'My Courses' },
  { href: '/student/attendance', label: 'Attendance' },
  { href: '/student/history', label: 'Experience' },
]

export default function StudentNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-2 py-3 space-y-0.5">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
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
  )
}
