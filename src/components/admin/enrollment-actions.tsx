'use client'

import { useTransition } from 'react'
import { confirmEnrollment, cancelEnrollment } from '@/actions/enrollments'
import { Button } from '@/components/ui/button'

type Props = {
  enrollmentId: string
  courseId: string
  status: string
}

export default function EnrollmentActions({ enrollmentId, courseId, status }: Props) {
  const [pending, startTransition] = useTransition()

  if (status === 'cancelled' || status === 'completed') return null

  return (
    <div className="flex gap-2">
      {status === 'registered' && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => startTransition(() => confirmEnrollment(enrollmentId, courseId))}
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
          startTransition(() => cancelEnrollment(enrollmentId, courseId))
        }}
      >
        {pending ? '…' : 'Cancel'}
      </Button>
    </div>
  )
}
