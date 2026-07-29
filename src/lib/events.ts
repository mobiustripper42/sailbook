import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Audit log emitters (#144, DEC-038).
 *
 * The `events` table has no INSERT policy — every write goes through the
 * `log_event` SECURITY DEFINER RPC, which decides the actor itself. See
 * supabase/migrations/20260727050000_events_audit_log.sql.
 *
 * This module is the vocabulary's source of truth. `event_type` is
 * deliberately unconstrained in the database, so EVENT_TYPES below is what
 * keeps it honest — and it also drives the admin feed's filter list. Adding
 * an emitter means adding a member here, not writing a migration.
 */

// Dotted '<entity>.<verb>'. 10.8 wires the enrollment set; the remaining
// categories from DEC-038 (pay / assign / session / attendance / notify /
// account) get added here as they're instrumented.
export const EVENT_TYPES = {
  'enrollment.created': 'Enrollment created',
  'enrollment.confirmed': 'Enrollment confirmed',
  'enrollment.cancelled': 'Enrollment cancelled',
  'enrollment.restored': 'Enrollment restored',
  'enrollment.cancel_requested': 'Cancellation requested',
  'waitlist.joined': 'Joined waitlist',
  'waitlist.left': 'Left waitlist',
} as const

export type EventType = keyof typeof EVENT_TYPES

// Waitlist events point at the *course*, not the waitlist row: leaving deletes
// that row, so its id is worthless to an admin later, and the course is what
// they'd actually look up.
export const ENTITY_TYPES = {
  enrollment: 'Enrollment',
  course: 'Course',
} as const

export type EntityType = keyof typeof ENTITY_TYPES

export type ActorKind = 'user' | 'system' | 'stripe'

export type EventRow = {
  id: string
  occurred_at: string
  actor_id: string | null
  actor_kind: ActorKind
  event_type: string
  entity_type: string
  entity_id: string | null
  summary: string
  metadata: Record<string, unknown>
}

type LogEventInput = {
  type: EventType
  entityType: EntityType
  // The column is nullable for future app-wide events with no subject, but
  // every emitter so far names one, so the helper requires it.
  entityId: string
  summary: string
  metadata?: Record<string, unknown>
}

/**
 * Emit from a server action holding the user's session. The RPC takes the
 * actor from `auth.uid()` and ignores anything we'd pass — a caller cannot
 * attribute an event to someone else.
 *
 * Best-effort by design: a failed audit write must never fail the user's
 * actual operation. A cancellation that succeeded but logged nothing is a
 * gap in the log; a cancellation rolled back because the log was down is a
 * broken app.
 */
export async function logEvent(
  supabase: SupabaseClient,
  { type, entityType, entityId, summary, metadata }: LogEventInput,
): Promise<void> {
  const { error } = await supabase.rpc('log_event', {
    p_event_type: type,
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_summary: summary,
    p_metadata: metadata ?? {},
  })
  if (error) console.error('[events] log_event failed', type, error.message)
}

// The service-role emit path (webhook / cron, where auth.uid() is NULL and
// the RPC honors an explicit p_actor_kind / p_actor_id) arrives with the
// pay and notify categories in 10.8b. Every emitter wired here holds a user
// session, so `logEvent` above is enough — no dead code carried forward.
