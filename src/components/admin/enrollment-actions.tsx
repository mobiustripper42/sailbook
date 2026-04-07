'use client'

import { useState, useTransition } from 'react'
import { confirmEnrollment, cancelEnrollment } from '@/actions/enrollments'
import { Button } from '@/components/ui/button'

type Props = {
  enrollmentId: string
  courseId: string
  status: string
}

export default function EnrollmentActions({ enrollmentId, courseId, status }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (status === 'cancelled' || status === 'completed') return null

  function handle(action: () => Promise<{ error: string | null }>) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        {status === 'registered' && (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => handle(() => confirmEnrollment(enrollmentId, courseId))}
          >
            {pending ? '…' : 'Confirm'}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => {
            if (!confirm('Cancel this enrollment?')) return
            handle(() => cancelEnrollment(enrollmentId, courseId))
          }}
        >
          {pending ? '…' : 'Cancel'}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
