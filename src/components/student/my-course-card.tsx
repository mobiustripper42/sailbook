import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fmtTime } from '@/lib/utils'
import { attendanceStatusConfig } from '@/lib/attendance'
import type { MyCourseEntry } from '@/lib/student-courses'

export function enrollmentStatusVariant(status: string): 'ok' | 'neutral' | 'warn' {
  if (status === 'confirmed' || status === 'completed') return 'ok'
  if (status === 'cancel_requested' || status === 'pending_payment') return 'warn'
  return 'neutral'
}

export function enrollmentStatusLabel(status: string): string {
  if (status === 'registered') return 'Pending confirmation'
  if (status === 'confirmed') return 'Enrolled'
  if (status === 'cancelled') return 'Cancelled'
  if (status === 'completed') return 'Completed'
  if (status === 'cancel_requested') return 'Cancellation Requested'
  if (status === 'pending_payment') return 'Payment Pending'
  return status
}

export function fmtSessionDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * One enrolled course: schedule and attendance together (10.7). Before this,
 * the schedule lived on My Courses and the attendance status for the same
 * sessions lived on a separate /student/attendance page.
 */
export default function MyCourseCard({ course }: { course: MyCourseEntry }) {
  return (
    <Card size="sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">
            <Link
              href={`/student/courses/${course.courseId}`}
              className="hover:underline underline-offset-2"
            >
              {course.title}
            </Link>
          </CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={enrollmentStatusVariant(course.enrollmentStatus)}>
              {enrollmentStatusLabel(course.enrollmentStatus)}
            </Badge>
            {course.missedCount > 0 && (
              <Badge variant="alert">
                {course.missedCount} {course.missedCount === 1 ? 'needs' : 'need'} makeup
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{course.typeName}</p>
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Instructor</span>
          <span className="text-foreground">{course.instructorName ?? '—'}</span>
        </div>
        {course.price != null && (
          <div className="flex justify-between text-muted-foreground">
            <span>Price</span>
            <span className="text-foreground font-medium">${course.price}</span>
          </div>
        )}

        {course.sessions.length > 0 && (
          <div className="border-t pt-2 divide-y">
            {course.sessions.map((s) => {
              const config = s.status ? attendanceStatusConfig[s.status] : null
              const needsMakeup = s.status === 'missed' && !s.makeupSessionId
              return (
                <div key={s.id} className="py-1.5 first:pt-0 last:pb-0 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className={s.cancelled ? 'line-through text-muted-foreground' : ''}>
                      {fmtSessionDate(s.date)} · {fmtTime(s.startTime)}–{fmtTime(s.endTime)}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {s.cancelled && <Badge variant="neutral">Cancelled</Badge>}
                      {s.status === 'missed' && s.makeupSessionId && (
                        <span className="text-muted-foreground">Makeup scheduled</span>
                      )}
                      {config && <Badge variant={config.variant}>{config.label}</Badge>}
                    </div>
                  </div>
                  {s.location && <p className="text-muted-foreground truncate">{s.location}</p>}
                  {needsMakeup && (
                    <p className="text-destructive font-medium">Needs makeup</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <Button asChild variant="ghost" size="sm" className="w-full mt-1">
          <Link href={`/student/courses/${course.courseId}`}>View Course</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
