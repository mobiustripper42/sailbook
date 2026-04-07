import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { fmtDate, fmtTime } from '@/lib/utils'
import { attendanceStatusConfig } from '@/lib/attendance'
import type { AttendanceStatus } from '@/lib/attendance'

type AttendanceRecord = {
  sessionId: string
  sessionDate: string
  startTime: string
  endTime: string
  location: string | null
  status: AttendanceStatus
  makeupSessionId: string | null
  cancelled: boolean
  sessionInstructorName: string | null
}

type CourseAttendance = {
  courseId: string
  courseName: string
  enrollmentStatus: string
  instructorName: string | null
  records: AttendanceRecord[]
  missedCount: number
}

function enrollmentStatusVariant(status: string): 'default' | 'secondary' | 'outline' {
  if (status === 'confirmed') return 'default'
  if (status === 'registered') return 'secondary'
  return 'outline'
}

function enrollmentStatusLabel(status: string): string {
  if (status === 'registered') return 'Pending confirmation'
  if (status === 'confirmed') return 'Enrolled'
  if (status === 'cancelled') return 'Cancelled'
  if (status === 'completed') return 'Completed'
  return status
}

export default function CourseAttendanceCard({ course }: { course: CourseAttendance }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{course.courseName}</CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={enrollmentStatusVariant(course.enrollmentStatus)}>
              {enrollmentStatusLabel(course.enrollmentStatus)}
            </Badge>
            {course.missedCount > 0 && (
              <Badge variant="destructive">
                {course.missedCount} {course.missedCount === 1 ? 'needs' : 'need'} makeup
              </Badge>
            )}
          </div>
        </div>
        {course.instructorName && (
          <p className="text-xs text-muted-foreground">
            Instructor: {course.instructorName}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {course.records.map((r) => {
            const config = attendanceStatusConfig[r.status]
            const needsMakeup = r.status === 'missed' && !r.makeupSessionId

            return (
              <div
                key={r.sessionId}
                className="py-2 text-sm first:pt-0 last:pb-0"
              >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={r.cancelled ? 'line-through text-muted-foreground' : ''}>
                    {fmtDate(r.sessionDate)} · {fmtTime(r.startTime)}–{fmtTime(r.endTime)}
                  </span>
                  {r.location && (
                    <span className="text-muted-foreground">· {r.location}</span>
                  )}
                  {r.cancelled && (
                    <Badge variant="outline" className="text-xs">Cancelled</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {needsMakeup && (
                    <span className="text-xs text-destructive font-medium">
                      Needs makeup
                    </span>
                  )}
                  {r.status === 'missed' && r.makeupSessionId && (
                    <span className="text-xs text-muted-foreground">
                      Makeup scheduled
                    </span>
                  )}
                  <Badge variant={config.variant}>{config.label}</Badge>
                </div>
              </div>
              {r.sessionInstructorName && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Instructor: {r.sessionInstructorName}
                </p>
              )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
