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
import { cn } from '@/lib/utils'
import { SortableHead } from '@/components/admin/sortable-head'
import { formatSchedule, type ScheduleSession } from '@/lib/course-schedule'

type CourseType = { name: string; short_code: string }
type Instructor = { first_name: string; last_name: string }
type Enrollment = { id: string; status: string }

export type Course = {
  id: string
  title: string | null
  section_label: string | null
  status: string
  capacity: number
  price: number | null
  created_at: string
  course_types: CourseType | null
  instructor: Instructor | null
  sessions: { id: string; date?: string | null; start_time?: string | null; end_time?: string | null }[]
  enrollments: Enrollment[]
}

// Sessions that carry a full date+time triple, ready for the schedule formatter.
function scheduleSessions(c: Course): ScheduleSession[] {
  return c.sessions
    .filter((s): s is { id: string; date: string; start_time: string; end_time: string } =>
      !!s.date && !!s.start_time && !!s.end_time
    )
    .map((s) => ({ date: s.date, start_time: s.start_time, end_time: s.end_time }))
}

type StatusFilter = 'all' | 'draft' | 'active' | 'completed' | 'cancelled'
// 'date' (earliest session date) is the default order (#140) and isn't a
// clickable column — the visible sortable columns are the rest.
type SortKey = 'date' | 'title' | 'instructor' | 'enrolled' | 'status' | 'created_at'
type SortDir = 'asc' | 'desc'

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

const STATUS_ORDER: Record<string, number> = {
  active: 0,
  draft: 1,
  completed: 2,
  cancelled: 3,
}

function enrolledCount(c: Course): number {
  return c.enrollments.filter((e) => e.status === 'confirmed').length
}

function displayTitle(c: Course): string {
  return c.title ?? c.course_types?.name ?? ''
}

// Earliest scheduled session date (ISO yyyy-mm-dd), or '' when a course has no
// dated sessions — those sort last under ascending date order.
function earliestSessionDate(c: Course): string {
  const dates = c.sessions.map((s) => s.date).filter((d): d is string => !!d)
  return dates.length ? dates.reduce((min, d) => (d < min ? d : min)) : ''
}

function compareCourses(a: Course, b: Course, key: SortKey): number {
  switch (key) {
    case 'date': {
      const aDate = earliestSessionDate(a)
      const bDate = earliestSessionDate(b)
      // Courses without sessions ('') sort after dated ones in asc order.
      if (aDate === bDate) return 0
      if (aDate === '') return 1
      if (bDate === '') return -1
      return aDate.localeCompare(bDate)
    }
    case 'title':
      return displayTitle(a).toLowerCase().localeCompare(displayTitle(b).toLowerCase())
    case 'instructor': {
      const aName = a.instructor
        ? `${a.instructor.last_name} ${a.instructor.first_name}`.toLowerCase()
        : 'zzz'
      const bName = b.instructor
        ? `${b.instructor.last_name} ${b.instructor.first_name}`.toLowerCase()
        : 'zzz'
      return aName.localeCompare(bName)
    }
    case 'enrolled':
      return enrolledCount(a) - enrolledCount(b)
    case 'status': {
      const aOrd = STATUS_ORDER[a.status] ?? 99
      const bOrd = STATUS_ORDER[b.status] ?? 99
      return aOrd - bOrd
    }
    case 'created_at':
      return a.created_at.localeCompare(b.created_at)
  }
}

export default function CoursesList({ courses }: { courses: Course[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  // Default to date order (#140): earliest session first.
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const q = search.toLowerCase()

  const filtered = courses.filter((c) => {
    const matchesSearch =
      q === '' ||
      (c.title ?? '').toLowerCase().includes(q) ||
      (c.section_label ?? '').toLowerCase().includes(q) ||
      (c.course_types?.name ?? '').toLowerCase().includes(q) ||
      (c.instructor
        ? `${c.instructor.first_name} ${c.instructor.last_name}`.toLowerCase().includes(q)
        : false)

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const sorted = [...filtered].sort((a, b) => {
    const cmp = compareCourses(a, b, sortKey)
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search by title, section, type, or instructor…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm transition-colors',
                statusFilter === value
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
            search || statusFilter !== 'all'
              ? 'No courses match your filters.'
              : 'No courses yet.'
          }
        />
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead label="Course" sortKey="title" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortableHead label="Instructor" sortKey="instructor" activeKey={sortKey} dir={sortDir} onClick={toggleSort} className="hidden sm:table-cell" />
                <TableHead className="hidden md:table-cell">Sessions</TableHead>
                <SortableHead label="Enrolled / Cap" sortKey="enrolled" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
                <TableHead className="hidden sm:table-cell">Price</TableHead>
                <SortableHead label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortableHead label="Created" sortKey="created_at" activeKey={sortKey} dir={sortDir} onClick={toggleSort} className="hidden md:table-cell" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((c) => {
                const sessionCount = c.sessions.length
                const confirmed = enrolledCount(c)
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/courses/${c.id}`} className="font-medium hover:underline underline-offset-2">
                            {c.title ?? c.course_types?.name ?? '—'}
                          </Link>
                          {c.section_label && (
                            <Badge variant="neutral" className="font-normal">{c.section_label}</Badge>
                          )}
                        </div>
                        {c.title && (
                          <p className="text-xs text-muted-foreground">{c.course_types?.name}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{formatSchedule(scheduleSessions(c))}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {c.instructor
                        ? `${c.instructor.first_name} ${c.instructor.last_name}`
                        : '—'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{sessionCount}</TableCell>
                    <TableCell>{confirmed} / {c.capacity}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {c.price != null ? `$${c.price}` : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'active' ? 'ok' : 'neutral'}>
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {new Date(c.created_at).toLocaleDateString()}
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

