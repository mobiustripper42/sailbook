import Link from 'next/link'
import { NavLinks } from './nav-links'
import { SidebarFooter } from './sidebar-footer'
import { ROLE_HOME, ROLE_LABEL, type Role } from './nav-config'

// Desktop sidebar (hidden on mobile; the drawer takes over below md).
export function AppSidebar({
  name,
  role,
  roles,
}: {
  name: string
  role: Role
  roles: Record<Role, boolean>
}) {
  return (
    <aside className="hidden md:flex w-56 border-r bg-sidebar flex-col shrink-0 sticky top-0 h-screen overflow-y-auto">
      <div className="px-4 py-5 border-b">
        <Link
          href={ROLE_HOME[role]}
          className="flex items-center gap-2 font-semibold text-sm tracking-tight"
        >
          <span className="size-3.5 rounded bg-brand shrink-0" aria-hidden />
          SailBook
        </Link>
        <p className="text-xs text-muted-foreground mt-0.5">{ROLE_LABEL[role]}</p>
        <p className="text-[11px] text-faint mt-1">Learn to Sail Cleveland</p>
      </div>
      <NavLinks role={role} />
      <SidebarFooter name={name} role={role} roles={roles} />
    </aside>
  )
}
