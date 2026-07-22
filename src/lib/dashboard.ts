// Phase 10.5 — admin dashboard triage board data layer.
// One module gathers every aggregate the redesigned dashboard renders:
// a "Needs you" triage summary, today's + the rest of the week's sessions,
// a "Filling now" fill board, and a "Just enrolled" activity feed.
// Reuses findLowEnrollmentCourses (5.8) for the at-risk signal — no reinvention.
// Payments panel is deferred (#180) and intentionally absent here.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { findLowEnrollmentCourses } from '@/lib/low-enrollment'

type Client = SupabaseClient<Database>

const DAY_MS = 24 * 60 * 60 * 1000
const FILLING_HORIZON_DAYS = 14

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// Mirror low-enrollment.ts: a query error must be logged, not silently read as
// "no data" — otherwise a transient failure renders a misleadingly-empty board.
function logIfError(label: string, error: { message: string } | null): void {
  if (error) console.error(`[dashboard] ${label} failed:`, error.message)
}

function confirmedCount(enrollments: { status: string }[]): number {
  return enrollments.filter((e) => e.status === 'confirmed').length
}

// ─── Needs you ───────────────────────────────────────────────────────────────

export type NeedsYouItem = {
  key: 'unassigned' | 'low_enrollment' | 'pending_confirmation' | 'cancellation' | 'makeups'
  tone: 'warn' | 'info' | 'bad'
  count: number
  title: string
  detail: string
  href: string
  cta: string
}

