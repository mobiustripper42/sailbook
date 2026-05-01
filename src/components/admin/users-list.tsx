'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import InstructorActions from '@/components/admin/instructor-actions'
import { cn } from '@/lib/utils'

type User = {
  id: string
  first_name: string
  last_name: string
  email: string
  is_admin: boolean
  is_instructor: boolean
  is_student: boolean
  is_active: boolean
}

type RoleFilter = 'all' | 'admin' | 'instructor' | 'student'
type SortKey = 'name' | 'email' | 'status'
type SortDir = 'asc' | 'desc'

const ROLE_FILTERS: { label: string; value: RoleFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Admin', value: 'admin' },
  { label: 'Instructor', value: 'instructor' },
  { label: 'Student', value: 'student' },
]

function compareUsers(a: User, b: User, key: SortKey): number {
  if (key === 'name') {
    const aKey = `${a.last_name} ${a.first_name}`.toLowerCase()
    const bKey = `${b.last_name} ${b.first_name}`.toLowerCase()
    return aKey.localeCompare(bKey)
  }
  if (key === 'email') {
    return a.email.toLowerCase().localeCompare(b.email.toLowerCase())
  }
  // status: active first ascending
  if (a.is_active === b.is_active) return 0
  return a.is_active ? -1 : 1
}

export default function UsersList({ users }: { users: User[] }) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filtered = users.filter((u) => {
    const matchesSearch =
      search === '' ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())

    const matchesRole =
      roleFilter === 'all' ||
      (roleFilter === 'admin' && u.is_admin) ||
      (roleFilter === 'instructor' && u.is_instructor) ||
      (roleFilter === 'student' && u.is_student)

    return matchesSearch && matchesRole
  })

  const sorted = [...filtered].sort((a, b) => {
    const cmp = compareUsers(a, b, sortKey)
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex gap-1">
          {ROLE_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setRoleFilter(value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm transition-colors',
                roleFilter === value
                  ? 'bg-foreground text-background font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          message={
            search || roleFilter !== 'all'
              ? 'No users match your filters.'
              : 'No users found.'
          }
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead label="Name" sortKey="name" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortableHead label="Email" sortKey="email" activeKey={sortKey} dir={sortDir} onClick={toggleSort} className="hidden sm:table-cell" />
                <TableHead>Roles</TableHead>
                <SortableHead label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((u) => {
                const editHref = u.is_student
                  ? `/admin/students/${u.id}/edit`
                  : `/admin/users/${u.id}/edit`
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.first_name} {u.last_name}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{u.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {u.is_admin && <Badge variant="ok">Admin</Badge>}
                        {u.is_instructor && <Badge variant="neutral">Instructor</Badge>}
                        {u.is_student && <Badge variant="neutral">Student</Badge>}
                        {!u.is_admin && !u.is_instructor && !u.is_student && (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.is_active ? 'ok' : 'neutral'}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {u.is_student && (
                          <Link
                            href={`/admin/students/${u.id}`}
                            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
                          >
                            View
                          </Link>
                        )}
                        <Link
                          href={editHref}
                          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
                        >
                          Edit
                        </Link>
                        {u.is_instructor && (
                          <InstructorActions id={u.id} isActive={u.is_active} />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function SortableHead({
  label,
  sortKey,
  activeKey,
  dir,
  onClick,
  className,
}: {
  label: string
  sortKey: SortKey
  activeKey: SortKey
  dir: SortDir
  onClick: (key: SortKey) => void
  className?: string
}) {
  const isActive = sortKey === activeKey
  return (
    <TableHead className={className} aria-sort={isActive ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => onClick(sortKey)}
        className="inline-flex items-center gap-1 text-left hover:text-foreground"
      >
        {label}
        <span className={cn('text-xs', isActive ? 'text-foreground' : 'text-muted-foreground/40')}>
          {isActive ? (dir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </button>
    </TableHead>
  )
}
