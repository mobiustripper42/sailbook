'use client'

import { Fragment, useState, useTransition } from 'react'
import Link from 'next/link'
import { fmtTime } from '@/lib/utils'
import { updateSession } from '@/actions/sessions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { TableRow, TableCell } from '@/components/ui/table'
import SessionInstructorSelect from '@/components/admin/session-instructor-select'
import SessionActions from '@/components/admin/session-actions'
import MakeupSessionForm from '@/components/admin/makeup-session-form'

type SessionData = {
  id: string
  date: string
  start_time: string
  end_time: string
  location: string | null
  instructor_id: string | null
  status: 'scheduled' | 'completed' | 'cancelled'
  cancel_reason: string | null
  instructor: { first_name: string; last_name: string } | null
}

type InstructorOption = { id: string; first_name: string; last_name: string }

export default function SessionRow({
  session,
  courseId,
  instructors,
  missedCount,
  linkedCount,
}: {
  session: SessionData
  courseId: string
  instructors: InstructorOption[]
  missedCount: number
  linkedCount: number
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const isCancelled = session.status === 'cancelled'

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await updateSession(session.id, courseId, formData)
      if (result === null) {
        setIsEditing(false)
      } else {
        setError(result)
      }
    })
  }

  return (
    <Fragment>
      <TableRow>
        <TableCell>
          {new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </TableCell>
        <TableCell className="whitespace-nowrap">
          {fmtTime(session.start_time)} – {fmtTime(session.end_time)}
        </TableCell>
        <TableCell>{session.location ?? '—'}</TableCell>
        <TableCell>
          <SessionInstructorSelect
            sessionId={session.id}
            courseId={courseId}
            instructorId={session.instructor_id}
            instructors={instructors}
          />
        </TableCell>
        <TableCell>
          <Badge
            variant={
              session.status === 'scheduled'
                ? 'default'
                : isCancelled
                ? 'destructive'
                : 'secondary'
            }
            title={isCancelled && session.cancel_reason ? session.cancel_reason : undefined}
          >
            {session.status}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex gap-1 flex-wrap">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/courses/${courseId}/sessions/${session.id}/attendance`}>
                Attendance
              </Link>
            </Button>
            {!isCancelled && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing((v) => !v)
                  setError(null)
                }}
              >
                {isEditing ? 'Close' : 'Edit'}
              </Button>
            )}
            <SessionActions sessionId={session.id} courseId={courseId} status={session.status} />
          </div>
        </TableCell>
      </TableRow>

      {isEditing && (
        <TableRow>
          <TableCell colSpan={6} className="bg-muted/30">
            <form onSubmit={handleSubmit} className="space-y-3 py-2">
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    name="date"
                    required
                    defaultValue={session.date}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Start</Label>
                  <Input
                    type="time"
                    name="start_time"
                    required
                    defaultValue={session.start_time.slice(0, 5)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>End</Label>
                  <Input
                    type="time"
                    name="end_time"
                    required
                    defaultValue={session.end_time.slice(0, 5)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input
                  name="location"
                  defaultValue={session.location ?? ''}
                  placeholder="e.g. Dock A, Edgewater"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={pending}>
                  {pending ? 'Saving…' : 'Save'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false)
                    setError(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </TableCell>
        </TableRow>
      )}

      {isCancelled && (
        <TableRow>
          <TableCell colSpan={6} className="bg-muted/30">
            <MakeupSessionForm
              originalSessionId={session.id}
              courseId={courseId}
              defaultStartTime={session.start_time}
              defaultEndTime={session.end_time}
              defaultLocation={session.location}
              missedCount={missedCount}
              linkedCount={linkedCount}
            />
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  )
}
