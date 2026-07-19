'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NavLinks } from './nav-links'
import { SidebarFooter } from './sidebar-footer'
import { ROLE_HOME, ROLE_LABEL, type Role } from './nav-config'

// Mobile top bar + slide-in drawer (visible below md). DOM contract preserved
// from the old per-role drawers so the nav Playwright specs stay green:
// aria-label "Open/Close navigation", the .fixed.inset-y-0.left-0.z-40 drawer,
// and the bg-black/40 overlay.
export function AppMobileDrawer({
  name,
  role,
  roles,
}: {
  name: string
  role: Role
  roles: Record<Role, boolean>
}) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <>
      <div className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 h-14 border-b bg-sidebar">
        <Link
          href={ROLE_HOME[role]}
          className="flex items-center gap-2 font-semibold text-sm tracking-tight"
        >
          <span className="size-3.5 rounded bg-brand shrink-0" aria-hidden />
          SailBook
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="p-2 -mr-2 text-muted-foreground hover:text-foreground"
          aria-label="Open navigation"
        >
          <Menu size={20} aria-hidden />
        </button>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/40" onClick={close} />
      )}

      <div
        className={cn(
          'md:hidden fixed inset-y-0 left-0 z-40 w-64 bg-sidebar flex flex-col border-r transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full pointer-events-none',
        )}
      >
        <div className="px-4 py-5 border-b flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm tracking-tight">SailBook</p>
            <p className="text-xs text-muted-foreground">{ROLE_LABEL[role]}</p>
          </div>
          <button
            onClick={close}
            className="p-1 text-muted-foreground hover:text-foreground"
            aria-label="Close navigation"
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <NavLinks role={role} onNavigate={close} />
        <SidebarFooter name={name} role={role} roles={roles} onNavigate={close} />
      </div>
    </>
  )
}
