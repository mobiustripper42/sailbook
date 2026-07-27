'use server'

import { createClient } from '@/lib/supabase/server'
import {
  fetchActivity,
  type ActivityCursor,
  type ActivityFilters,
  type ActivityRow,
} from '@/lib/activity'

/**
 * "Load older" for the admin activity feed. RLS already limits SELECT on
 * `events` to admins, so this cannot leak — a non-admin gets an empty page.
 */
export async function loadOlderActivity(
  filters: ActivityFilters,
  cursor: ActivityCursor,
): Promise<{ rows: ActivityRow[]; hasMore: boolean; error: string | null }> {
  const supabase = await createClient()
  return fetchActivity(supabase, filters, cursor)
}
