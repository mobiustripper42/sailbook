'use client'

import { useState, useTransition } from 'react'
import { saveAttendance } from '@/actions/attendance'
import { Button } from '@/components/ui/button'
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
import { Badge } from '@/components/ui/badge'

type Student = {
  enrollment_id: string
  student_id: string
  first_name: string
  last_name: string
  email: string
  current_status: 'expected' | 'attended' | 'missed' | 'excused'
  notes: string | null
}

type Props = {
  courseId: string
  sessionId: string
  students: Student[]
}

const statusOptions = [
  { value: 'expected', label: 'Expected' },
  { value: 'attended', label: 'Attended' },
  { value: 'missed', label: 'Missed' },
  { value: 'excused', label: 'Excused' },
] as const

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  expected: 'outline',
  attended: 'default',
  missed: 'destructive',
  excused: 'secondary',
}

export default function AttendanceForm({ courseId, sessionId, students }: Props) {
  const [records, setRecords] = useState<Record<string, string>>(
    Object.fromEntries(students.map((s) => [s.enrollment_id, s.current_status]))
  )
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  function updateStatus(enrollmentId: string, status: string) {
    setRecords((prev) => ({ ...prev, [enrollmentId]: status }))
    setMessage(null)
  }

  function handleSave() {
    const payload = students.map((s) => ({
      session_id: sessionId,
      enrollment_id: s.enrollment_id,
      status: (records[s.enrollment_id] ?? s.current_status) as 'expected' | 'attended' | 'missed' | 'excused',
      notes: s.notes,
    }))

    startTransition(async () => {
      const result = await saveAttendance(courseId, sessionId, payload)
      if (result.error) {
        setMessage(`Error: ${result.error}`)
      } else {
        setMessage('Attendance saved.')
      }
    })
  }

  function markAll(status: string) {
    setRecords(Object.fromEntries(students.map((s) => [s.enrollment_id, status])))
    setMessage(null)
  }

  const hasChanges = students.some((s) => records[s.enrollment_id] !== s.current_status)

  if (students.length === 0) {
    return <p className="text-sm text-muted-foreground">No enrolled students for this session.</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Quick:</span>
        <Button variant="outline" size="sm" onClick={() => markAll('attended')}>All Attended</Button>
        <Button variant="outline" size="sm" onClick={() => markAll('missed')}>All Missed</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((s) => {
            const currentValue = records[s.enrollment_id] ?? s.current_status
            return (
              <TableRow key={s.enrollment_id}>
                <TableCell className="font-medium">{s.first_name} {s.last_name}</TableCell>
                <TableCell className="text-muted-foreground">{s.email}</TableCell>
                <TableCell>
                  <Select value={currentValue} onValueChange={(v) => updateStatus(s.enrollment_id, v)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue>
                        <Badge variant={statusVariant[currentValue]}>{currentValue}</Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={pending || !hasChanges}>
          {pending ? 'Saving…' : 'Save Attendance'}
        </Button>
        {message && (
          <span className={`text-sm ${message.startsWith('Error') ? 'text-destructive' : 'text-muted-foreground'}`}>
            {message}
          </span>
        )}
        {hasChanges && !message && (
          <span className="text-sm text-muted-foreground">Unsaved changes</span>
        )}
      </div>
    </div>
  )
}
