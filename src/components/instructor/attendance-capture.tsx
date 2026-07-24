'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { saveAttendance } from '@/actions/attendance'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { fmtDateLong } from '@/lib/utils'
import { attendanceStatusConfig, type AttendanceStatus } from '@/lib/attendance'

export type CaptureStudent = {
  enrollment_id: string
  student_id: string
  first_name: string
  last_name: string
  phone: string | null
  email: string
  has_instructor_notes: boolean
  attendance_status: AttendanceStatus | null
  attendance_notes: string | null
  makeup_session_id: string | null
  makeup_from_date: string | null
}

// Instructors edit only status; a per-student `expected` is the pre-attendance
// default. Labels come from the shared config so admin + instructor stay in sync.
const STATUS_ORDER: AttendanceStatus[] = ['attended', 'missed', 'excused', 'expected']

type Props = {
  sessionId: string
  students: CaptureStudent[]
  // Cancelled sessions are system-managed (attendance auto-set to missed) — show
  // read-only badges rather than editable selects.
  readOnly?: boolean
}

export default function AttendanceCapture({ sessionId, students, readOnly = false }: Props) {
  const initial = Object.fromEntries(
    students.map((s) => [s.enrollment_id, s.attendance_status ?? 'expected']),
  ) as Record<string, AttendanceStatus>

  const [records, setRecords] = useState<Record<string, AttendanceStatus>>(initial)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  function setStatus(enrollmentId: string, status: AttendanceStatus) {
    setRecords((prev) => ({ ...prev, [enrollmentId]: status }))
    setMessage(null)
  }

  function markAll(status: AttendanceStatus) {
    setRecords(Object.fromEntries(students.map((s) => [s.enrollment_id, status])))
    setMessage(null)
  }

  function handleSave() {
    const payload = students.map((s) => ({
      enrollment_id: s.enrollment_id,
      status: records[s.enrollment_id] ?? s.attendance_status ?? 'expected',
      // Round-trip the existing attendance note — the RPC always writes notes,
      // so passing the current value preserves it (instructors don't edit it here).
      notes: s.attendance_notes,
    }))

    startTransition(async () => {
      const result = await saveAttendance(sessionId, payload, [`/instructor/sessions/${sessionId}`])
      setMessage(result.error ? `Error: ${result.error}` : 'Attendance saved.')
    })
  }

  const hasChanges = students.some(
    (s) => records[s.enrollment_id] !== (s.attendance_status ?? 'expected'),
  )

  if (students.length === 0) {
    return <p className="px-6 py-4 text-sm text-muted-foreground">No students enrolled.</p>
  }

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex items-center gap-2 px-6 pt-4">
          <span className="text-sm text-muted-foreground">Quick:</span>
          <Button type="button" variant="ghost" size="sm" onClick={() => markAll('attended')}>
            All attended
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => markAll('missed')}>
            All missed
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className="hidden sm:table-cell">Email</TableHead>
            <TableHead>Attendance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((s) => {
            const value = records[s.enrollment_id] ?? s.attendance_status ?? 'expected'
            return (
              <TableRow key={s.enrollment_id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/instructor/students/${s.student_id}`}
                      className="hover:underline underline-offset-2"
                    >
                      {s.last_name}, {s.first_name}
                    </Link>
                    {s.has_instructor_notes && (
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full bg-primary shrink-0"
                        title="Student left a note for their instructor"
                      />
                    )}
                    {s.makeup_from_date && (
                      <Badge variant="warn">Makeup from {fmtDateLong(s.makeup_from_date)}</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {s.phone ?? '—'}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {s.email}
                </TableCell>
                <TableCell>
                  {readOnly ? (
                    <div className="flex items-center gap-2">
                      <Badge variant={attendanceStatusConfig[value].variant}>
                        {attendanceStatusConfig[value].label}
                      </Badge>
                      {value === 'missed' && !s.makeup_session_id && (
                        <span className="text-xs text-destructive font-medium">Needs makeup</span>
                      )}
                    </div>
                  ) : (
                    <Select value={value} onValueChange={(v) => setStatus(s.enrollment_id, v as AttendanceStatus)}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_ORDER.map((st) => (
                          <SelectItem key={st} value={st}>
                            {attendanceStatusConfig[st].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      </div>

      {!readOnly && (
        <div className="flex items-center gap-3 px-6 pb-4">
          <Button type="button" onClick={handleSave} disabled={pending || !hasChanges}>
            {pending ? 'Saving…' : 'Save attendance'}
          </Button>
          {message && (
            <span
              className={
                message.startsWith('Error') ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'
              }
            >
              {message}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
