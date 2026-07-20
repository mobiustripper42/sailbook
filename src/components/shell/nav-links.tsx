'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NAV_ITEMS, ROLE_HOME, type Role } from './nav-config'

// Shared active-styled nav list used by both the desktop sidebar and the
// mobile drawer. Active-match logic mirrors the pre-redesign navs: exact match,
// or a startsWith for any non-home route (so /admin/courses/[id] stays active).
export function NavLinks({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname()
  const home = ROLE_HOME[role]

  return (
    <nav className="flex-1 px-2 py-3 space-y-0.5">
      {NAV_ITEMS[role].map(({ href, label, icon: Icon, match }) => {
        const active =
          pathname === href ||
          (href !== home && pathname.startsWith(href)) ||
          (match?.some((m) => pathname.startsWith(m)) ?? false)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
              active
                ? 'bg-info-bg text-brand-ink font-semibold'
                : 'text-muted-foreground hover:bg-sink hover:text-foreground',
            )}
          >
            <Icon size={16} aria-hidden className="shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
