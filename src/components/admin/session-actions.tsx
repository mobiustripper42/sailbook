'use client'

import { useState, useTransition } from 'react'
import { deleteSession } from '@/actions/sessions'
import { Button } from '@/components/ui/button'

export default function SessionActions({ sessionId, courseId }: { sessionId: string; courseId: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    if (!confirm('Delete this session?')) return
    setError(null)
    startTransition(async () => {
      const result = await deleteSession(sessionId, courseId)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={handleDelete} disabled={pending}>
        {pending ? '…' : 'Delete'}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
