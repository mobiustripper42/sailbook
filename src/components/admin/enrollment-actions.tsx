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
  const [optimisticStatus, setOptimisticStatus] = useState(status)
  const [error, setError] = useState<string | null>(null)

  if (optimisticStatus === 'cancelled' || optimisticStatus === 'completed') return null

  function handle(nextStatus: string, action: () => Promise<{ error: string | null }>) {
    const prevStatus = optimisticStatus
    setError(null)
    setOptimisticStatus(nextStatus)
    startTransition(async () => {
      try {
        const result = await action()
        if (result.error) {
          setOptimisticStatus(prevStatus)
          setError(result.error)
        }
      } catch {
        setOptimisticStatus(prevStatus)
        setError('Network error — please try again.')
      }
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        {optimisticStatus === 'registered' && (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => handle('confirmed', () => confirmEnrollment(enrollmentId, courseId))}
          >
            {pending
              ? <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              : 'Confirm'}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => {
            if (!confirm('Cancel this enrollment?')) return
            handle('cancelled', () => cancelEnrollment(enrollmentId, courseId))
          }}
        >
          {pending
            ? <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            : 'Cancel'}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
