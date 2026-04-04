'use client'

import { useState, useTransition } from 'react'
import { toggleInstructorActive } from '@/actions/instructors'
import { Button } from '@/components/ui/button'

export default function InstructorActions({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleToggle() {
    setError(null)
    startTransition(async () => {
      const result = await toggleInstructorActive(id, isActive)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={handleToggle} disabled={pending}>
        {isActive ? 'Deactivate' : 'Activate'}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
