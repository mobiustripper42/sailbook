'use client'

import { useTransition } from 'react'
import { cancelCourse } from '@/actions/courses'
import { Button } from '@/components/ui/button'

export default function CourseStatusActions({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition()

  if (status !== 'active') return null

  function handleCancel() {
    if (!confirm('Cancel this course? This cannot be undone easily.')) return
    startTransition(() => cancelCourse(id))
  }

  return (
    <Button variant="outline" onClick={handleCancel} disabled={pending}>
      {pending ? 'Cancelling…' : 'Cancel Course'}
    </Button>
  )
}
