'use client'

import { useState } from 'react'
import { MonthNavigator } from '@/components/shared/month-navigator'
import type { CourseCardData } from './courses-card-list'
import { CoursesAgendaList } from './courses-agenda-list'
import { CoursesCalendar } from './courses-calendar'
import { CoursesViewSwitcher } from './courses-view-switcher'

function monthStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

// Course browse in two views, laid out like the admin Schedule: view toggle and
// month pager cluster together on the left, above the content. Unlike admin,
// the month drives only the Calendar — List stays today-forward, so a student
// browsing what's on offer never has to page months to find it.
export function CoursesSchedule({ courses }: { courses: CourseCardData[] }) {
  const [viewDate, setViewDate] = useState(() => monthStart(new Date()))
  const label = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <CoursesViewSwitcher
      calendarSlot={
        <MonthNavigator
          label={label}
          onPrev={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          onNext={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          onToday={() => setViewDate(monthStart(new Date()))}
        />
      }
      calendar={<CoursesCalendar courses={courses} viewDate={viewDate} />}
      list={<CoursesAgendaList courses={courses} />}
    />
  )
}
