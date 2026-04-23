'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { acceptInstructorInvite } from '@/actions/invites'

export default function AcceptInstructorInviteForm({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleAccept() {
    setError(null)
    startTransition(async () => {
      const result = await acceptInstructorInvite(token)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleAccept} disabled={pending}>
        {pending && <span className="mr-1 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />}
        Accept invitation
      </Button>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  )
}
