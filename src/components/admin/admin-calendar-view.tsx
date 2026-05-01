'use client'

import { useMemo, useState } from 'react'
import type { SessionEvent } from '@/components/shared/sessions-calendar'
import { SessionsCalendar } from '@/components/shared/sessions-calendar'
import { SessionsList } from '@/components/shared/sessions-list'
import { SessionsViewSwitcher } from '@/components/shared/sessions-view-switcher'

const selectCls =
  'rounded-xs border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring'

export function AdminCalendarView({ sessions }: { sessions: SessionEvent[] }) {
  const [courseTypeId, setCourseTypeId] = useState('')
  const [instructorName, setInstructorName] = useState('')

  const courseTypes = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of sessions) {
      if (s.courseTypeId && s.courseTypeName) map.set(s.courseTypeId, s.courseTypeName)
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [sessions])

  const instructors = useMemo(() => {
    const set = new Set<string>()
    for (const s of sessions) {
      if (s.instructorName) set.add(s.instructorName)
    }
    return [...set].sort()
  }, [sessions])

  const filtered = useMemo(
    () =>
      sessions.filter((s) => {
        if (courseTypeId && s.courseTypeId !== courseTypeId) return false
        if (instructorName && s.instructorName !== instructorName) return false
        return true
      }),
    [sessions, courseTypeId, instructorName],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3" data-testid="calendar-filters">
        <select
          value={courseTypeId}
          onChange={(e) => setCourseTypeId(e.target.value)}
          className={selectCls}
          aria-label="Filter by course type"
          data-testid="filter-course-type"
        >
          <option value="">All course types</option>
          {courseTypes.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>

        <select
          value={instructorName}
          onChange={(e) => setInstructorName(e.target.value)}
          className={selectCls}
          aria-label="Filter by instructor"
          data-testid="filter-instructor"
        >
          <option value="">All instructors</option>
          {instructors.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <SessionsViewSwitcher
        calendar={<SessionsCalendar sessions={filtered} />}
        list={<SessionsList sessions={filtered} showInstructor />}
      />
    </div>
  )
}
