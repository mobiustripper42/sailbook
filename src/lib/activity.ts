import type { SupabaseClient } from '@supabase/supabase-js'
import { ENTITY_TYPES, EVENT_TYPES, type EventType } from '@/lib/events'

/**
 * Read side of the audit log (#144, DEC-038). RLS restricts SELECT on `events`
 * to admins, so a non-admin caller gets an empty feed rather than an error —
 * the route guard is the friendly message, the policy is the real gate.
 */

export const ACTIVITY_PAGE_SIZE = 50

export type ActivityFilters = {
  types: EventType[]
  entityType: string | null
  from: string | null // YYYY-MM-DD, inclusive
  to: string | null // YYYY-MM-DD, inclusive
}

export const EMPTY_FILTERS: ActivityFilters = {
  types: [],
  entityType: null,
  from: null,
  to: null,
}

export type ActivityCursor = { occurredAt: string; id: string }

export type ActivityRow = {
  id: string
  occurredAt: string
  actorName: string
  actorKind: string
  eventType: string
  eventLabel: string
  entityType: string
  entityId: string | null
  summary: string
  // Resolved from metadata for display — the log itself stores only ids, so
  // renaming a course doesn't rewrite history.
  courseId: string | null
  courseName: string | null
  studentId: string | null
  studentName: string | null
}

type RawEvent = {
  id: string
  occurred_at: string
  actor_id: string | null
  actor_kind: string
  event_type: string
  entity_type: string
  entity_id: string | null
  summary: string
  metadata: Record<string, unknown> | null
  actor: { first_name: string; last_name: string } | null
}

function actorLabel(row: RawEvent): string {
  if (row.actor) return `${row.actor.first_name} ${row.actor.last_name}`
  if (row.actor_kind === 'stripe') return 'Stripe'
  if (row.actor_kind === 'system') return 'System'
  // actor_kind 'user' with no joined profile means the account was deleted —
  // the event outliving the actor is the whole point of the ON DELETE SET NULL.
  return 'Deleted user'
}

function idFromMetadata(metadata: Record<string, unknown> | null, key: string): string | null {
  const value = metadata?.[key]
  return typeof value === 'string' ? value : null
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * The cursor arrives from the client via a server action and is interpolated
 * into a PostgREST `.or()` string, where a comma or paren would change the
 * filter's meaning. RLS still limits the caller to their own visibility, so
 * this isn't a data leak — but an unvalidated cursor turns a bad request into
 * an opaque query error instead of a clean rejection.
 */
export function isValidCursor(cursor: ActivityCursor): boolean {
  return UUID_RE.test(cursor.id) && !Number.isNaN(Date.parse(cursor.occurredAt))
}

export function isEventType(value: string): value is EventType {
  return Object.hasOwn(EVENT_TYPES, value)
}

export function isEntityType(value: string): boolean {
  return Object.hasOwn(ENTITY_TYPES, value)
}

/**
 * One page of the feed, newest first. Keyset pagination on
 * (occurred_at desc, id desc) rather than offset — the log only grows at the
 * head, so an offset would skip or repeat rows as new events land mid-scroll.
 */
export async function fetchActivity(
  supabase: SupabaseClient,
  filters: ActivityFilters,
  cursor?: ActivityCursor,
): Promise<{ rows: ActivityRow[]; hasMore: boolean; error: string | null }> {
  let query = supabase
    .from('events')
    .select(
      `id, occurred_at, actor_id, actor_kind, event_type, entity_type, entity_id, summary, metadata,
       actor:profiles!events_actor_id_fkey ( first_name, last_name )`,
    )
    .order('occurred_at', { ascending: false })
    .order('id', { ascending: false })
    // One extra row tells us whether an older page exists without a count().
    .limit(ACTIVITY_PAGE_SIZE + 1)

  if (filters.types.length > 0) query = query.in('event_type', filters.types)
  if (filters.entityType) query = query.eq('entity_type', filters.entityType)
  if (filters.from) query = query.gte('occurred_at', `${filters.from}T00:00:00`)
  // `to` is inclusive of the whole day, so compare against the next midnight.
  if (filters.to) query = query.lt('occurred_at', `${filters.to}T23:59:59.999`)
  if (cursor) {
    if (!isValidCursor(cursor)) {
      return { rows: [], hasMore: false, error: 'Invalid pagination cursor.' }
    }
    query = query.or(
      `occurred_at.lt.${cursor.occurredAt},and(occurred_at.eq.${cursor.occurredAt},id.lt.${cursor.id})`,
    )
  }

  const { data, error } = await query
  if (error) return { rows: [], hasMore: false, error: error.message }

  const raw = (data ?? []) as unknown as RawEvent[]
  const hasMore = raw.length > ACTIVITY_PAGE_SIZE
  const page = hasMore ? raw.slice(0, ACTIVITY_PAGE_SIZE) : raw

  // Two batched lookups for the whole page — never per row.
  const courseIds = new Set<string>()
  const studentIds = new Set<string>()
  for (const row of page) {
    const courseId =
      idFromMetadata(row.metadata, 'course_id') ??
      (row.entity_type === 'course' ? row.entity_id : null)
    const studentId = idFromMetadata(row.metadata, 'student_id')
    if (courseId) courseIds.add(courseId)
    if (studentId) studentIds.add(studentId)
  }

  const [courses, students] = await Promise.all([
    courseIds.size
      ? supabase
          .from('courses')
          .select('id, title, course_types ( name )')
          .in('id', [...courseIds])
      : Promise.resolve({ data: [], error: null }),
    studentIds.size
      ? supabase.from('profiles').select('id, first_name, last_name').in('id', [...studentIds])
      : Promise.resolve({ data: [], error: null }),
  ])

  const courseNames = new Map<string, string>()
  for (const c of (courses.data ?? []) as unknown as {
    id: string
    title: string | null
    course_types: { name: string } | null
  }[]) {
    courseNames.set(c.id, c.title ?? c.course_types?.name ?? 'Course')
  }

  const studentNames = new Map<string, string>()
  for (const p of (students.data ?? []) as unknown as {
    id: string
    first_name: string
    last_name: string
  }[]) {
    studentNames.set(p.id, `${p.first_name} ${p.last_name}`)
  }

  const rows: ActivityRow[] = page.map((row) => {
    const courseId =
      idFromMetadata(row.metadata, 'course_id') ??
      (row.entity_type === 'course' ? row.entity_id : null)
    const studentId = idFromMetadata(row.metadata, 'student_id')
    return {
      id: row.id,
      occurredAt: row.occurred_at,
      actorName: actorLabel(row),
      actorKind: row.actor_kind,
      eventType: row.event_type,
      // Unknown types can exist — the column is unconstrained by design, and a
      // row written by a newer deploy must still render on an older one.
      eventLabel: isEventType(row.event_type) ? EVENT_TYPES[row.event_type] : row.event_type,
      entityType: row.entity_type,
      entityId: row.entity_id,
      summary: row.summary,
      courseId,
      courseName: courseId ? (courseNames.get(courseId) ?? null) : null,
      studentId,
      studentName: studentId ? (studentNames.get(studentId) ?? null) : null,
    }
  })

  return { rows, hasMore, error: null }
}
