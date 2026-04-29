import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { fmtDateLong, fmtTime } from '@/lib/utils'
import { attendanceStatusConfig } from '@/lib/attendance'
import type { AttendanceStatus } from '@/lib/attendance'
import SessionNotesForm from '@/components/instructor/session-notes-form'

type StudentRow = {
  enrollment_id: string
  student_id: string
  first_name: string
  last_name: string
  phone: string | null
  email: string
  has_instructor_notes: boolean
  attendance_status: AttendanceStatus | null
  makeup_session_id: string | null
  makeup_from_date: string | null
}

export default async function InstructorSessionRosterPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch the session with its course info
  const { data: session } = await supabase
    .from('sessions')
    .select(`
      id, date, start_time, end_time, location, status, notes,
      courses!inner (
        id, title, capacity, instructor_id,
        course_types ( name )
      )
    `)
    .eq('id', id)
    .single()

  if (!session) notFound()

  const course = session.courses as unknown as {
    id: string
    title: string | null
    capacity: number
    instructor_id: string | null
    course_types: { name: string } | null
  }

  // Verify this instructor owns the course
  if (course.instructor_id !== user.id) redirect('/instructor/dashboard')

  // Fetch enrollments with student profiles
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id, student_id, status,
      profiles!enrollments_student_id_fkey ( first_name, last_name, phone, email, instructor_notes )
    `)
    .eq('course_id', course.id)
    .neq('status', 'cancelled')
    .order('enrolled_at')

  // Fetch attendance records for this session
  const { data: attendanceRecords } = await supabase
    .from('session_attendance')
    .select('enrollment_id, status, makeup_session_id')
    .eq('session_id', id)

  const attendanceMap = new Map(
    attendanceRecords?.map((a) => [a.enrollment_id, a]) ?? []
  )

  // Fetch students making up a missed session here
  const { data: makeupRecords } = await supabase
    .from('session_attendance')
    .select('enrollment_id, sessions!session_attendance_session_id_fkey ( date )')
    .eq('makeup_session_id', id)

  const makeupMap = new Map(
    makeupRecords?.map((r) => {
      const missed = r.sessions as unknown as { date: string } | null
      return [r.enrollment_id, missed?.date ?? null]
    }) ?? []
  )

  const students: StudentRow[] = (enrollments ?? []).map((e) => {
    const profile = e.profiles as unknown as {
      first_name: string
      last_name: string
      phone: string | null
      email: string
      instructor_notes: string | null
    }
    const attendance = attendanceMap.get(e.id)
    return {
      enrollment_id: e.id,
      student_id: e.student_id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone,
      email: profile.email,
      has_instructor_notes: !!profile.instructor_notes,
      attendance_status: (attendance?.status as AttendanceStatus) ?? null,
      makeup_session_id: attendance?.makeup_session_id ?? null,
      makeup_from_date: makeupMap.get(e.id) ?? null,
    }
  })

  const courseTitle = course.title ?? course.course_types?.name ?? 'Untitled Course'
  const isCancelled = session.status === 'cancelled'

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href="/instructor/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to dashboard
        </Link>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{courseTitle}</h1>
          {isCancelled && <Badge variant="alert">Cancelled</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          {fmtDateLong(session.date)} · {fmtTime(session.start_time)} – {fmtTime(session.end_time)}
          {session.location ? ` · ${session.location}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Enrolled</p>
          <p className="font-medium">{students.length} / {course.capacity}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Status</p>
          <p className="font-medium capitalize">{session.status}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roster</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {students.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">No students enrolled.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Attendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
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
                          <Badge variant="warn">
                            Makeup from {fmtDateLong(s.makeup_from_date)}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.phone ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.email}
                    </TableCell>
                    <TableCell>
                      {s.attendance_status ? (
                        <div className="flex items-center gap-2">
                          <Badge variant={attendanceStatusConfig[s.attendance_status].variant}>
                            {attendanceStatusConfig[s.attendance_status].label}
                          </Badge>
                          {s.attendance_status === 'missed' && !s.makeup_session_id && (
                            <span className="text-xs text-destructive font-medium">
                              Needs makeup
                            </span>
                          )}
                          {s.attendance_status === 'missed' && s.makeup_session_id && (
                            <span className="text-xs text-muted-foreground">
                              Makeup scheduled
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Visible to all instructors and admin. Use for continuity between sessions.
          </p>
          <SessionNotesForm sessionId={session.id} initialNotes={session.notes ?? ''} />
        </CardContent>
      </Card>
    </div>
  )
}
