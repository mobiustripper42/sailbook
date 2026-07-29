'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'
import { loadOlderActivity } from '@/actions/activity'
import type { ActivityFilters, ActivityRow } from '@/lib/activity'

function fmtStamp(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * The feed itself. Seeded with the first page from the server component, then
 * appends via keyset cursor — see fetchActivity for why not offset.
 */
export function ActivityFeed({
  initialRows,
  initialHasMore,
  filters,
}: {
  initialRows: ActivityRow[]
  initialHasMore: boolean
  filters: ActivityFilters
}) {
  const [rows, setRows] = useState(initialRows)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadOlder() {
    const last = rows[rows.length - 1]
    if (!last) return
    setLoading(true)
    setError(null)
    const result = await loadOlderActivity(filters, { occurredAt: last.occurredAt, id: last.id })
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setRows((current) => [...current, ...result.rows])
    setHasMore(result.hasMore)
  }

  if (rows.length === 0) {
    return <EmptyState message="No activity matches these filters yet." />
  }

  return (
    <div className="space-y-3">
      <ul className="divide-y rounded-md border bg-card" data-testid="activity-feed">
        {rows.map((row) => (
          <li key={row.id} className="p-3 sm:px-4" data-testid="activity-row" data-event-type={row.eventType}>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <Badge variant="neutral">{row.eventLabel}</Badge>
              {/* Most summaries restate the event type — show one, not both.
                  Emitters that say something extra ("Admin enrolled a student
                  directly") still get their line. */}
              {row.summary.toLowerCase() !== row.eventLabel.toLowerCase() && (
                <span className="text-sm font-medium">{row.summary}</span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span data-testid="activity-actor">{row.actorName}</span>
              <span aria-hidden>·</span>
              <time dateTime={row.occurredAt}>{fmtStamp(row.occurredAt)}</time>
              {row.studentName && (
                <>
                  <span aria-hidden>·</span>
                  <Link href={`/admin/students/${row.studentId}`} className="hover:underline">
                    {row.studentName}
                  </Link>
                </>
              )}
              {row.courseName && (
                <>
                  <span aria-hidden>·</span>
                  <Link href={`/admin/courses/${row.courseId}`} className="hover:underline">
                    {row.courseName}
                  </Link>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {hasMore && (
        <Button
          type="button"
          variant="outline"
          onClick={loadOlder}
          disabled={loading}
          data-testid="activity-load-older"
        >
          {loading ? 'Loading…' : 'Load older'}
        </Button>
      )}
    </div>
  )
}
