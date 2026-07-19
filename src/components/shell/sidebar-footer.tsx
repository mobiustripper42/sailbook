'use client'

import Link from 'next/link'
import { signOut } from '@/app/(auth)/actions'
import { ThemeToggle } from '@/components/theme-toggle'
import RoleToggle from '@/components/role-toggle'
import { ALL_ROLES, ROLE_HOME, ROLE_LABEL, type Role } from './nav-config'

// Shared footer for sidebar + drawer: name, cross-role toggles (derived from
// the flags the user actually holds, for every role other than the current
// one), change password, sign out, theme toggle.
export function SidebarFooter({
  name,
  role,
  roles,
  onNavigate,
}: {
  name: string
  role: Role
  roles: Record<Role, boolean>
  onNavigate?: () => void
}) {
  const otherRoles = ALL_ROLES.filter((r) => r !== role && roles[r])

  return (
    <div className="px-4 py-4 border-t mt-auto">
      <p className="text-xs text-muted-foreground truncate">{name}</p>
      {otherRoles.map((r) => (
        <RoleToggle key={r} href={ROLE_HOME[r]} label={`Switch to ${ROLE_LABEL[r]} View`} />
      ))}
      <div className="flex items-end justify-between mt-1">
        <div className="flex flex-col gap-0.5">
          <Link
            href="/account/password"
            onClick={onNavigate}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Change password
          </Link>
          <form action={signOut}>
            <button type="submit" className="text-xs text-muted-foreground hover:text-foreground">
              Sign out
            </button>
          </form>
        </div>
        <ThemeToggle />
      </div>
    </div>
  )
}
