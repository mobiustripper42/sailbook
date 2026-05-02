'use client'

import { useState, useTransition } from 'react'
import { publishCourse, completeCourse, cancelCourse, revertToDraft } from '@/actions/courses'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
    <div className="flex flex-col items-end gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={pending} aria-label="Course actions">
            •••
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {status === 'draft' && (
            <DropdownMenuItem onSelect={() => handle(() => publishCourse(id))}>
              Publish
            </DropdownMenuItem>
          )}
          {status === 'active' && (
            <>
              <DropdownMenuItem
                onSelect={() => {
                  if (!window.confirm('Revert this course to Draft? It will no longer be visible to students.')) return
                  handle(() => revertToDraft(id))
                }}
              >
                Revert to Draft
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  if (!window.confirm('Mark this course as completed?')) return
                  handle(() => completeCourse(id))
                }}
              >
                Mark Completed
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => {
              if (!window.confirm('Cancel this course? This cannot be undone easily.')) return
              handle(() => cancelCourse(id))
            }}
          >
            Cancel Course
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
