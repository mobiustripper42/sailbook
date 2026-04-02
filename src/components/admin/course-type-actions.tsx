'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { toggleCourseTypeActive } from '@/actions/course-types'
import { Button } from '@/components/ui/button'

export default function CourseTypeActions({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(() => toggleCourseTypeActive(id, isActive))
  }

  return (
    <div className="flex gap-2">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/admin/course-types/${id}/edit`}>Edit</Link>
      </Button>
      <Button variant="ghost" size="sm" onClick={handleToggle} disabled={pending}>
        {isActive ? 'Deactivate' : 'Activate'}
      </Button>
    </div>
  )
}
