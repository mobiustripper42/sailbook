'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const links = [
  { href: '/instructor/dashboard', label: 'Dashboard' },
]

export default function InstructorDesktopNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-2 py-3 space-y-0.5">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'block px-3 py-2 rounded-lg text-sm transition-colors',
            pathname === href || (href !== '/instructor/dashboard' && pathname.startsWith(href))
              ? 'bg-accent text-accent-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
