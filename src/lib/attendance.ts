export type AttendanceStatus = 'expected' | 'attended' | 'missed' | 'excused'

export const attendanceStatusConfig: Record<
  AttendanceStatus,
  { label: string; variant: 'ok' | 'neutral' | 'warn' | 'alert' }
> = {
  attended: { label: 'Attended', variant: 'ok' },
  missed: { label: 'Missed', variant: 'alert' },
  excused: { label: 'Excused', variant: 'neutral' },
  expected: { label: 'Upcoming', variant: 'neutral' },
}
