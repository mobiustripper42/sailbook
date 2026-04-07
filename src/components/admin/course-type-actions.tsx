'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { toggleCourseTypeActive } from '@/actions/course-types'
import { Button } from '@/components/ui/button'

export default function CourseTypeActions({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition()
  const [optimisticActive, setOptimisticActive] = useState(isActive)
  const [error, setError] = useState<string | null>(null)

  function handleToggle() {
    const prev = optimisticActive
    setError(null)
    setOptimisticActive(!optimisticActive)
    startTransition(async () => {
      try {
        const result = await toggleCourseTypeActive(id, prev)
        if (result.error) {
          setOptimisticActive(prev)
          setError(result.error)
        }
      } catch {
        setOptimisticActive(prev)
        setError('Network error — please try again.')
      }
    })
  }

  return (
    <div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/course-types/${id}/edit`}>Edit</Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={handleToggle} disabled={pending}>
          {pending && <span className="mr-1 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />}
          {optimisticActive ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
