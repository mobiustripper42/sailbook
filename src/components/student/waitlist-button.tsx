'use client'

import { useTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { joinWaitlist, leaveWaitlist } from '@/actions/waitlist'

interface WaitlistButtonProps {
  courseId: string
  isOnWaitlist: boolean
  position: number | null
}

export default function WaitlistButton({ courseId, isOnWaitlist, position }: WaitlistButtonProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleJoin() {
    setError(null)
    startTransition(async () => {
      const result = await joinWaitlist(courseId)
      if (result.error) setError(result.error)
    })
  }

  function handleLeave() {
    setError(null)
    startTransition(async () => {
      const result = await leaveWaitlist(courseId)
      if (result.error) setError(result.error)
    })
  }

  if (isOnWaitlist) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="neutral">
            On waitlist{position != null ? ` — #${position}` : ''}
          </Badge>
          <span className="text-sm text-muted-foreground">
            We&apos;ll notify you by SMS and email if a spot opens.
          </span>
        </div>
        <Button
          variant="ghost"
          onClick={handleLeave}
          disabled={pending}
          className="w-full sm:w-auto"
        >
          {pending ? 'Removing…' : 'Leave waitlist'}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleJoin} disabled={pending} className="w-full sm:w-auto">
        {pending ? 'Joining…' : 'Join waitlist'}
      </Button>
      <p className="text-sm text-muted-foreground">
        Course is full. Join the waitlist and we&apos;ll notify you if a spot opens.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
