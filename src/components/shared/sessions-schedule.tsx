'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { SessionsCalendar, type SessionEvent } from './sessions-calendar'
import { SessionsList } from './sessions-list'
import { SessionsViewSwitcher } from './sessions-view-switcher'
import { MonthNavigator } from './month-navigator'

function monthStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

// Month + List as two views of the SAME month. One shared month state + pager
// drives both, so switching views or paging months stays in sync — and the
// List opens on the current month (today-forward), not the earliest session.
export function SessionsSchedule({
  sessions,
  hueByType,
  showInstructor = false,
  calendarExtra,
}: {
  sessions: SessionEvent[]
  hueByType?: Record<string, string>
  showInstructor?: boolean
  calendarExtra?: ReactNode // e.g. the course-type legend (Month view only)
}) {
  const [viewDate, setViewDate] = useState(() => monthStart(new Date()))
  const label = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const monthSessions = useMemo(() => {
    const y = viewDate.getFullYear()
    const m = viewDate.getMonth()
    return sessions.filter((s) => {
      const d = new Date(s.date + 'T12:00:00')
      return d.getFullYear() === y && d.getMonth() === m
    })
  }, [sessions, viewDate])

  const navigator = (
    <MonthNavigator
      label={label}
      onPrev={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
      onNext={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
      onToday={() => setViewDate(monthStart(new Date()))}
    />
  )

  return (
    <SessionsViewSwitcher
      calendarLabel="Month"
      listLabel="List"
      endSlot={navigator}
      calendar={
        <div className="space-y-3">
          {calendarExtra}
          <SessionsCalendar sessions={monthSessions} viewDate={viewDate} hueByType={hueByType} />
        </div>
      }
      list={<SessionsList sessions={monthSessions} showInstructor={showInstructor} />}
    />
  )
}
