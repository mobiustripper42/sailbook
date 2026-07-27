export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ActivityFeed } from '@/components/admin/activity-feed'
import { ActivityFilters as ActivityFilterBar } from '@/components/admin/activity-filters'
import {
  fetchActivity,
  isEntityType,
  isEventType,
  type ActivityFilters,
} from '@/lib/activity'
import type { EventType } from '@/lib/events'

export const metadata = { title: 'SailBook — Activity' }

function asArray(value: string | string[] | undefined): string[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function asDate(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value
  return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null
}

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // RLS already returns nothing to a non-admin, but an empty feed reads as
  // "no activity" rather than "not for you" — guard explicitly, as
  // /admin/notification-preferences does.
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.is_admin) redirect('/login')

  const params = await searchParams
  const entityParam = Array.isArray(params.entity) ? params.entity[0] : params.entity

  const filters: ActivityFilters = {
    types: asArray(params.type).filter(isEventType) as EventType[],
    entityType: entityParam && isEntityType(entityParam) ? entityParam : null,
    from: asDate(params.from),
    to: asDate(params.to),
  }

  const { rows, hasMore, error } = await fetchActivity(supabase, filters)

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Activity</h1>
        <p className="text-sm text-muted-foreground">
          Who did what, and when. Append-only — entries are never edited or removed.
        </p>
      </div>

      <ActivityFilterBar
        types={filters.types}
        entityType={filters.entityType}
        from={filters.from}
        to={filters.to}
      />

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <ActivityFeed
          initialRows={rows}
          initialHasMore={hasMore}
          filters={filters}
          key={JSON.stringify(filters)}
        />
      )}
    </div>
  )
}
