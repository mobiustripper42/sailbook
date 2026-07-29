'use server'

import { createClient } from '@/lib/supabase/server'
import {
  fetchActivity,
  isEntityType,
  isEventType,
  type ActivityCursor,
  type ActivityFilters,
  type ActivityRow,
} from '@/lib/activity'
import type { EventType } from '@/lib/events'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Both arguments cross the network from the client, so neither is trusted:
 * every value here ends up in a PostgREST filter string. Re-validate against
 * the same allow-lists the page applies to its searchParams rather than
 * assuming the caller is our own component.
 */
function sanitize(filters: ActivityFilters): ActivityFilters {
  return {
    types: (Array.isArray(filters?.types) ? filters.types : []).filter(isEventType) as EventType[],
    entityType:
      typeof filters?.entityType === 'string' && isEntityType(filters.entityType)
        ? filters.entityType
        : null,
    from: typeof filters?.from === 'string' && ISO_DATE.test(filters.from) ? filters.from : null,
    to: typeof filters?.to === 'string' && ISO_DATE.test(filters.to) ? filters.to : null,
  }
}

/**
 * "Load older" for the admin activity feed. RLS already limits SELECT on
 * `events` to admins, so this cannot leak — a non-admin gets an empty page.
 */
export async function loadOlderActivity(
  filters: ActivityFilters,
  cursor: ActivityCursor,
): Promise<{ rows: ActivityRow[]; hasMore: boolean; error: string | null }> {
  const supabase = await createClient()
  return fetchActivity(supabase, sanitize(filters), cursor)
}
