'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { toggleCourseTypeActive } from '@/actions/course-types'

export type CourseTypeRow = {
  id: string
  name: string
  short_code: string
  certification_body: string | null
  max_students: number
  min_hours: number | null
  is_active: boolean
}

type SortKey = 'name' | 'short_code' | 'certification_body' | 'max_students' | 'is_active'
type SortDir = 'asc' | 'desc'

function compareCourseTypes(a: CourseTypeRow, b: CourseTypeRow, key: SortKey): number {
  switch (key) {
    case 'name':
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    case 'short_code':
      return a.short_code.toLowerCase().localeCompare(b.short_code.toLowerCase())
    case 'certification_body': {
      const aVal = (a.certification_body ?? 'zzz').toLowerCase()
      const bVal = (b.certification_body ?? 'zzz').toLowerCase()
      return aVal.localeCompare(bVal)
    }
    case 'max_students':
      return a.max_students - b.max_students
    case 'is_active':
      return (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0)
  }
}

function RowActions({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition()
  const [optimisticActive, setOptimisticActive] = useState(isActive)
  const [error, setError] = useState<string | null>(null)

  function handleToggle() {
    const prev = optimisticActive
    setError(null)
    setOptimisticActive(!prev)
    startTransition(async () => {
      try {
        const result = await toggleCourseTypeActive(id, prev)
        if (result.error) {
          setOptimisticActive(prev)
          setError(result.error)
        }
      } catch {
        setOptimisticActive(prev)
        setError('Network error — please try again.')
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={pending} aria-label="Course type actions">
            •••
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/admin/course-types/${id}/edit`}>Edit</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/admin/course-types/${id}/edit#prerequisites`}>Manage Prerequisites</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleToggle}>
            {optimisticActive ? 'Deactivate' : 'Activate'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export default function CourseTypesList({ courseTypes }: { courseTypes: CourseTypeRow[] }) {
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

  const sorted = [...courseTypes].sort((a, b) => {
    const cmp = compareCourseTypes(a, b, sortKey)
    return sortDir === 'asc' ? cmp : -cmp
  })

  if (sorted.length === 0) {
    return <EmptyState message="No course types yet." />
  }

  return (
    <div className="rounded-lg border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead label="Name" sortKey="name" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortableHead label="Code" sortKey="short_code" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortableHead label="Cert Body" sortKey="certification_body" activeKey={sortKey} dir={sortDir} onClick={toggleSort} className="hidden sm:table-cell" />
            <SortableHead label="Max Students" sortKey="max_students" activeKey={sortKey} dir={sortDir} onClick={toggleSort} className="hidden md:table-cell" />
            <TableHead className="hidden md:table-cell">Min Hours</TableHead>
            <SortableHead label="Status" sortKey="is_active" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((ct) => (
            <TableRow key={ct.id}>
              <TableCell className="font-medium">
                <Link
                  href={`/admin/course-types/${ct.id}/edit`}
                  className="hover:underline underline-offset-2"
                  data-testid="course-type-name-link"
                >
                  {ct.name}
                </Link>
              </TableCell>
              <TableCell className="font-mono text-sm">{ct.short_code}</TableCell>
              <TableCell className="hidden sm:table-cell">{ct.certification_body ?? '—'}</TableCell>
              <TableCell className="hidden md:table-cell">{ct.max_students}</TableCell>
              <TableCell className="hidden md:table-cell">{ct.min_hours ?? '—'}</TableCell>
              <TableCell>
                <Badge variant={ct.is_active ? 'ok' : 'neutral'}>
                  {ct.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                <RowActions id={ct.id} isActive={ct.is_active} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
