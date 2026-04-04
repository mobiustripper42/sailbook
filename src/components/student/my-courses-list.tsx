'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Session = {
  id: string
  date: string
  start_time: string
  end_time: string
  location: string | null
}

type CourseEntry = {
  enrollmentId: string
  enrollmentStatus: string
  courseId: string
  title: string
  typeName: string
  instructorName: string | null
  price: number | null
  sessions: Session[]
  lastSessionDate: string | null
}

type Filter = 'upcoming' | 'past' | 'all'
type ViewMode = 'list' | 'card'

function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h < 12 ? 'am' : 'pm'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')}${ampm}`
}

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function enrollmentStatusVariant(status: string): 'default' | 'secondary' | 'outline' {
  if (status === 'confirmed') return 'default'
  if (status === 'registered') return 'secondary'
  return 'outline'
}

function isUpcoming(lastSessionDate: string | null): boolean {
  if (!lastSessionDate) return true
  return new Date(lastSessionDate + 'T23:59:59') >= new Date()
}

interface Props {
  courses: CourseEntry[]
}

export default function MyCoursesList({ courses }: Props) {
  const [filter, setFilter] = useState<Filter>('upcoming')
  const [view, setView] = useState<ViewMode>('card')

  const today = new Date().toISOString().slice(0, 10)

  const filtered = courses.filter((c) => {
    if (filter === 'all') return true
    if (filter === 'upcoming') return isUpcoming(c.lastSessionDate)
    return !isUpcoming(c.lastSessionDate)
  })

  return (
    <div className="space-y-4">
      {/* Controls */}
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
          <button
            onClick={() => setView('card')}
            className={`px-3 py-1 rounded-md transition-colors ${
              view === 'card'
                ? 'bg-foreground text-background font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1 rounded-md transition-colors ${
              view === 'list'
                ? 'bg-foreground text-background font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground py-4">
          {filter === 'upcoming'
            ? 'No upcoming courses.'
            : filter === 'past'
            ? 'No past courses.'
            : 'You have no enrollments yet.'}
          {filter !== 'upcoming' ? null : (
            <>
              {' '}
              <Link href="/student/courses" className="underline underline-offset-2 hover:text-foreground">
                Browse available courses.
              </Link>
            </>
          )}
        </p>
      )}

      {/* Card view */}
      {view === 'card' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((c) => (
            <Card key={c.enrollmentId}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">{c.title}</CardTitle>
                  <Badge variant={enrollmentStatusVariant(c.enrollmentStatus)} className="shrink-0 capitalize">
                    {c.enrollmentStatus}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{c.typeName}</p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Instructor</span>
                  <span className="text-foreground">{c.instructorName ?? '—'}</span>
                </div>
                {c.price != null && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Price</span>
                    <span className="text-foreground font-medium">${c.price}</span>
                  </div>
                )}
                {c.sessions.length > 0 && (
                  <div className="border-t pt-3 space-y-1.5">
                    {c.sessions.map((s) => {
                      const isPast = s.date < today
                      return (
                        <div
                          key={s.id}
                          className={`flex justify-between text-xs ${isPast ? 'text-muted-foreground' : ''}`}
                        >
                          <span>{fmtDate(s.date)}</span>
                          <span>
                            {fmtTime(s.start_time)} – {fmtTime(s.end_time)}
                            {s.location ? ` · ${s.location}` : ''}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
                <Button asChild variant="outline" size="sm" className="w-full mt-1">
                  <Link href={`/student/courses/${c.courseId}`}>View Course</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
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
                  <Badge variant={enrollmentStatusVariant(c.enrollmentStatus)} className="capitalize text-xs">
                    {c.enrollmentStatus}
                  </Badge>
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
                {c.lastSessionDate ? fmtDate(c.lastSessionDate) : '—'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
