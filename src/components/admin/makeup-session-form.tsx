'use client'

import { useActionState, useState } from 'react'
import { createMakeupSession } from '@/actions/sessions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function MakeupSessionForm({
  originalSessionId,
  courseId,
  defaultStartTime,
  defaultEndTime,
  defaultLocation,
  missedCount,
  linkedCount,
}: {
  originalSessionId: string
  courseId: string
  defaultStartTime: string
  defaultEndTime: string
  defaultLocation: string | null
  missedCount: number
  linkedCount: number
}) {
  const action = createMakeupSession.bind(null, originalSessionId, courseId)
  const [error, formAction, pending] = useActionState(action, null)
  const [open, setOpen] = useState(false)

  const unlinked = missedCount - linkedCount
  const allLinked = missedCount > 0 && unlinked === 0

  if (!open) {
    return (
      <div className="flex items-center gap-3">
        {allLinked ? (
          <span className="text-sm text-muted-foreground">
            Makeup scheduled ({linkedCount} student{linkedCount !== 1 ? 's' : ''})
          </span>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
            Schedule Makeup{unlinked > 0 ? ` (${unlinked} student${unlinked !== 1 ? 's' : ''})` : ''}
          </Button>
        )}
        {linkedCount > 0 && !allLinked && (
          <span className="text-xs text-muted-foreground">
            {linkedCount} already assigned
          </span>
        )}
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-3 border rounded-md p-4 bg-background">
      <p className="text-sm font-medium">
        Schedule Makeup Session
        {unlinked > 0 && <span className="font-normal text-muted-foreground"> — {unlinked} student{unlinked !== 1 ? 's' : ''} need makeup</span>}
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Date</Label>
          <Input type="date" name="date" required />
        </div>
        <div className="space-y-1.5">
          <Label>Start</Label>
          <Input type="time" name="start_time" required defaultValue={defaultStartTime} />
        </div>
        <div className="space-y-1.5">
          <Label>End</Label>
          <Input type="time" name="end_time" required defaultValue={defaultEndTime} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Location</Label>
        <Input name="location" placeholder="e.g. Dock A, Edgewater" defaultValue={defaultLocation ?? ''} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Creating…' : 'Create Makeup'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