async function getNeedsYou(client: Client, now: Date): Promise<NeedsYouItem[]> {
  const todayISO = isoDate(now)

  const [unassigned, lowEnrollment, pending, cancellations, missed] = await Promise.all([
    client
      .from('courses')
      .select('id, title, course_types ( name ), sessions ( date )')
      .eq('status', 'active')
      .is('instructor_id', null),
    findLowEnrollmentCourses(client, now),
    client
      .from('enrollments')
      .select('id, enrolled_at', { count: 'exact' })
      .eq('status', 'registered')
      .order('enrolled_at', { ascending: true }),
    client
      .from('enrollments')
      .select(
        'id, student:profiles!enrollments_student_id_fkey ( first_name, last_name ), course:courses ( title, course_types ( name ) )',
        { count: 'exact' },
      )
      .eq('status', 'cancel_requested')
      .order('enrolled_at', { ascending: false }),
    client
      .from('session_attendance')
      .select('enrollment:enrollments!session_attendance_enrollment_id_fkey ( student_id )')
      .eq('status', 'missed')
      .is('makeup_session_id', null),
  ])

  logIfError('unassigned courses', unassigned.error)
  logIfError('pending confirmations', pending.error)
  logIfError('cancellation requests', cancellations.error)
  logIfError('missed sessions', missed.error)

  const items: NeedsYouItem[] = []

  // Unassigned courses — subtitle lists the first couple by name + next date.
  const unassignedRows = unassigned.data ?? []
  if (unassignedRows.length > 0) {
    const preview = unassignedRows.slice(0, 2).map((c) => {
      const type = c.course_types as unknown as { name: string } | null
      const name = c.title ?? type?.name ?? 'Course'
      const dates = (c.sessions as unknown as { date: string | null }[])
        .map((s) => s.date)
        .filter((d): d is string => !!d && d >= todayISO)
        .sort()
      const next = dates[0]
      return next
        ? `${name} · ${new Date(next + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        : name
    })
    items.push({
      key: 'unassigned',
      tone: 'warn',
      count: unassignedRows.length,
      title: unassignedRows.length === 1 ? 'Course unassigned' : 'Courses unassigned',
      detail: preview.join('  ·  '),
      href: '/admin/courses',
      cta: 'Assign instructor',
    })
  }

  // Low enrollment — reuse 5.8; surface the most urgent (soonest start).
  if (lowEnrollment.length > 0) {
    const soonest = [...lowEnrollment].sort((a, b) => a.daysUntilStart - b.daysUntilStart)[0]
    const startsIn =
      soonest.daysUntilStart === 0
        ? 'starts today'
        : soonest.daysUntilStart === 1
          ? 'starts tomorrow'
          : `starts in ${soonest.daysUntilStart} days`
    items.push({
      key: 'low_enrollment',
      tone: 'warn',
      count: lowEnrollment.length,
      title: 'Low enrollment',
      detail: `${soonest.title ?? 'A course'} — ${soonest.enrolled}/${soonest.capacity} filled, ${startsIn}`,
      href: '/admin/courses',
      cta: 'Review',
    })
  }

  // Pending confirmation — see #181: nothing confirms these today, so this is
  // really "unconfirmed" until the lifecycle is resolved.
  const pendingCount = pending.count ?? 0
  if (pendingCount > 0) {
    const oldest = pending.data?.[0]?.enrolled_at
    const waitedDays = oldest ? Math.floor((now.getTime() - new Date(oldest).getTime()) / DAY_MS) : 0
    items.push({
      key: 'pending_confirmation',
      tone: 'info',
      count: pendingCount,
      title: 'Pending confirmation',
      detail: waitedDays > 0 ? `Oldest waiting ${waitedDays} ${waitedDays === 1 ? 'day' : 'days'}` : 'Awaiting review',
      href: '/admin/courses',
      cta: 'Confirm',
    })
  }

  // Cancellation requests.
  const cancelCount = cancellations.count ?? 0
  if (cancelCount > 0) {
    const first = cancellations.data?.[0]
    const student = first?.student as unknown as { first_name: string; last_name: string } | null
    const course = first?.course as unknown as { title: string | null; course_types: { name: string } | null } | null
    const detail = student
      ? `${student.first_name} ${student.last_name} · ${course?.title ?? course?.course_types?.name ?? 'a course'}`
      : 'Awaiting your review'
    items.push({
      key: 'cancellation',
      tone: 'bad',
      count: cancelCount,
      title: cancelCount === 1 ? 'Cancellation request' : 'Cancellation requests',
      detail,
      href: '/admin/courses',
      cta: 'Handle',
    })
  }

  // Students needing makeups — distinct students with an unresolved missed session.
  const missedStudents = new Set(
    (missed.data ?? [])
      .map((r) => (r.enrollment as unknown as { student_id: string } | null)?.student_id)
      .filter((id): id is string => !!id),
  )
  if (missedStudents.size > 0) {
    items.push({
      key: 'makeups',
      tone: 'warn',
      count: missedStudents.size,
      title: 'Students need makeups',
      detail: 'Unresolved missed sessions',
      href: '/admin/missed-sessions',
      cta: 'Schedule',
    })
  }

  return items
}

// ─── Sessions (today + rest of week) ─────────────────────────────────────────

export type DashSession = {
  id: string
  date: string
  startTime: string
  endTime: string
  courseId: string | null
  courseName: string
  shortCode: string | null
  instructorName: string | null
  enrolled: number
  capacity: number
}

type RawSession = {
  id: string
  date: string
  start_time: string
  end_time: string
  instructor: { first_name: string; last_name: string } | null
  course: {
    id: string
    title: string | null
    capacity: number
    course_instructor: { first_name: string; last_name: string } | null
    course_type: { name: string; short_code: string } | null
    enrollments: { id: string; status: string }[]
  } | null
}

function shapeSession(s: RawSession): DashSession {
  const course = s.course
  const sessionInstructor = s.instructor
  const instructor = sessionInstructor ?? course?.course_instructor ?? null
  return {
    id: s.id,
    date: s.date,
    startTime: s.start_time,
    endTime: s.end_time,
    courseId: course?.id ?? null,
    courseName: course?.title ?? course?.course_type?.name ?? '—',
    shortCode: course?.course_type?.short_code ?? null,
    instructorName: instructor ? `${instructor.first_name} ${instructor.last_name}` : null,
    enrolled: confirmedCount(course?.enrollments ?? []),
    capacity: course?.capacity ?? 0,
  }
}

async function getWeekSessions(
  client: Client,
  now: Date,
): Promise<{ today: DashSession[]; restOfWeek: DashSession[] }> {
  const todayISO = isoDate(now)
  const horizonISO = isoDate(new Date(now.getTime() + 7 * DAY_MS))

  const { data, error } = await client
    .from('sessions')
    .select(`
      id, date, start_time, end_time,
      instructor:instructor_id ( first_name, last_name ),
      course:courses (
        id, title, capacity,
        course_instructor:profiles!courses_instructor_id_fkey ( first_name, last_name ),
        course_type:course_types ( name, short_code ),
        enrollments ( id, status )
      )
    `)
    .gte('date', todayISO)
    .lte('date', horizonISO)
    .eq('status', 'scheduled')
    .order('date')
    .order('start_time')

  logIfError('week sessions', error)
  const all = ((data ?? []) as unknown as RawSession[]).map(shapeSession)
  return {
    today: all.filter((s) => s.date === todayISO),
    restOfWeek: all.filter((s) => s.date > todayISO),
  }
}

// ─── Filling now ─────────────────────────────────────────────────────────────

export type FillingCourse = {
  id: string
  name: string
  shortCode: string | null
  enrolled: number
  capacity: number
  waitlist: number
  firstSessionDate: string
  daysUntilStart: number
  risk: 'below_min' | 'open' | 'nearly_full' | 'full'
}

async function getFillingNow(client: Client, now: Date): Promise<FillingCourse[]> {
  const todayISO = isoDate(now)
  const horizonISO = isoDate(new Date(now.getTime() + FILLING_HORIZON_DAYS * DAY_MS))

  const { data, error } = await client
    .from('courses')
    .select(`
      id, title, capacity,
      course_types ( name, short_code, minimum_enrollment ),
      sessions ( date ),
      enrollments ( id, status ),
      waitlist_entries ( id )
    `)
    .eq('status', 'active')

  logIfError('filling now', error)
  const rows = (data ?? []) as unknown as {
    id: string
    title: string | null
    capacity: number
    course_types: { name: string; short_code: string; minimum_enrollment: number | null } | null
    sessions: { date: string | null }[]
    enrollments: { id: string; status: string }[]
    waitlist_entries: { id: string }[]
  }[]

  const out: FillingCourse[] = []
  for (const c of rows) {
    const upcoming = c.sessions
      .map((s) => s.date)
      .filter((d): d is string => !!d && d >= todayISO && d <= horizonISO)
      .sort()
    const first = upcoming[0]
    if (!first) continue // only courses actually starting within the window

    const enrolled = confirmedCount(c.enrollments)
    const capacity = c.capacity
    const min = c.course_types?.minimum_enrollment ?? null
    const waitlist = c.waitlist_entries.length
    const daysUntilStart = Math.max(0, Math.round((new Date(first + 'T00:00:00').getTime() - now.getTime()) / DAY_MS))

    let risk: FillingCourse['risk']
    if (capacity > 0 && enrolled >= capacity) risk = 'full'
    else if (min != null && enrolled < min) risk = 'below_min'
    else if (capacity > 0 && enrolled / capacity >= 0.85) risk = 'nearly_full'
    else risk = 'open'

    out.push({
      id: c.id,
      name: c.title ?? c.course_types?.name ?? '—',
      shortCode: c.course_types?.short_code ?? null,
      enrolled,
      capacity,
      waitlist,
      firstSessionDate: first,
      daysUntilStart,
      risk,
    })
  }

  // At-risk first, then soonest to start.
  const riskRank: Record<FillingCourse['risk'], number> = { below_min: 0, nearly_full: 1, full: 2, open: 3 }
  return out.sort((a, b) => riskRank[a.risk] - riskRank[b.risk] || a.daysUntilStart - b.daysUntilStart)
}

// ─── Just enrolled ───────────────────────────────────────────────────────────

export type JustEnrolledItem = {
  id: string
  studentName: string
  initials: string
  courseName: string
  when: string
  chip: 'paid' | 'pending' | 'waitlist'
}

function initialsOf(first: string, last: string): string {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

async function getJustEnrolled(client: Client, limit = 6): Promise<JustEnrolledItem[]> {
  const [enrollments, waitlist] = await Promise.all([
    client
      .from('enrollments')
      .select(`
        id, enrolled_at, status,
        student:profiles!enrollments_student_id_fkey ( first_name, last_name ),
        course:courses ( title, course_types ( name ) ),
        payments ( status )
      `)
      .in('status', ['registered', 'confirmed'])
      .order('enrolled_at', { ascending: false })
      .limit(limit),
    client
      .from('waitlist_entries')
      .select(`
        id, created_at,
        student:profiles!waitlist_entries_student_id_fkey ( first_name, last_name ),
        course:courses ( title, course_types ( name ) )
      `)
      .order('created_at', { ascending: false })
      .limit(limit),
  ])

  logIfError('just enrolled — enrollments', enrollments.error)
  logIfError('just enrolled — waitlist', waitlist.error)

  const fromEnrollments: (JustEnrolledItem & { ts: number })[] = (enrollments.data ?? []).map((e) => {
    const student = e.student as unknown as { first_name: string; last_name: string } | null
    const course = e.course as unknown as { title: string | null; course_types: { name: string } | null } | null
    const payments = (e.payments as unknown as { status: string }[]) ?? []
    const paid = payments.some((p) => p.status === 'succeeded')
    const when = e.enrolled_at ?? ''
    return {
      id: `e_${e.id}`,
      studentName: student ? `${student.first_name} ${student.last_name}` : '—',
      initials: student ? initialsOf(student.first_name, student.last_name) : '—',
      courseName: course?.title ?? course?.course_types?.name ?? '—',
      when,
      chip: paid ? 'paid' : 'pending',
      ts: when ? new Date(when).getTime() : 0,
    }
  })

  const fromWaitlist: (JustEnrolledItem & { ts: number })[] = (waitlist.data ?? []).map((w) => {
    const student = w.student as unknown as { first_name: string; last_name: string } | null
    const course = w.course as unknown as { title: string | null; course_types: { name: string } | null } | null
    return {
      id: `w_${w.id}`,
      studentName: student ? `${student.first_name} ${student.last_name}` : '—',
      initials: student ? initialsOf(student.first_name, student.last_name) : '—',
      courseName: course?.title ?? course?.course_types?.name ?? '—',
      when: w.created_at,
      chip: 'waitlist',
      ts: new Date(w.created_at).getTime(),
    }
  })

  return [...fromEnrollments, ...fromWaitlist]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, limit)
    .map((m): JustEnrolledItem => ({
      id: m.id,
      studentName: m.studentName,
      initials: m.initials,
      courseName: m.courseName,
      when: m.when,
      chip: m.chip,
    }))
}

// ─── Aggregate ───────────────────────────────────────────────────────────────

export type DashboardData = {
  needsYou: NeedsYouItem[]
  today: DashSession[]
  restOfWeek: DashSession[]
  fillingNow: FillingCourse[]
  justEnrolled: JustEnrolledItem[]
  activeCourses: number
}

export async function getDashboardData(client: Client, now: Date = new Date()): Promise<DashboardData> {
  const [needsYou, week, fillingNow, justEnrolled, activeCourses] = await Promise.all([
    getNeedsYou(client, now),
    getWeekSessions(client, now),
    getFillingNow(client, now),
    getJustEnrolled(client),
    client.from('courses').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  logIfError('active courses count', activeCourses.error)

  return {
    needsYou,
    today: week.today,
    restOfWeek: week.restOfWeek,
    fillingNow,
    justEnrolled,
    activeCourses: activeCourses.count ?? 0,
  }
}
