// High-level notification triggers. Each function fetches everything it needs,
// renders a template, and dispatches per-recipient. Channel failures are
// isolated: one bad SMS can't take out the email; one admin's bad number
// can't block the next admin's send. Errors are logged, never thrown — so
// a webhook handler never 500s because Twilio is down.
//
// Caller-side idempotency: callers must guard against double-firing
// (e.g., the Stripe webhook checks `enrollment.status === 'confirmed'`
// before calling). No notified_at column.

import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, sendSMS } from './index'
import {
  adminEnrollmentAlert,
  enrollmentConfirmation,
  lowEnrollmentWarning,
  makeupAssignment,
  sessionCancellation,
  sessionReminder,
} from './templates'

// 5.8 will refine this. Tuned conservatively for V1 — better to skip a real
// alert than to spam Andy daily.
const LOW_ENROLLMENT_DAYS_OUT = 14
const LOW_ENROLLMENT_RATIO = 0.5

type AdminClient = ReturnType<typeof createAdminClient>

async function tryEmail(to: string | null | undefined, subject: string, text: string, html: string) {
  if (!to) return
  try {
    const result = await sendEmail({ to, subject, text, html })
    if (!result.ok) console.error('[notifications] email failed:', result.error)
  } catch (err) {
    console.error('[notifications] email threw:', err)
  }
}

async function trySMS(to: string | null | undefined, body: string) {
  if (!to) return
  try {
    const result = await sendSMS({ to, body })
    if (!result.ok) console.error('[notifications] sms failed:', result.error)
  } catch (err) {
    console.error('[notifications] sms threw:', err)
  }
}

/**
 * Fired when an enrollment transitions to 'confirmed' (Stripe webhook OR
 * admin manual enrollment). Sends:
 *   - student SMS + email confirmation
 *   - admin SMS + email alert (one fan-out per admin)
 *
 * Returns nothing. Errors are logged and swallowed — the caller's primary
 * write (the enrollment confirmation itself) must not be blocked by a
 * notification failure.
 */
