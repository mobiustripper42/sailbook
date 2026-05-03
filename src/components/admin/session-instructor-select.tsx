'use client'

import { useState, useTransition } from 'react'
import { updateSessionInstructor } from '@/actions/sessions'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Instructor = { id: string; first_name: string; last_name: string }

const DEFAULT_SENTINEL = '__default__'

export default function SessionInstructorSelect({
  sessionId,
  courseId,
  instructorId,
  instructors,
}: {
  sessionId: string
  courseId: string
  instructorId: string | null
  instructors: Instructor[]
}) {
  const [value, setValue] = useState(instructorId ?? DEFAULT_SENTINEL)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleChange(next: string) {
    const prev = value
    setValue(next)
    setError(null)
    startTransition(async () => {
      const result = await updateSessionInstructor(
        sessionId,
        courseId,
        next === DEFAULT_SENTINEL ? null : next
      )
      if (result.error) {
        setValue(prev)
        setError(result.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <Select value={value} onValueChange={handleChange} disabled={pending}>
        <SelectTrigger size="sm" className="h-7 text-xs" aria-label="Session instructor">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={DEFAULT_SENTINEL}>Course default</SelectItem>
          {instructors.map((i) => (
            <SelectItem key={i.id} value={i.id}>
              {i.first_name} {i.last_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
