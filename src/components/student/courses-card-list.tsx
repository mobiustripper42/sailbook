import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export type CourseSession = {
  id: string
  date: string
  start_time: string
  end_time: string
  location: string | null
}

export type CourseCardData = {
  id: string
  title: string | null
  typeName: string | null
  typeShortCode: string | null
  typeDescription: string | null
  instructorName: string | null
  capacity: number
  price: number | null
  sessionDates: string[]
  sessions: CourseSession[]
  myStatus: string | null
  myHoldExpiresAt: string | null  // For pending_payment rows; null otherwise
  spotsRemaining: number
  isFull: boolean
}

function formatDateRange(dates: string[]): string {
  if (dates.length === 0) return 'No sessions scheduled'
  const sorted = [...dates].sort()
  const fmt = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (sorted.length === 1) return fmt(sorted[0])
  return `${fmt(sorted[0])} – ${fmt(sorted[sorted.length - 1])}`
}

function enrollmentStatusLabel(status: string): string {
  if (status === 'registered') return 'Pending confirmation'
  if (status === 'confirmed') return 'Enrolled'
  if (status === 'cancelled') return 'Cancelled'
  if (status === 'completed') return 'Completed'
  if (status === 'cancel_requested') return 'Cancellation Requested'
  if (status === 'pending_payment') return 'Payment Pending'
  return status
}

// pending_payment with expired hold = stale enrollment that's still in the DB
// because the daily expire-holds cron hasn't swept it yet. Treat as not-enrolled
// so the user sees a normal Pay & Register path matching what the detail page
// already shows.
function isEffectivelyEnrolled(status: string | null, holdExpiresAt: string | null): boolean {
  if (status === null) return false
  if (status === 'pending_payment') {
    if (!holdExpiresAt) return false
    return new Date(holdExpiresAt) > new Date()
  }
  return true
}

export function CoursesCardList({ courses }: { courses: CourseCardData[] }) {
  if (courses.length === 0) {
    return <EmptyState message="No courses are available right now. Check back soon." />
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((c) => {
        const isEnrolled = isEffectivelyEnrolled(c.myStatus, c.myHoldExpiresAt)
        const displayTitle = c.title ?? c.typeName ?? '—'

        return (
          <Card key={c.id} size="sm" className="flex flex-col" data-testid="course-card">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base leading-snug">{displayTitle}</CardTitle>
                {isEnrolled ? (
                  <Badge
                    variant={
                      c.myStatus === 'confirmed'
                        ? 'ok'
                        : c.myStatus === 'cancel_requested' || c.myStatus === 'pending_payment'
                          ? 'warn'
                          : 'neutral'
                    }
                    className="shrink-0"
                  >
                    {enrollmentStatusLabel(c.myStatus!)}
                  </Badge>
                ) : c.isFull ? (
                  <Badge variant="neutral" className="shrink-0">
                    Full
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {c.spotsRemaining} spot{c.spotsRemaining !== 1 ? 's' : ''} left
                  </span>
                )}
              </div>
              {c.title && c.typeName && <CardDescription>{c.typeName}</CardDescription>}
            </CardHeader>
            <CardContent className="flex-1 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{c.sessionDates.length === 1 ? 'Date' : 'Dates'}</span>
                <span className="text-foreground font-medium">
                  {formatDateRange(c.sessionDates)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Sessions</span>
                <span className="text-foreground">{c.sessionDates.length}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Instructor</span>
                <span className="text-foreground">{c.instructorName ?? '—'}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Price</span>
                <span className="text-foreground font-medium">
                  {c.price != null ? `$${c.price}` : '—'}
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant={!isEnrolled && c.isFull ? 'outline' : 'default'}>
                <Link href={`/student/courses/${c.id}`}>
                  {isEnrolled
                    ? 'View'
                    : c.isFull
                      ? 'Join waitlist'
                      : 'View & Enroll'}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
