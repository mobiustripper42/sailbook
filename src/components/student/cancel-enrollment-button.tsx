'use client'

import { useTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { requestCancellation } from '@/actions/enrollments'

interface CancelEnrollmentButtonProps {
  enrollmentId: string
  courseId: string
}

export default function CancelEnrollmentButton({ enrollmentId, courseId }: CancelEnrollmentButtonProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      const result = await requestCancellation(enrollmentId, courseId)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="space-y-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" disabled={pending} className="w-full sm:w-auto">
            {pending ? 'Submitting…' : 'Request Cancellation'}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request cancellation?</AlertDialogTitle>
            <AlertDialogDescription>
              Your cancellation request will be reviewed by the school. Refunds are processed manually — you&apos;ll be contacted once it&apos;s approved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep enrollment</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Yes, request cancellation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
