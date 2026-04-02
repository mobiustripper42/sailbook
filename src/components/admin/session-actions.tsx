'use client'

import { useTransition } from 'react'
import { deleteSession } from '@/actions/sessions'
import { Button } from '@/components/ui/button'

export default function SessionActions({ sessionId, courseId }: { sessionId: string; courseId: string }) {
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('Delete this session?')) return
    startTransition(() => deleteSession(sessionId, courseId))
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete} disabled={pending}>
      {pending ? '…' : 'Delete'}
    </Button>
  )
}
