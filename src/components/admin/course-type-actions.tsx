'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { toggleCourseTypeActive } from '@/actions/course-types'
import { Button } from '@/components/ui/button'

export default function CourseTypeActions({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleToggle() {
    setError(null)
    startTransition(async () => {
      const result = await toggleCourseTypeActive(id, isActive)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/course-types/${id}/edit`}>Edit</Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={handleToggle} disabled={pending}>
          {isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
