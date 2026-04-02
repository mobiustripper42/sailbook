'use client'

import { useTransition } from 'react'
import { publishCourse, completeCourse, cancelCourse } from '@/actions/courses'
import { Button } from '@/components/ui/button'

export default function CourseStatusActions({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition()

  if (status === 'cancelled' || status === 'completed') return null

  function handlePublish() {
    startTransition(() => publishCourse(id))
  }

  function handleComplete() {
    if (!confirm('Mark this course as completed?')) return
    startTransition(() => completeCourse(id))
  }

  function handleCancel() {
    if (!confirm('Cancel this course? This cannot be undone easily.')) return
    startTransition(() => cancelCourse(id))
  }

  return (
    <div className="flex gap-2">
      {status === 'draft' && (
        <Button onClick={handlePublish} disabled={pending}>
          {pending ? 'Publishing…' : 'Publish'}
        </Button>
      )}
      {status === 'active' && (
        <Button variant="outline" onClick={handleComplete} disabled={pending}>
          {pending ? '…' : 'Mark Completed'}
        </Button>
      )}
      {status !== 'cancelled' && (
        <Button variant="outline" onClick={handleCancel} disabled={pending}>
          {pending ? '…' : 'Cancel Course'}
        </Button>
      )}
    </div>
  )
}
