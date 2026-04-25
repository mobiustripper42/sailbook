'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CourseCardData } from './courses-card-list'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MAX_PILLS_PER_CELL = 3

type DayCell = {
  date: Date
  iso: string
  inMonth: boolean
  isToday: boolean
  courses: CourseCardData[]
}

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildMonthGrid(viewDate: Date, courses: CourseCardData[]): DayCell[] {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const startWeekday = firstOfMonth.getDay()

  // 6 rows × 7 cols always — keeps row heights uniform across months.
  const gridStart = new Date(year, month, 1 - startWeekday)
  const todayISO = toISODate(new Date())

  const byDate = new Map<string, CourseCardData[]>()
  for (const c of courses) {
    for (const d of c.sessionDates) {
      const list = byDate.get(d) ?? []
      list.push(c)
      byDate.set(d, list)
    }
  }

  const cells: DayCell[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)
    const iso = toISODate(d)
    cells.push({
      date: d,
      iso,
      inMonth: d.getMonth() === month,
      isToday: iso === todayISO,
      courses: byDate.get(iso) ?? [],
    })
  }
  return cells
}

function pillVariantClasses(c: CourseCardData): string {
  if (c.myStatus === 'confirmed' || c.myStatus === 'registered') {
    return 'bg-primary/15 text-primary hover:bg-primary/25 border-primary/30'
  }
  if (c.isFull) {
    return 'bg-muted text-muted-foreground hover:bg-muted/80 border-border'
  }
  return 'bg-accent text-accent-foreground hover:bg-accent/80 border-border'
}

export function CoursesCalendar({ courses }: { courses: CourseCardData[] }) {
  const [viewDate, setViewDate] = useState<Date>(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const cells = useMemo(() => buildMonthGrid(viewDate, courses), [viewDate, courses])

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  function goPrev() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }
  function goNext() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }
  function goToday() {
    const now = new Date()
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1))
  }

  return (
    <div data-testid="courses-calendar" className="rounded-md border bg-card">
      <div className="flex items-center justify-between gap-2 border-b p-3">
        <h2 className="text-base font-semibold" data-testid="calendar-month-label">
          {monthLabel}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goPrev}
            aria-label="Previous month"
            data-testid="calendar-prev"
          >
            ‹
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goNext}
            aria-label="Next month"
            data-testid="calendar-next"
          >
            ›
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b text-xs font-medium text-muted-foreground">
        {WEEKDAYS.map((w) => (
          <div key={w} className="px-2 py-1.5 text-center">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((cell, idx) => {
          const visible = cell.courses.slice(0, MAX_PILLS_PER_CELL)
          const overflow = cell.courses.length - visible.length
          return (
            <div
              key={idx}
              data-testid="calendar-day-cell"
              data-date={cell.iso}
              className={cn(
                'min-h-24 border-b border-r p-1.5 last:border-r-0',
                idx % 7 === 6 && 'border-r-0',
                idx >= 35 && 'border-b-0',
                !cell.inMonth && 'bg-muted/30 text-muted-foreground',
              )}
            >
              <div
                className={cn(
                  'mb-1 text-xs font-medium',
                  cell.isToday && 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground',
                )}
              >
                {cell.date.getDate()}
              </div>
              <div className="space-y-1">
                {visible.map((c) => (
                  <Link
                    key={c.id}
                    href={`/student/courses/${c.id}`}
                    data-testid="calendar-course-pill"
                    data-course-id={c.id}
                    className={cn(
                      'block truncate rounded border px-1.5 py-0.5 text-xs transition-colors',
                      pillVariantClasses(c),
                    )}
                    title={c.title ?? c.typeName ?? 'Course'}
                  >
                    {c.title ?? c.typeName ?? 'Course'}
                  </Link>
                ))}
                {overflow > 0 && (
                  <div className="px-1.5 text-xs text-muted-foreground">+{overflow} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
