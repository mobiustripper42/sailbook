'use client'

import { useState, useTransition } from 'react'
import { publishCourse, completeCourse, cancelCourse } from '@/actions/courses'
import { Button } from '@/components/ui/button'

export default function CourseStatusActions({ id, status }: { id: string; status: string }) {
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
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {status === 'draft' && (
          <Button onClick={() => handle(() => publishCourse(id))} disabled={pending}>
            {pending ? 'Publishing…' : 'Publish'}
          </Button>
        )}
        {status === 'active' && (
          <Button variant="outline" onClick={() => {
            if (!confirm('Mark this course as completed?')) return
            handle(() => completeCourse(id))
          }} disabled={pending}>
            {pending ? '…' : 'Mark Completed'}
          </Button>
        )}
        {status !== 'cancelled' && (
          <Button variant="outline" onClick={() => {
            if (!confirm('Cancel this course? This cannot be undone easily.')) return
            handle(() => cancelCourse(id))
          }} disabled={pending}>
            {pending ? '…' : 'Cancel Course'}
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
