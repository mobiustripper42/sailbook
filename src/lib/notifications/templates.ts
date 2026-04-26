// Notification copy. Pure functions — easy to unit test, easy to tune wording
// without touching trigger logic.
//
// All templates return SMS body, email subject, and email HTML/text. Caller
// picks which channel(s) to send.

export type EnrollmentConfirmationData = {
  studentFirstName: string
  courseTitle: string
  firstSessionDate: string | null   // ISO date "2026-05-02"
  firstSessionStart: string | null  // "08:00:00"
  firstSessionLocation: string | null
  amountDollars: number | null      // null = free / no payment row
}

export type AdminEnrollmentAlertData = {
  studentFullName: string
  studentEmail: string
  courseTitle: string
  paymentMethod: string             // 'stripe' | 'cash' | 'check' | 'venmo' | 'stripe_manual'
  amountDollars: number | null
}

export type LowEnrollmentWarningData = {
  courseTitle: string
  firstSessionDate: string          // ISO "2026-05-02"
  daysUntilStart: number
  enrolledCount: number
  capacity: number
}

export type Rendered = {
  smsBody: string
  emailSubject: string
  emailText: string
  emailHtml: string
}

function formatDate(iso: string | null): string {
  if (!iso) return 'TBD'
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function formatTime(t: string | null): string {
  if (!t) return ''
  const [hh, mm] = t.split(':').map(Number)
  const period = hh >= 12 ? 'PM' : 'AM'
  const h12 = hh % 12 === 0 ? 12 : hh % 12
  return mm === 0 ? `${h12} ${period}` : `${h12}:${String(mm).padStart(2, '0')} ${period}`
}

function dollars(n: number | null): string {
  if (n === null || Number.isNaN(n)) return ''
  return `$${n.toFixed(2)}`
}

// Escape user-supplied strings before they land in an email HTML body.
// Names like O'Brien render fine without this; anything containing &, <, >,
// or quotes will not. Defense in depth — every `${…}` in an emailHtml string
// goes through this.
function esc(s: string | number | null | undefined): string {
  if (s === null || s === undefined) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function enrollmentConfirmation(data: EnrollmentConfirmationData): Rendered {
  const dateStr = formatDate(data.firstSessionDate)
  const timeStr = formatTime(data.firstSessionStart)
  const when = data.firstSessionDate ? `${dateStr}${timeStr ? ` at ${timeStr}` : ''}` : 'TBD'
  const where = data.firstSessionLocation ?? 'TBD'

  // Twilio handles inbound STOP/HELP/UNSUBSCRIBE keywords automatically — no
  // backend wiring needed. Disclosure is present so toll-free / 10DLC carrier
  // filters see compliant opt-out language. Admin templates skip this on
  // purpose (admins are operators, not consumer recipients).
  const smsBody =
    `SailBook: Hi ${data.studentFirstName}, you're enrolled in ${data.courseTitle}. ` +
    `First session: ${when}, ${where}. See your schedule at sailbook.live/student/courses. ` +
    `Reply STOP to opt out.`

  const emailSubject = `Enrolled: ${data.courseTitle}`

  const lines = [
    `Hi ${data.studentFirstName},`,
    ``,
    `You're enrolled in ${data.courseTitle}.`,
    ``,
    `First session: ${when}`,
    `Location: ${where}`,
    data.amountDollars !== null ? `Amount: ${dollars(data.amountDollars)}` : null,
    ``,
    `View your schedule: https://sailbook.live/student/courses`,
    ``,
    `— Simply Sailing`,
  ].filter((l): l is string => l !== null)

  const emailText = lines.join('\n')

  const emailHtml = `
<p>Hi ${esc(data.studentFirstName)},</p>
<p>You're enrolled in <strong>${esc(data.courseTitle)}</strong>.</p>
<p>
  <strong>First session:</strong> ${esc(when)}<br>
  <strong>Location:</strong> ${esc(where)}
  ${data.amountDollars !== null ? `<br><strong>Amount:</strong> ${esc(dollars(data.amountDollars))}` : ''}
</p>
<p><a href="https://sailbook.live/student/courses">View your schedule</a></p>
<p>— Simply Sailing</p>`.trim()

  return { smsBody, emailSubject, emailText, emailHtml }
}

export function adminEnrollmentAlert(data: AdminEnrollmentAlertData): Rendered {
  const amount = data.amountDollars !== null ? dollars(data.amountDollars) : 'no charge'

  const smsBody =
    `SailBook: ${data.studentFullName} enrolled in ${data.courseTitle} ` +
    `(${data.paymentMethod}, ${amount}).`

  const emailSubject = `New enrollment: ${data.studentFullName} — ${data.courseTitle}`

  const emailText = [
    `${data.studentFullName} just enrolled.`,
    ``,
    `Course: ${data.courseTitle}`,
    `Email: ${data.studentEmail}`,
    `Payment: ${data.paymentMethod} (${amount})`,
    ``,
    `Admin view: https://sailbook.live/admin/courses`,
  ].join('\n')

  const emailHtml = `
<p><strong>${esc(data.studentFullName)}</strong> just enrolled.</p>
<p>
  <strong>Course:</strong> ${esc(data.courseTitle)}<br>
  <strong>Email:</strong> ${esc(data.studentEmail)}<br>
  <strong>Payment:</strong> ${esc(data.paymentMethod)} (${esc(amount)})
</p>
<p><a href="https://sailbook.live/admin/courses">Admin view</a></p>`.trim()

  return { smsBody, emailSubject, emailText, emailHtml }
}

export function lowEnrollmentWarning(data: LowEnrollmentWarningData): Rendered {
  const dateStr = formatDate(data.firstSessionDate)

  const smsBody =
    `SailBook: ${data.courseTitle} starts ${dateStr} ` +
    `(${data.daysUntilStart} days) with only ${data.enrolledCount}/${data.capacity} enrolled.`

  const emailSubject = `Low enrollment: ${data.courseTitle}`

  const emailText = [
    `${data.courseTitle} is below half capacity with the start date approaching.`,
    ``,
    `Start date: ${dateStr} (${data.daysUntilStart} days out)`,
    `Enrolled: ${data.enrolledCount} of ${data.capacity}`,
    ``,
    `Admin view: https://sailbook.live/admin/courses`,
  ].join('\n')

  const emailHtml = `
<p><strong>${esc(data.courseTitle)}</strong> is below half capacity with the start date approaching.</p>
<p>
  <strong>Start date:</strong> ${esc(dateStr)} (${esc(data.daysUntilStart)} days out)<br>
  <strong>Enrolled:</strong> ${esc(data.enrolledCount)} of ${esc(data.capacity)}
</p>
<p><a href="https://sailbook.live/admin/courses">Admin view</a></p>`.trim()

  return { smsBody, emailSubject, emailText, emailHtml }
}
