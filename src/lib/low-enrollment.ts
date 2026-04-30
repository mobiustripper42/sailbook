// Phase 5.8 — single source of truth for "is this course low-enrollment?"
// Both the daily admin cron alert (notifications/triggers.ts) and the admin
// dashboard tile read from here. Per-course thresholds live on course_types
// (minimum_enrollment, low_enrollment_lead_days). minimum_enrollment IS NULL
// is the opt-out — that course type never flags.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Client = SupabaseClient<Database>

export type LowEnrollmentCourse = {
  id: string
  title: string | null
  capacity: number
  course_type_id: string
  minimum_enrollment: number
  low_enrollment_lead_days: number
  enrolled: number
  firstSessionDate: string
  daysUntilStart: number
}

export async function findLowEnrollmentCourses(
  client: Client,
  now: Date = new Date(),
): Promise<LowEnrollmentCourse[]> {
  const todayISO = now.toISOString().slice(0, 10)

  const { data: courses, error } = await client
    .from('courses')
    .select(`
      id, title, capacity, course_type_id,
      course_types!inner ( minimum_enrollment, low_enrollment_lead_days )
    `)
    .eq('status', 'active')

  if (error) {
    console.error('[low-enrollment] course lookup failed:', error.message)
    return []
  }
  if (!courses || courses.length === 0) return []

  const results: LowEnrollmentCourse[] = []

  for (const c of courses) {
    const ct = c.course_types as unknown as {
      minimum_enrollment: number | null
      low_enrollment_lead_days: number
    } | null
    if (!ct || ct.minimum_enrollment == null) continue

    const horizon = new Date(now.getTime() + ct.low_enrollment_lead_days * 24 * 60 * 60 * 1000)
    const horizonISO = horizon.toISOString().slice(0, 10)

    const { data: firstSession } = await client
      .from('sessions')
      .select('date')
      .eq('course_id', c.id)
      .gte('date', todayISO)
      .lte('date', horizonISO)
      .order('date', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (!firstSession) continue

    const { count } = await client
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', c.id)
      .eq('status', 'confirmed')

    const enrolled = count ?? 0
    if (enrolled >= ct.minimum_enrollment) continue

    const start = new Date(firstSession.date)
    const daysUntilStart = Math.max(
      0,
      Math.round((start.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
    )

    results.push({
      id: c.id,
      title: c.title,
      capacity: c.capacity,
      course_type_id: c.course_type_id,
      minimum_enrollment: ct.minimum_enrollment,
      low_enrollment_lead_days: ct.low_enrollment_lead_days,
      enrolled,
      firstSessionDate: firstSession.date,
      daysUntilStart,
    })
  }

  return results
}
