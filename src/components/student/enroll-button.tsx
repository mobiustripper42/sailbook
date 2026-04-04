'use client'

import { useTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import { enrollInCourse } from '@/app/(student)/student/courses/[id]/actions'

interface EnrollButtonProps {
  courseId: string
  disabled?: boolean
  disabledReason?: string
}

export default function EnrollButton({ courseId, disabled, disabledReason }: EnrollButtonProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleEnroll() {
    setError(null)
    startTransition(async () => {
      const result = await enrollInCourse(courseId)
      if (result?.error) setError(result.error)
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
        {pending ? 'Enrolling…' : 'Enroll in This Course'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