export async function notifyEnrollmentConfirmed(enrollmentId: string): Promise<void> {
  const admin = createAdminClient()

  const { data: enrollment, error: enrollErr } = await admin
    .from('enrollments')
    .select('id, course_id, student_id')
    .eq('id', enrollmentId)
    .maybeSingle()

  if (enrollErr || !enrollment) {
    console.error('[notifications] enrollment lookup failed:', enrollErr?.message ?? 'not found')
    return
  }

  const [studentResult, courseResult, sessionResult, paymentResult, adminsResult] = await Promise.all([
    admin
      .from('profiles')
      .select('first_name, last_name, email, phone')
      .eq('id', enrollment.student_id)
      .maybeSingle(),
    admin
      .from('courses')
      .select('title, course_type_id')
      .eq('id', enrollment.course_id)
      .maybeSingle(),
    admin
      .from('sessions')
      .select('date, start_time, location')
      .eq('course_id', enrollment.course_id)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(1)
      .maybeSingle(),
    admin
      .from('payments')
      .select('amount_cents, payment_method')
      .eq('enrollment_id', enrollmentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('profiles')
      .select('first_name, last_name, email, phone')
      .eq('is_admin', true)
      .eq('is_active', true),
  ])

  const student = studentResult.data
  if (!student) {
    console.error('[notifications] student profile not found for enrollment', enrollmentId)
    return
  }

  const courseTitle = await resolveCourseTitle(admin, courseResult.data)

  const session = sessionResult.data
  const payment = paymentResult.data
  const amountDollars = payment ? payment.amount_cents / 100 : null
  const paymentMethod = payment?.payment_method ?? 'stripe'

  // Student
  const studentRendered = enrollmentConfirmation({
    studentFirstName: student.first_name,
    courseTitle,
    firstSessionDate: session?.date ?? null,
    firstSessionStart: session?.start_time ?? null,
    firstSessionLocation: session?.location ?? null,
    amountDollars,
  })
  await Promise.all([
    trySMS(student.phone, studentRendered.smsBody),
    tryEmail(student.email, studentRendered.emailSubject, studentRendered.emailText, studentRendered.emailHtml),
  ])

  // Admins (fan-out — each independent)
  const admins = adminsResult.data ?? []
  const adminRendered = adminEnrollmentAlert({
    studentFullName: `${student.first_name} ${student.last_name}`.trim(),
    studentEmail: student.email,
    courseTitle,
    paymentMethod,
    amountDollars,
  })
  await Promise.all(
    admins.flatMap((a) => [
      trySMS(a.phone, adminRendered.smsBody),
      tryEmail(a.email, adminRendered.emailSubject, adminRendered.emailText, adminRendered.emailHtml),
    ]),
  )
}

/**
 * Fired when an admin cancels a session (status → 'cancelled'). Notifies
 * every student whose attendance record on this session was 'expected'
 * before the cancel — those are the ones who were planning to be there.
 *
 * Filtering by attendance.status = 'missed' AFTER the cancelSession call
 * (which flips 'expected' → 'missed') lets us identify the affected
 * cohort without needing to capture state before the update.
 *
 * No admin alert (the admin is the one cancelling — they already know).
 *
 * Returns nothing. Errors are logged and swallowed so the caller's
 * cancelSession write is never blocked by a notification failure.
 */
export async function notifySessionCancelled(sessionId: string): Promise<void> {
  const admin = createAdminClient()

  const { data: session, error: sessionErr } = await admin
    .from('sessions')
    .select('id, course_id, date, start_time, location, cancel_reason')
    .eq('id', sessionId)
    .maybeSingle()

  if (sessionErr || !session) {
    console.error('[notifications] session lookup failed:', sessionErr?.message ?? 'not found')
    return
  }

  const [courseResult, attendanceResult] = await Promise.all([
    admin
      .from('courses')
      .select('title, course_type_id')
      .eq('id', session.course_id)
      .maybeSingle(),
    // After cancelSession, 'expected' → 'missed' on this session. Pull every
    // missed row that has no makeup yet to identify affected students. A
    // pre-existing 'missed' (someone who had already missed before the
    // cancel) would be a no-op duplicate notify; acceptable rarity for V1.
    admin
      .from('session_attendance')
      .select('enrollment_id')
      .eq('session_id', sessionId)
      .eq('status', 'missed')
      .is('makeup_session_id', null),
  ])

  const courseTitle = await resolveCourseTitle(admin, courseResult.data)

  const enrollmentIds = (attendanceResult.data ?? []).map((r) => r.enrollment_id)
  if (enrollmentIds.length === 0) return

  // Fetch enrollment → student profile fanout
  const { data: enrollments, error: enrollErr } = await admin
    .from('enrollments')
    .select(`
      id,
      student:profiles!enrollments_student_id_fkey ( first_name, email, phone )
    `)
    .in('id', enrollmentIds)

  if (enrollErr) {
    console.error('[notifications] enrollment lookup failed:', enrollErr.message)
    return
  }

  await Promise.all(
    (enrollments ?? []).flatMap((e) => {
      const student = e.student as unknown as {
        first_name: string
        email: string
        phone: string | null
      } | null
      if (!student) return []

      const rendered = sessionCancellation({
        studentFirstName: student.first_name,
        courseTitle,
        sessionDate: session.date,
        sessionStart: session.start_time,
        sessionLocation: session.location,
        cancelReason: session.cancel_reason,
      })
      return [
        trySMS(student.phone, rendered.smsBody),
        tryEmail(student.email, rendered.emailSubject, rendered.emailText, rendered.emailHtml),
      ]
    }),
  )
}

/**
 * Fired when a makeup session is created for a previously-cancelled session.
 * Notifies every student whose `session_attendance.makeup_session_id` was
 * just linked to the new makeup. Caller (createMakeupSession) must run this
 * AFTER the makeup_session_id link update.
 *
 * No admin alert (admin scheduled the makeup).
 *
 * Returns nothing. Errors are logged and swallowed so the caller's primary
 * write (the makeup itself) is never blocked by a notification failure.
 */
export async function notifyMakeupAssigned(makeupSessionId: string): Promise<void> {
  const admin = createAdminClient()

  const { data: makeupSession, error: makeupErr } = await admin
    .from('sessions')
    .select('id, course_id, date, start_time, location')
    .eq('id', makeupSessionId)
    .maybeSingle()

  if (makeupErr || !makeupSession) {
    console.error('[notifications] makeup session lookup failed:', makeupErr?.message ?? 'not found')
    return
  }

  // Find every attendance row linked to this makeup. Each row's session_id
  // is the original (cancelled) session — keep it for the email's "you missed"
  // line. A student linked twice (e.g., manual re-link) becomes a duplicate
  // notify; acceptable rarity for V1.
  const { data: links, error: linksErr } = await admin
    .from('session_attendance')
    .select(`
      enrollment_id,
      original_session:sessions!session_attendance_session_id_fkey ( date )
    `)
    .eq('makeup_session_id', makeupSessionId)

  if (linksErr) {
    console.error('[notifications] makeup link lookup failed:', linksErr.message)
    return
  }
  if (!links || links.length === 0) return

  // Course lookup and enrollment fan-out are independent — run in parallel.
  const enrollmentIds = links.map((l) => l.enrollment_id)
  const [courseResult, enrollmentsResult] = await Promise.all([
    admin
      .from('courses')
      .select('title, course_type_id')
      .eq('id', makeupSession.course_id)
      .maybeSingle(),
    admin
      .from('enrollments')
      .select(`
        id,
        student:profiles!enrollments_student_id_fkey ( first_name, email, phone )
      `)
      .in('id', enrollmentIds),
  ])

  if (enrollmentsResult.error) {
    console.error('[notifications] makeup enrollment lookup failed:', enrollmentsResult.error.message)
    return
  }
  const enrollments = enrollmentsResult.data
  const courseTitle = await resolveCourseTitle(admin, courseResult.data)

  // Index original-session date by enrollment_id for the per-student template
  const originalDateByEnrollment = new Map<string, string | null>()
  for (const l of links) {
    const orig = l.original_session as unknown as { date: string } | null
    originalDateByEnrollment.set(l.enrollment_id, orig?.date ?? null)
  }

  await Promise.all(
    (enrollments ?? []).flatMap((e) => {
      const student = e.student as unknown as {
        first_name: string
        email: string
        phone: string | null
      } | null
      if (!student) return []

      const rendered = makeupAssignment({
        studentFirstName: student.first_name,
        courseTitle,
        originalSessionDate: originalDateByEnrollment.get(e.id) ?? null,
        makeupSessionDate: makeupSession.date,
        makeupSessionStart: makeupSession.start_time,
        makeupSessionLocation: makeupSession.location,
      })
      return [
        trySMS(student.phone, rendered.smsBody),
        tryEmail(student.email, rendered.emailSubject, rendered.emailText, rendered.emailHtml),
      ]
    }),
  )
}

/**
 * Cron-driven scan: courses whose first session is within
 * LOW_ENROLLMENT_DAYS_OUT and whose confirmed enrollment count is below
 * LOW_ENROLLMENT_RATIO of capacity get a daily warning to all admins.
 *
 * No "already alerted" cooldown for V1 — the cron runs daily and will repeat
 * while the condition holds. 5.8 may add a cooldown column if it's noisy.
 *
 * Returns the number of courses that triggered an alert (for the cron route
 * response payload).
 */
export async function notifyLowEnrollmentCourses(): Promise<number> {
  const admin = createAdminClient()

  const today = new Date()
  const horizon = new Date(today.getTime() + LOW_ENROLLMENT_DAYS_OUT * 24 * 60 * 60 * 1000)
  const todayISO = today.toISOString().slice(0, 10)
  const horizonISO = horizon.toISOString().slice(0, 10)

  // Active courses with at least one upcoming session inside the window.
  // Pull more than we need and filter in JS — keeps the SQL simple and the
  // window boundary readable.
  const { data: courses, error: coursesErr } = await admin
    .from('courses')
    .select('id, title, capacity, course_type_id')
    .eq('status', 'active')

  if (coursesErr) {
    console.error('[notifications] low-enrollment course lookup failed:', coursesErr.message)
    return 0
  }
  if (!courses || courses.length === 0) return 0

  const { data: admins, error: adminsErr } = await admin
    .from('profiles')
    .select('email, phone')
    .eq('is_admin', true)
    .eq('is_active', true)

  if (adminsErr) {
    console.error('[notifications] admin lookup failed:', adminsErr.message)
    return 0
  }
  if (!admins || admins.length === 0) return 0

  let alertedCount = 0

  for (const course of courses) {
    const { data: firstSession } = await admin
      .from('sessions')
      .select('date')
      .eq('course_id', course.id)
      .gte('date', todayISO)
      .lte('date', horizonISO)
      .order('date', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (!firstSession) continue

    const { count: enrolledCount, error: countErr } = await admin
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', course.id)
      .eq('status', 'confirmed')

    if (countErr) {
      console.error('[notifications] enrollment count failed for course', course.id, countErr.message)
      continue
    }

    const enrolled = enrolledCount ?? 0
    // Ratio comparison, not Math.floor(capacity * ratio) — at capacity=1
    // floor was 0 (alert never fires) and at capacity=3 floor was 1 (1/3
    // full silently "fine"). 0/0 capacity courses are treated as not low.
    if (course.capacity <= 0) continue
    if (enrolled / course.capacity >= LOW_ENROLLMENT_RATIO) continue

    const start = new Date(firstSession.date)
    const daysUntilStart = Math.max(
      0,
      Math.round((start.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)),
    )

    const courseTitle = await resolveCourseTitle(admin, {
      title: course.title,
      course_type_id: course.course_type_id,
    })

    const rendered = lowEnrollmentWarning({
      courseTitle,
      firstSessionDate: firstSession.date,
      daysUntilStart,
      enrolledCount: enrolled,
      capacity: course.capacity,
    })

    await Promise.all(
      admins.flatMap((a) => [
        trySMS(a.phone, rendered.smsBody),
        tryEmail(a.email, rendered.emailSubject, rendered.emailText, rendered.emailHtml),
      ]),
    )

    alertedCount++
  }

  return alertedCount
}

// Reminder lead times — fired by the daily session-reminders cron.
// Each entry: days-out from "today", and the human label inserted into the
// template. To add a new lead time, just add an entry; trigger will pick it up.
const SESSION_REMINDER_LEAD_TIMES: { daysOut: number; label: string }[] = [
  { daysOut: 7, label: 'in 1 week' },
  { daysOut: 1, label: 'tomorrow' },
]

// UTC-safe day offset to avoid local-timezone slop when the cron runs at
// different UTC times throughout the year.
function isoDateOffset(reference: Date, daysOut: number): string {
  const d = new Date(Date.UTC(
    reference.getUTCFullYear(),
    reference.getUTCMonth(),
    reference.getUTCDate() + daysOut,
  ))
  return d.toISOString().slice(0, 10)
}

/**
 * Cron-driven scan: scheduled sessions whose date is exactly N days out
 * (per SESSION_REMINDER_LEAD_TIMES) get a reminder fired to every student
 * with `expected` attendance on that session.
 *
 * Called daily. Idempotency comes from the exact-date filter: each session
 * fires reminders exactly once per lead-time slot. If the cron skips a day
 * (Vercel hiccup), reminders for that day are missed — we don't catch up.
 *
 * Caller may pass a `referenceDate` to simulate "today" for testing.
 *
 * Returns the number of (session × lead-time) pairs that fired at least one
 * notification, for the cron route response payload.
 */
export async function notifyUpcomingSessionReminders(
  referenceDate?: Date,
): Promise<number> {
  const admin = createAdminClient()
  const today = referenceDate ?? new Date()

  // Build target date strings for every lead-time slot
  const targets = SESSION_REMINDER_LEAD_TIMES.map((lt) => ({
    label: lt.label,
    isoDate: isoDateOffset(today, lt.daysOut),
  }))
  const targetDates = targets.map((t) => t.isoDate)

  // Pull all scheduled sessions on any target date
  const { data: sessions, error: sessionsErr } = await admin
    .from('sessions')
    .select('id, course_id, date, start_time, location, status')
    .in('date', targetDates)
    .eq('status', 'scheduled')

  if (sessionsErr) {
    console.error('[notifications] reminder session lookup failed:', sessionsErr.message)
    return 0
  }
  if (!sessions || sessions.length === 0) return 0

  let firedCount = 0

  for (const session of sessions) {
    const slot = targets.find((t) => t.isoDate === session.date)
    if (!slot) continue

    // Pull all 'expected' attendance for this session, with student profile
    // and course title in the same round trip.
    const [attendanceResult, courseResult] = await Promise.all([
      admin
        .from('session_attendance')
        .select(`
          enrollment_id,
          enrollments!inner (
            id,
            student:profiles!enrollments_student_id_fkey ( first_name, email, phone )
          )
        `)
        .eq('session_id', session.id)
        .eq('status', 'expected'),
      admin
        .from('courses')
        .select('title, course_type_id')
        .eq('id', session.course_id)
        .maybeSingle(),
    ])

    if (attendanceResult.error) {
      console.error('[notifications] reminder attendance lookup failed for session', session.id, attendanceResult.error.message)
      continue
    }
    const attendance = attendanceResult.data ?? []
    if (attendance.length === 0) continue

    const courseTitle = await resolveCourseTitle(admin, courseResult.data)

    await Promise.all(
      attendance.flatMap((a) => {
        const enrollment = a.enrollments as unknown as {
          student: { first_name: string; email: string; phone: string | null } | null
        } | null
        const student = enrollment?.student
        if (!student) return []

        const rendered = sessionReminder({
          studentFirstName: student.first_name,
          courseTitle,
          sessionDate: session.date,
          sessionStart: session.start_time,
          sessionLocation: session.location,
          leadTimeLabel: slot.label,
        })
        return [
          trySMS(student.phone, rendered.smsBody),
          tryEmail(student.email, rendered.emailSubject, rendered.emailText, rendered.emailHtml),
        ]
      }),
    )

    firedCount++
  }

  return firedCount
}

// Course.title is optional; fall back to course_type.name when blank
// (matches admin UI display logic).
async function resolveCourseTitle(
  admin: AdminClient,
  course: { title: string | null; course_type_id: string } | null | undefined,
): Promise<string> {
  if (!course) return 'a course'
  if (course.title && course.title.trim().length > 0) return course.title
  const { data: ct } = await admin
    .from('course_types')
    .select('name')
    .eq('id', course.course_type_id)
    .maybeSingle()
  return ct?.name ?? 'a course'
}
