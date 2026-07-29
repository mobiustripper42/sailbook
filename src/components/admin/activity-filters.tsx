'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ENTITY_TYPES, EVENT_TYPES, type EventType } from '@/lib/events'
import { cn } from '@/lib/utils'

/**
 * Filters for the activity feed. State lives in the URL so a filtered view is
 * shareable and survives a reload — and so the server component can do the
 * filtering in SQL rather than shipping the whole log to the client.
 */
export function ActivityFilters({
  types,
  entityType,
  from,
  to,
}: {
  types: EventType[]
  entityType: string | null
  from: string | null
  to: string | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function apply(next: Partial<Record<'type' | 'entity' | 'from' | 'to', string[] | string | null>>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(next)) {
      params.delete(key)
      if (Array.isArray(value)) for (const v of value) params.append(key, v)
      else if (value) params.set(key, value)
    }
    router.replace(params.size ? `/admin/activity?${params}` : '/admin/activity')
  }

  function toggleType(type: EventType) {
    const next = types.includes(type) ? types.filter((t) => t !== type) : [...types, type]
    apply({ type: next })
  }

  const hasFilters = types.length > 0 || entityType || from || to

  return (
    <div className="space-y-4 rounded-md border bg-card p-4" data-testid="activity-filters">
      <div className="space-y-2">
        <Label>Event type</Label>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by event type">
          {(Object.keys(EVENT_TYPES) as EventType[]).map((type) => {
            const active = types.includes(type)
            return (
              <Button
                key={type}
                type="button"
                size="sm"
                variant={active ? 'secondary' : 'outline'}
                aria-pressed={active}
                onClick={() => toggleType(type)}
                data-testid={`activity-type-${type}`}
                className={cn('h-7 px-3', active && 'shadow-sm')}
              >
                {EVENT_TYPES[type]}
              </Button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="activity-entity">Entity</Label>
          <select
            id="activity-entity"
            value={entityType ?? ''}
            onChange={(e) => apply({ entity: e.target.value || null })}
            data-testid="activity-entity"
            className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">All entities</option>
            {Object.entries(ENTITY_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="activity-from">From</Label>
          <Input
            id="activity-from"
            type="date"
            value={from ?? ''}
            onChange={(e) => apply({ from: e.target.value || null })}
            data-testid="activity-from"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="activity-to">To</Label>
          <Input
            id="activity-to"
            type="date"
            value={to ?? ''}
            onChange={(e) => apply({ to: e.target.value || null })}
            data-testid="activity-to"
          />
        </div>
      </div>

      {hasFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.replace('/admin/activity')}
          data-testid="activity-clear"
        >
          Clear filters
        </Button>
      )}
    </div>
  )
}
