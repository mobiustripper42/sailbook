import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/empty-state'
import { fmtTime } from '@/lib/utils'
import type { CourseCardData } from './courses-card-list'

type AgendaSession = {
  sessionId: string
  date: string
  start_time: string
  end_time: string
  location: string | null
  courseId: string
  shortCode: string | null
  title: string
  spotsRemaining: number
  isFull: boolean
  myStatus: string | null
  myHoldExpiresAt: string | null
}

function isEffectivelyEnrolled(status: string | null, holdExpiresAt: string | null): boolean {
  if (status === null) return false
  if (status === 'pending_payment') {
    if (!holdExpiresAt) return false
    return new Date(holdExpiresAt) > new Date()
  }
  return true
}

function enrollmentStatusLabel(status: string): string {
  if (status === 'confirmed') return 'Enrolled'
  if (status === 'registered') return 'Pending confirmation'
  if (status === 'cancel_requested') return 'Cancellation Requested'
  if (status === 'pending_payment') return 'Payment Pending'
  return status
}

function enrollmentStatusVariant(status: string): 'ok' | 'warn' | 'neutral' {
  if (status === 'confirmed') return 'ok'
  if (status === 'cancel_requested' || status === 'pending_payment') return 'warn'
  return 'neutral'
}

function fmtDayHeader(date: string): string {
  return new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function CoursesAgendaList({ courses }: { courses: CourseCardData[] }) {
  const today = new Date().toISOString().slice(0, 10)

  // Flatten all future sessions across all courses, one row per session
  const allSessions: AgendaSession[] = []
  for (const course of courses) {
    for (const session of course.sessions) {
      if (session.date < today) continue
      allSessions.push({
        sessionId: session.id,
        date: session.date,
        start_time: session.start_time,
        end_time: session.end_time,
        location: session.location,
        courseId: course.id,
        shortCode: course.typeShortCode,
        title: course.title ?? course.typeName ?? '—',
        spotsRemaining: course.spotsRemaining,
        isFull: course.isFull,
        myStatus: course.myStatus,
        myHoldExpiresAt: course.myHoldExpiresAt,
      })
    }
  }

  allSessions.sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date)
    return dateCmp !== 0 ? dateCmp : a.start_time.localeCompare(b.start_time)
  })

  if (allSessions.length === 0) {
    return <EmptyState message="No upcoming sessions scheduled." />
  }

  // Group by date
  const byDate = new Map<string, AgendaSession[]>()
  for (const s of allSessions) {
    const group = byDate.get(s.date) ?? []
    group.push(s)
    byDate.set(s.date, group)
  }

  return (
    <div className="space-y-5" data-testid="courses-agenda">
      {Array.from(byDate.entries()).map(([date, sessions]) => (
        <div key={date}>
          <div
            className="sticky top-0 z-10 bg-background py-1.5 text-sm font-bold text-primary uppercase tracking-wide border-b mb-1"
            data-testid="agenda-day-header"
          >
            {fmtDayHeader(date)}
          </div>
          <div className="divide-y">
            {sessions.map((s) => {
              const isEnrolled = isEffectivelyEnrolled(s.myStatus, s.myHoldExpiresAt)
              return (
                <Link
                  key={s.sessionId}
                  href={`/student/courses/${s.courseId}`}
                  className="flex items-start justify-between gap-3 py-2.5 hover:bg-muted/40 transition-colors -mx-1 px-1"
                  data-testid="agenda-session-row"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {s.shortCode && (
                        <span className="font-mono text-xs font-semibold text-foreground bg-muted px-1.5 py-0.5 rounded-xs">
                          {s.shortCode}
                        </span>
                      )}
                      <span className="text-sm text-foreground truncate">{s.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {fmtTime(s.start_time)} – {fmtTime(s.end_time)}
                      {s.location ? ` · ${s.location}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    {isEnrolled ? (
                      <Badge variant={enrollmentStatusVariant(s.myStatus!)} className="text-xs">
                        {enrollmentStatusLabel(s.myStatus!)}
                      </Badge>
                    ) : s.isFull ? (
                      <span className="text-xs text-muted-foreground">Full</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {s.spotsRemaining} left
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
