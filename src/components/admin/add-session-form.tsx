'use client'

import { useActionState, useState } from 'react'
import { addSession } from '@/actions/sessions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AddSessionForm({ courseId }: { courseId: string }) {
  const action = addSession.bind(null, courseId)
  const [error, formAction, pending] = useActionState(action, null)
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        + Add Session
      </Button>
    )
  }

  return (
    <form action={formAction} className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Date</Label>
          <Input type="date" name="date" required />
        </div>
        <div className="space-y-1.5">
          <Label>Start</Label>
          <Input type="time" name="start_time" required defaultValue="08:00" />
        </div>
        <div className="space-y-1.5">
          <Label>End</Label>
          <Input type="time" name="end_time" required defaultValue="16:00" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Location</Label>
        <Input name="location" placeholder="e.g. Dock A, Edgewater" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Adding…' : 'Add Session'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
