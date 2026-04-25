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
