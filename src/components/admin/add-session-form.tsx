'use client'

import { useActionState, useState } from 'react'
import { addSession } from '@/actions/sessions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import TimeSelect from '@/components/ui/time-select'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'

export default function AddSessionForm({ courseId }: { courseId: string }) {
  const action = addSession.bind(null, courseId)
  const [error, formAction, pending] = useActionState(action, null)
  const [open, setOpen] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const { confirmDiscard } = useUnsavedChanges(isDirty && open)
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('16:00')
  const [location, setLocation] = useState('')

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        + Add Session
      </Button>
    )
  }

  return (
    <form action={formAction} className="space-y-3" onChange={() => setIsDirty(true)}>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Date</Label>
          <Input type="date" name="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Start</Label>
          <TimeSelect name="start_time" value={startTime} onChange={setStartTime} required />
        </div>
        <div className="space-y-1.5">
          <Label>End</Label>
          <TimeSelect name="end_time" value={endTime} onChange={setEndTime} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Location</Label>
        <Input name="location" placeholder="e.g. Dock A, Edgewater" value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Adding…' : 'Add Session'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => { if (confirmDiscard()) { setOpen(false); setIsDirty(false) } }}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
