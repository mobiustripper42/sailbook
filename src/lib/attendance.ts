export type AttendanceStatus = 'expected' | 'attended' | 'missed' | 'excused'

export const attendanceStatusConfig: Record<
  AttendanceStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  attended: { label: 'Attended', variant: 'default' },
  missed: { label: 'Missed', variant: 'destructive' },
  excused: { label: 'Excused', variant: 'secondary' },
  expected: { label: 'Upcoming', variant: 'outline' },
}
