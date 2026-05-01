import Link from 'next/link'
import { fmtDate, fmtTime } from '@/lib/utils'
import type { SessionEvent } from './sessions-calendar'

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

  return (
    <div className="divide-y rounded-lg border" data-testid="sessions-list">
      {sessions.map((s) => (
        <Link
          key={s.id}
          href={s.href}
          className="flex items-start justify-between gap-4 px-4 py-3 hover:bg-muted/40 transition-colors"
        >
          <div className="space-y-0.5 min-w-0">
            <p className="text-sm font-medium truncate">{s.label}</p>
            <p className="text-xs text-muted-foreground">
              {fmtDate(s.date)} · {fmtTime(s.startTime)} – {fmtTime(s.endTime)}
              {s.location ? ` · ${s.location}` : ''}
              {showInstructor && s.instructorName ? ` · ${s.instructorName}` : ''}
            </p>
          </div>
          {s.cancelled && (
            <span className="shrink-0 rounded border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              Cancelled
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}
