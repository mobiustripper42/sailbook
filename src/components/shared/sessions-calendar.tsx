'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type SessionEvent = {
  id: string
  date: string
  startTime: string
  endTime: string
  location: string | null
  label: string
  href: string
  cancelled: boolean
  courseTypeId?: string
  courseTypeName?: string
  instructorName?: string | null
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MAX_PILLS = 3

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type DayCell = {
  date: Date
  iso: string
  inMonth: boolean
  isToday: boolean
  sessions: SessionEvent[]
}

function buildMonthGrid(viewDate: Date, sessions: SessionEvent[]): DayCell[] {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const gridStart = new Date(year, month, 1 - firstOfMonth.getDay())
  const todayISO = toISODate(new Date())

  const byDate = new Map<string, SessionEvent[]>()
  for (const s of sessions) {
    const list = byDate.get(s.date) ?? []
    list.push(s)
    byDate.set(s.date, list)
  }

  const cells: DayCell[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)
    const iso = toISODate(d)
    cells.push({ date: d, iso, inMonth: d.getMonth() === month, isToday: iso === todayISO, sessions: byDate.get(iso) ?? [] })
  }
  return cells
}

export function SessionsCalendar({ sessions }: { sessions: SessionEvent[] }) {
  const [viewDate, setViewDate] = useState<Date>(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const cells = useMemo(() => buildMonthGrid(viewDate, sessions), [viewDate, sessions])
  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div data-testid="sessions-calendar" className="rounded-md border bg-card">
      <div className="flex items-center justify-between gap-2 border-b p-3">
        <h2 className="text-base font-semibold" data-testid="calendar-month-label">
          {monthLabel}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            aria-label="Previous month"
            data-testid="calendar-prev"
          >
            ‹
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const now = new Date()
              setViewDate(new Date(now.getFullYear(), now.getMonth(), 1))
            }}
          >
            Today
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
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
          const visible = cell.sessions.slice(0, MAX_PILLS)
          const overflow = cell.sessions.length - visible.length
          return (
            <div
              key={idx}
              data-testid="calendar-day-cell"
              data-date={cell.iso}
              className={cn(
                'min-h-24 border-b border-r p-1.5',
                idx % 7 === 6 && 'border-r-0',
                idx >= 35 && 'border-b-0',
                !cell.inMonth && 'bg-muted/30 text-muted-foreground',
              )}
            >
              <div
                className={cn(
                  'mb-1 text-xs font-medium',
                  cell.isToday &&
                    'inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground',
                )}
              >
                {cell.date.getDate()}
              </div>
              <div className="space-y-1">
                {visible.map((s) => (
                  <Link
                    key={s.id}
                    href={s.href}
                    data-testid="calendar-session-pill"
                    className={cn(
                      'block truncate rounded border px-1.5 py-0.5 text-xs transition-colors',
                      s.cancelled
                        ? 'bg-muted text-muted-foreground border-border line-through'
                        : 'bg-primary/15 text-primary hover:bg-primary/25 border-primary/30',
                    )}
                    title={s.label}
                  >
                    {s.label}
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
