'use client'

import { useState, useTransition } from 'react'
import { cancelSession, deleteSession } from '@/actions/sessions'
import { Button } from '@/components/ui/button'

export default function SessionActions({
  sessionId,
  courseId,
  status,
}: {
  sessionId: string
  courseId: string
  status: 'scheduled' | 'completed' | 'cancelled'
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleCancel() {
    const reason = prompt('Cancel reason (e.g., weather, instructor unavailable):')
    if (reason === null) return // user hit Cancel on the prompt
    setError(null)
    startTransition(async () => {
      const result = await cancelSession(sessionId, courseId, reason)
      if (result.error) setError(result.error)
    })
  }

  function handleDelete() {
    if (!confirm('Delete this session? This cannot be undone.')) return
    setError(null)
    startTransition(async () => {
      const result = await deleteSession(sessionId, courseId)
      if (result.error) setError(result.error)
    })
  }

  const isCancelled = status === 'cancelled'

  return (
    <div className="flex gap-1">
      {!isCancelled && (
        <Button variant="ghost" size="sm" onClick={handleCancel} disabled={pending}>
          {pending ? '…' : 'Cancel'}
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={handleDelete} disabled={pending}>
        {pending ? '…' : 'Delete'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
