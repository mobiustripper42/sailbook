'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import MyCourseCard, {
  enrollmentStatusLabel,
  enrollmentStatusVariant,
  fmtSessionDate,
} from '@/components/student/my-course-card'
import type { MyCourseEntry } from '@/lib/student-courses'

type Filter = 'upcoming' | 'past' | 'all'
type ViewMode = 'list' | 'card'

function isUpcoming(lastSessionDate: string | null): boolean {
  if (!lastSessionDate) return true
  return new Date(lastSessionDate + 'T23:59:59') >= new Date()
}

export default function MyCoursesList({ courses }: { courses: MyCourseEntry[] }) {
  const [filter, setFilter] = useState<Filter>('upcoming')
  const [view, setView] = useState<ViewMode>('card')

  const filtered = courses.filter((c) => {
    if (filter === 'all') return true
    if (filter === 'upcoming') return isUpcoming(c.lastSessionDate)
    return !isUpcoming(c.lastSessionDate)
  })

  // Makeups are owed across every course, not just the filtered view — a
  // missed session in a finished course still needs scheduling.
  const totalMissed = courses.reduce((sum, c) => sum + c.missedCount, 0)

  return (
    <div className="space-y-4">
      {totalMissed > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4">
            <p className="text-sm font-medium">
              You have {totalMissed} missed {totalMissed === 1 ? 'session' : 'sessions'} that
              {totalMissed === 1 ? ' needs' : ' need'} a makeup. Contact the school to schedule.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 rounded-lg border p-1 text-sm">
          {(['upcoming', 'past', 'all'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md capitalize transition-colors ${
                filter === f
                  ? 'bg-foreground text-background font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex gap-1 rounded-lg border p-1 text-sm">
          {(['card', 'list'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded-md transition-colors ${
                view === v
                  ? 'bg-foreground text-background font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {v === 'card' ? 'Cards' : 'List'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="py-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            {filter === 'upcoming'
              ? 'No upcoming courses.'
              : filter === 'past'
              ? 'No past courses.'
              : 'You have no enrollments yet.'}
          </p>
          {filter !== 'past' && (
            <Button asChild size="sm">
              <Link href="/student/courses">Browse Available Courses</Link>
            </Button>
          )}
        </div>
      )}

      {view === 'card' && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((c) => (
            <MyCourseCard key={c.enrollmentId} course={c} />
          ))}
        </div>
      )}

      {view === 'list' && filtered.length > 0 && (
        <div className="divide-y rounded-lg border">
          {filtered.map((c) => (
            <div key={c.enrollmentId} className="px-4 py-3 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/student/courses/${c.courseId}`}
                    className="font-medium text-sm hover:underline underline-offset-2 truncate"
                  >
                    {c.title}
                  </Link>
                  <Badge variant={enrollmentStatusVariant(c.enrollmentStatus)} className="text-xs">
                    {enrollmentStatusLabel(c.enrollmentStatus)}
                  </Badge>
                  {c.missedCount > 0 && (
                    <Badge variant="alert" className="text-xs">
                      {c.missedCount} {c.missedCount === 1 ? 'needs' : 'need'} makeup
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {c.typeName}
                  {c.instructorName ? ` · ${c.instructorName}` : ''}
                  {c.sessions.length > 0
                    ? ` · ${c.sessions.length} session${c.sessions.length !== 1 ? 's' : ''}`
                    : ''}
                </p>
              </div>
              <div className="text-xs text-muted-foreground text-right shrink-0">
                {c.lastSessionDate ? fmtSessionDate(c.lastSessionDate) : '—'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
