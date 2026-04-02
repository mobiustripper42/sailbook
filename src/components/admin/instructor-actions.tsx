'use client'

import { useTransition } from 'react'
import { toggleInstructorActive } from '@/actions/instructors'
import { Button } from '@/components/ui/button'

export default function InstructorActions({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(() => toggleInstructorActive(id, isActive))
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleToggle} disabled={pending}>
      {isActive ? 'Deactivate' : 'Activate'}
    </Button>
  )
}
