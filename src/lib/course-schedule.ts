// DEC-036: the course schedule is DERIVED from its sessions, never denormalized
// onto `courses`. This formatter renders "weekday · time · date-range" when the
// sessions form a clean recurrence, and degrades to "Varies" for makeups/one-offs
// or any irregular set.

export type ScheduleSession = {
  date: string // ISO 'YYYY-MM-DD'
  start_time: string // 'HH:MM' or 'HH:MM:SS'
  end_time: string
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Parse 'YYYY-MM-DD' into a local Date without UTC drift (avoids the
// off-by-one-day trap of `new Date('2026-07-01')`, which is parsed as UTC).
export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// '18:00' / '18:00:00' -> '6pm'; '18:30' -> '6:30pm'. Meridiem omitted here so a
// range can collapse a shared meridiem ("6–8pm" rather than "6pm–8pm").
function formatTimeParts(time: string): { text: string; meridiem: 'am' | 'pm' } {
  const [hStr, mStr] = time.split(':')
  const h24 = Number(hStr)
  const min = Number(mStr ?? 0)
  const meridiem = h24 >= 12 ? 'pm' : 'am'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return { text: min === 0 ? `${h12}` : `${h12}:${String(min).padStart(2, '0')}`, meridiem }
}

export function formatTimeRange(start: string, end: string): string {
  const s = formatTimeParts(start)
  const e = formatTimeParts(end)
  // Collapse the start meridiem when both sides share it: "6–8pm".
  const startLabel = s.meridiem === e.meridiem ? s.text : `${s.text}${s.meridiem}`
  return `${startLabel}–${e.text}${e.meridiem}`
}

function formatMonthDay(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

function formatDateRange(first: Date, last: Date): string {
  const start = formatMonthDay(first)
  if (first.getTime() === last.getTime()) return start
  // Drop the repeated month on the right side of a same-month range: "Jul 1–5".
  const end = first.getMonth() === last.getMonth() ? `${last.getDate()}` : formatMonthDay(last)
  return `${start}–${end}`
}

/**
 * Render a human schedule from a course's sessions.
 * - 0 sessions  -> 'No sessions scheduled'
 * - 1 session   -> 'Jul 1 · 6–8pm'
 * - uniform weekday + time -> 'Tuesdays · 6–8pm · Jul 1–Aug 5'
 * - anything irregular      -> 'Varies · Jul 1–Aug 5'
 */
export function formatSchedule(sessions: ScheduleSession[]): string {
  if (!sessions || sessions.length === 0) return 'No sessions scheduled'

  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date))
  const dates = sorted.map((s) => parseLocalDate(s.date))
  const first = dates[0]
  const last = dates[dates.length - 1]

  if (sorted.length === 1) {
    return `${formatMonthDay(first)} · ${formatTimeRange(sorted[0].start_time, sorted[0].end_time)}`
  }

  const sameWeekday = dates.every((d) => d.getDay() === first.getDay())
  const sameTime = sorted.every(
    (s) => s.start_time === sorted[0].start_time && s.end_time === sorted[0].end_time
  )
  const dateRange = formatDateRange(first, last)

  if (sameWeekday && sameTime) {
    const weekdayPlural = `${WEEKDAYS[first.getDay()]}s`
    return `${weekdayPlural} · ${formatTimeRange(sorted[0].start_time, sorted[0].end_time)} · ${dateRange}`
  }

  return `Varies · ${dateRange}`
}
