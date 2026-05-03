import Link from 'next/link'
import { cn, fmtTime } from '@/lib/utils'
import type { SessionEvent } from './sessions-calendar'

function fmtDayHeader(date: string): string {
  return new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function SessionsList({
  sessions,
  showInstructor = false,
}: {
  sessions: SessionEvent[]
  showInstructor?: boolean
}) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground">
        No sessions to show.
      </div>
    )
  }

  const today = new Date().toISOString().slice(0, 10)

  // Group by date
  const byDate = new Map<string, SessionEvent[]>()
  for (const s of sessions) {
    const group = byDate.get(s.date) ?? []
    group.push(s)
    byDate.set(s.date, group)
  }

  return (
    <div className="space-y-5" data-testid="sessions-list">
      {Array.from(byDate.entries()).map(([date, daySessions]) => {
        const isPast = date < today
        return (
          <div key={date}>
            <div
              className="sticky top-0 z-10 bg-background py-1.5 text-sm font-bold text-primary uppercase tracking-wide border-b mb-1"
              data-testid="sessions-day-header"
            >
              {fmtDayHeader(date)}
            </div>
            <div className="divide-y">
              {daySessions.map((s) => (
                <Link
                  key={s.id}
                  href={s.href}
                  className="flex items-start justify-between gap-3 py-2.5 hover:bg-muted/40 transition-colors -mx-1 px-1"
                  data-testid="sessions-list-row"
                >
                  <div className="min-w-0">
                    <p className={cn('text-sm font-medium truncate', isPast && 'text-muted-foreground')}>
                      {s.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {fmtTime(s.startTime)} – {fmtTime(s.endTime)}
                      {s.location ? ` · ${s.location}` : ''}
                      {showInstructor && s.instructorName ? ` · ${s.instructorName}` : ''}
                    </p>
                  </div>
                  {s.cancelled && (
                    <span className="shrink-0 rounded-xs border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Cancelled
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
