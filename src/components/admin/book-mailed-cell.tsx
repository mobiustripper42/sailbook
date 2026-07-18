'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setBookMailed } from '@/actions/enrollments'

// Local YYYY-MM-DD (not UTC) so "today" matches the admin's calendar.
function todayISO(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

// Parse a `date` column value as local (avoid the UTC-midnight day shift).
function formatMailed(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/**
 * Admin control to record when an ASA course textbook was mailed (#153).
 * "Mark mailed" stamps today; once set, the date is editable (backdate) or
 * clearable. Rendered only for ASA courses by the roster.
 */
export default function BookMailedCell({
  enrollmentId,
  courseId,
  initial,
}: {
  enrollmentId: string
  courseId: string
  initial: string | null
}) {
  const [date, setDate] = useState<string | null>(initial)
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function save(next: string | null) {
    setError(null)
    startTransition(async () => {
      const result = await setBookMailed(enrollmentId, courseId, next)
      if (result.error) {
        setError(result.error)
      } else {
        setDate(next)
        setEditing(false)
      }
    })
  }

  if (!date) {
    return (
      <div className="flex flex-col gap-1">
        <Button variant="outline" size="sm" disabled={pending} onClick={() => save(todayISO())}>
          {pending ? 'Saving…' : 'Mark mailed'}
        </Button>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {editing ? (
        <Input
          type="date"
          defaultValue={date}
          disabled={pending}
          className="h-8 w-36"
          aria-label="Book mailed date"
          onChange={(e) => e.target.value && save(e.target.value)}
        />
      ) : (
        <div className="flex items-center gap-2 text-sm">
          <span>Mailed {formatMailed(date)}</span>
          <button
            type="button"
            className="text-xs text-muted-foreground underline hover:text-foreground"
            onClick={() => setEditing(true)}
            disabled={pending}
          >
            edit
          </button>
          <button
            type="button"
            className="text-xs text-muted-foreground underline hover:text-foreground"
            onClick={() => save(null)}
            disabled={pending}
          >
            clear
          </button>
        </div>
      )}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}
