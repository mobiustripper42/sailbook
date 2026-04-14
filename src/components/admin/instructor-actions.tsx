'use client'

import { useState, useTransition } from 'react'
import { toggleInstructorActive } from '@/actions/instructors'
import { Button } from '@/components/ui/button'

export default function InstructorActions({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition()
  const [optimisticActive, setOptimisticActive] = useState(isActive)
  const [error, setError] = useState<string | null>(null)

  function handleToggle() {
    const prev = optimisticActive
    if (prev && !window.confirm('Deactivating this instructor will remove them from all assigned courses and sessions. Continue?')) return
    setError(null)
    setOptimisticActive(!optimisticActive)
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
    <div>
      <Button variant="ghost" size="sm" onClick={handleToggle} disabled={pending}>
        {pending && <span className="mr-1 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />}
        {optimisticActive ? 'Deactivate' : 'Activate'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
