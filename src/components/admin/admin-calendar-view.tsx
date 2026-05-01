'use client'

import { useMemo, useState } from 'react'
import type { SessionEvent } from '@/components/shared/sessions-calendar'
import { SessionsCalendar } from '@/components/shared/sessions-calendar'
import { SessionsList } from '@/components/shared/sessions-list'
import { SessionsViewSwitcher } from '@/components/shared/sessions-view-switcher'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ALL = '__all__'

export function AdminCalendarView({ sessions }: { sessions: SessionEvent[] }) {
  const [courseTypeId, setCourseTypeId] = useState(ALL)
  const [instructorName, setInstructorName] = useState(ALL)

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
        if (courseTypeId !== ALL && s.courseTypeId !== courseTypeId) return false
        if (instructorName !== ALL && s.instructorName !== instructorName) return false
        return true
      }),
    [sessions, courseTypeId, instructorName],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3" data-testid="calendar-filters">
        <Select value={courseTypeId} onValueChange={setCourseTypeId}>
          <SelectTrigger
            className="w-48"
            aria-label="Filter by course type"
            data-testid="filter-course-type"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All course types</SelectItem>
            {courseTypes.map(([id, name]) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={instructorName} onValueChange={setInstructorName}>
          <SelectTrigger
            className="w-48"
            aria-label="Filter by instructor"
            data-testid="filter-instructor"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All instructors</SelectItem>
            {instructors.map((n) => (
              <SelectItem key={n} value={n}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <SessionsViewSwitcher
        calendar={<SessionsCalendar sessions={filtered} />}
        list={<SessionsList sessions={filtered} showInstructor />}
      />
    </div>
  )
}
