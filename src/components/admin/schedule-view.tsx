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

// Course-type hue palette (globals.css --t-*). Cycled across the course types
// present, so >5 types still get a stable categorical color.
const HUE_TOKENS = ['--t-asa101', '--t-asa103', '--t-open', '--t-ding', '--t-camp']

// The admin Schedule: sessions in two views of the same data — Month (calendar)
// and List (agenda, the mobile-friendly read). Course-type/instructor/student
// filters narrow BOTH views. Courses (the table) is a separate destination.
export function ScheduleView({ sessions }: { sessions: SessionEvent[] }) {
  const [courseTypeId, setCourseTypeId] = useState(ALL)
  const [instructorName, setInstructorName] = useState(ALL)
  const [studentName, setStudentName] = useState(ALL)

  // Distinct course types present, sorted by name → stable hue assignment.
  const courseTypes = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of sessions) {
      if (s.courseTypeId && s.courseTypeName) map.set(s.courseTypeId, s.courseTypeName)
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [sessions])

  const hueByType = useMemo(() => {
    const out: Record<string, string> = {}
    courseTypes.forEach(([id], i) => {
      out[id] = HUE_TOKENS[i % HUE_TOKENS.length]
    })
    return out
  }, [courseTypes])

  const instructors = useMemo(() => {
    const set = new Set<string>()
    for (const s of sessions) if (s.instructorName) set.add(s.instructorName)
    return [...set].sort()
  }, [sessions])

  const students = useMemo(() => {
    const set = new Set<string>()
    for (const s of sessions) for (const name of s.studentNames ?? []) set.add(name)
    return [...set].sort()
  }, [sessions])

  const filtered = useMemo(
    () =>
      sessions.filter((s) => {
        if (courseTypeId !== ALL && s.courseTypeId !== courseTypeId) return false
        if (instructorName !== ALL && s.instructorName !== instructorName) return false
        if (studentName !== ALL && !s.studentNames?.includes(studentName)) return false
        return true
      }),
    [sessions, courseTypeId, instructorName, studentName],
  )

  const filterSelects = (
    <>
      <Select value={courseTypeId} onValueChange={setCourseTypeId}>
        <SelectTrigger className="w-48" aria-label="Filter by course type" data-testid="filter-course-type">
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
        <SelectTrigger className="w-48" aria-label="Filter by instructor" data-testid="filter-instructor">
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

      <Select value={studentName} onValueChange={setStudentName}>
        <SelectTrigger className="w-48" aria-label="Filter by student" data-testid="filter-student">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All students</SelectItem>
          {students.map((n) => (
            <SelectItem key={n} value={n}>
              {n}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )

  const legend = courseTypes.length > 0 && (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5" data-testid="calendar-legend">
      {courseTypes.map(([id, name]) => (
        <span key={id} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: `var(${hueByType[id]})` }}
            aria-hidden
          />
          {name}
        </span>
      ))}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Filters apply to both Month and List. */}
      <div className="flex flex-wrap gap-3" data-testid="calendar-filters">
        {filterSelects}
      </div>

      <SessionsViewSwitcher
        calendarLabel="Month"
        listLabel="List"
        calendar={
          <div className="space-y-3">
            {legend}
            <SessionsCalendar sessions={filtered} hueByType={hueByType} />
          </div>
        }
        list={<SessionsList sessions={filtered} showInstructor />}
      />
    </div>
  )
}
