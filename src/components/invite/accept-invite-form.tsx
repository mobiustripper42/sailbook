'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { acceptInvite } from '@/actions/invites'

type Role = 'instructor' | 'admin'

export default function AcceptInviteForm({ role, token }: { role: Role; token: string }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleAccept() {
    setError(null)
    startTransition(async () => {
      const result = await acceptInvite(role, token)
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
