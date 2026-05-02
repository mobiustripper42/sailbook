'use client'

import { useTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import { createCheckoutSession } from '@/app/(student)/student/courses/[id]/actions'

interface EnrollButtonProps {
  courseId: string
  label?: string
}

export default function EnrollButton({ courseId, label }: EnrollButtonProps) {
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

  return (
    <div className="space-y-2">
      <Button onClick={handleEnroll} disabled={pending} className="w-full sm:w-auto">
        {pending ? 'Preparing checkout…' : (label ?? 'Register & Pay')}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
