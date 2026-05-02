'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toggleInstructorActive } from '@/actions/instructors'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Props = {
  id: string
  editHref: string
  isStudent: boolean
  isInstructor: boolean
  isActive: boolean
}

export default function UserRowActions({ id, editHref, isStudent, isInstructor, isActive }: Props) {
  const [pending, startTransition] = useTransition()
  const [optimisticActive, setOptimisticActive] = useState(isActive)
  const [error, setError] = useState<string | null>(null)

  function handleInstructorToggle() {
    const prev = optimisticActive
    if (prev && !window.confirm('Deactivating this instructor will remove them from all assigned courses and sessions. Continue?')) return
    setError(null)
    setOptimisticActive(!prev)
    startTransition(async () => {
      try {
        const result = await toggleInstructorActive(id, prev)
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
    <div className="flex flex-col items-end gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={pending} aria-label="User actions">
            •••
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={editHref}>Edit</Link>
          </DropdownMenuItem>
          {isStudent && (
            <DropdownMenuItem asChild>
              <Link href={`/admin/students/${id}`}>Experience</Link>
            </DropdownMenuItem>
          )}
          {isInstructor && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleInstructorToggle}>
                {optimisticActive ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
