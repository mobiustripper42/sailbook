'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateSessionNotes } from '@/actions/sessions'

const NOTES_MAX = 2000

export default function SessionNotesForm({
  sessionId,
  initialNotes,
}: {
  sessionId: string
  initialNotes: string
}) {
  const action = updateSessionNotes.bind(null, sessionId)
  const [state, formAction, pending] = useActionState(action, null)

  const [value, setValue] = useState(initialNotes)

  const [hasSubmitted, setHasSubmitted] = useState(false)
  const prevPending = useRef(false)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (prevPending.current && !pending) setHasSubmitted(true)
    prevPending.current = pending
  }, [pending])

  const showSuccess = hasSubmitted && state === null && !pending

  const remaining = NOTES_MAX - value.length

  return (
    <form action={formAction} className="space-y-3">
      {state && <p className="text-sm text-destructive">{state}</p>}
      {showSuccess && <p className="text-sm text-primary">Notes saved.</p>}

      <div className="space-y-2">
        <Label htmlFor="notes" className="sr-only">
          Session notes
        </Label>
        <Textarea
          id="notes"
          name="notes"
          rows={6}
          maxLength={NOTES_MAX}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="What happened, who did well, what to revisit next time…"
        />
        <p className="text-xs text-muted-foreground text-right">
          {remaining} characters remaining
        </p>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save notes'}
      </Button>
    </form>
  )
}
