'use client'

import { useTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import { createCheckoutSession } from '@/app/(student)/student/courses/[id]/actions'

interface EnrollButtonProps {
  courseId: string
  disabled?: boolean
  disabledReason?: string
  label?: string
}

export default function EnrollButton({ courseId, disabled, disabledReason, label }: EnrollButtonProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleEnroll() {
    setError(null)
    startTransition(async () => {
      const result = await createCheckoutSession(courseId)
      if ('error' in result) {
        setError(result.error)
      } else {
        window.location.href = result.url
      }
    })
  }

  if (disabled) {
    return (
      <Button disabled className="w-full sm:w-auto">
        {disabledReason ?? 'Unavailable'}
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleEnroll} disabled={pending} className="w-full sm:w-auto">
        {pending ? 'Preparing checkout…' : (label ?? 'Register & Pay')}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
