'use client'

import { Fragment, useState, useTransition } from 'react'
import Link from 'next/link'
import { fmtTime } from '@/lib/utils'
import { updateSession, cancelSession, deleteSession } from '@/actions/sessions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { TableRow, TableCell } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import SessionInstructorSelect from '@/components/admin/session-instructor-select'
import MakeupSessionForm from '@/components/admin/makeup-session-form'
import TimeSelect from '@/components/admin/time-select'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'

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
  const [editError, setEditError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [pending, startTransition] = useTransition()
  const [editStartTime, setEditStartTime] = useState('')
  const [editEndTime, setEditEndTime] = useState('')
  const isCancelled = session.status === 'cancelled'
  const { confirmDiscard } = useUnsavedChanges(isDirty)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setEditError(null)
    startTransition(async () => {
      const result = await updateSession(session.id, courseId, formData)
      if (result === null) {
        setIsEditing(false)
        setIsDirty(false)
      } else {
        setEditError(result)
      }
    })
  }

  function handleCancel() {
    const reason = prompt('Cancel reason (e.g., weather, instructor unavailable):')
    if (reason === null) return
    setActionError(null)
    startTransition(async () => {
      const result = await cancelSession(session.id, courseId, reason)
      if (result.error) setActionError(result.error)
    })
  }

  function handleDelete() {
    if (!window.confirm('Delete this session? This cannot be undone.')) return
    setActionError(null)
    startTransition(async () => {
      const result = await deleteSession(session.id, courseId)
      if (result.error) setActionError(result.error)
    })
  }

  return (
    <Fragment>
      <TableRow data-session-id={session.id}>
        <TableCell>
          {new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </TableCell>
        <TableCell className="whitespace-nowrap hidden sm:table-cell">
          {fmtTime(session.start_time)} – {fmtTime(session.end_time)}
        </TableCell>
        <TableCell className="hidden md:table-cell">{session.location ?? '—'}</TableCell>
        <TableCell className="hidden sm:table-cell">
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
                ? 'ok'
                : isCancelled
                ? 'alert'
                : 'neutral'
            }
            title={isCancelled && session.cancel_reason ? session.cancel_reason : undefined}
          >
            {session.status}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" disabled={pending} aria-label="Session actions">
                  •••
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isCancelled && (
                  <DropdownMenuItem
                    onSelect={() => {
                      if (isEditing && !confirmDiscard()) return
                      setIsEditing((v) => {
                        if (!v) {
                          setEditStartTime(session.start_time.slice(0, 5))
                          setEditEndTime(session.end_time.slice(0, 5))
                        }
                        return !v
                      })
                      setEditError(null)
                      setIsDirty(false)
                    }}
                  >
                    {isEditing ? 'Close' : 'Edit'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href={`/admin/courses/${courseId}/sessions/${session.id}/attendance`}>
                    Attendance
                  </Link>
                </DropdownMenuItem>
                {!isCancelled && (
                  <DropdownMenuItem onSelect={handleCancel}>
                    Cancel session
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={handleDelete}
                  variant="destructive"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {actionError && <p className="text-xs text-destructive">{actionError}</p>}
          </div>
        </TableCell>
      </TableRow>

      {isEditing && (
        <TableRow>
          <TableCell colSpan={6} className="bg-muted/30">
            <form onSubmit={handleSubmit} className="space-y-3 py-2" onChange={() => setIsDirty(true)}>
              {editError && <p className="text-sm text-destructive">{editError}</p>}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                  <TimeSelect
                    name="start_time"
                    value={editStartTime}
                    onChange={(v) => { setEditStartTime(v); setIsDirty(true) }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>End</Label>
                  <TimeSelect
                    name="end_time"
                    value={editEndTime}
                    onChange={(v) => { setEditEndTime(v); setIsDirty(true) }}
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
                    if (!confirmDiscard()) return
                    setIsEditing(false)
                    setEditError(null)
                    setIsDirty(false)
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
