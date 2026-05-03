'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addPrerequisite, removePrerequisite } from '@/actions/course-types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type CourseTypeOption = {
  id: string
  name: string
  short_code: string
}

type Prerequisite = {
  id: string
  required_course_type_id: string
  required: { name: string; short_code: string } | null
}

type Props = {
  courseTypeId: string
  prerequisites: Prerequisite[]
  candidates: CourseTypeOption[]
}

export default function CourseTypePrerequisites({
  courseTypeId,
  prerequisites,
  candidates,
}: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const existingIds = new Set(prerequisites.map((p) => p.required_course_type_id))
  const available = candidates.filter((c) => c.id !== courseTypeId && !existingIds.has(c.id))

  function handleAdd() {
    if (!selected) return
    setError(null)
    startTransition(async () => {
      const result = await addPrerequisite(courseTypeId, selected)
      if (result.error) {
        setError(result.error)
      } else {
        setSelected('')
        router.refresh()
      }
    })
  }

  function handleRemove(prereqId: string) {
    setError(null)
    startTransition(async () => {
      const result = await removePrerequisite(prereqId, courseTypeId)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-medium">Prerequisites</h2>
        <p className="text-xs text-muted-foreground">
          Students enrolling without these on record see a flag — enrollment is not blocked.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {prerequisites.length === 0 ? (
        <p className="text-sm text-muted-foreground">No prerequisites set.</p>
      ) : (
        <ul className="space-y-2">
          {prerequisites.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-xs border bg-card px-3 py-2"
            >
              <div className="flex items-center gap-2">
                {p.required && <Badge variant="neutral">{p.required.short_code}</Badge>}
                <span className="text-sm">{p.required?.name ?? 'Unknown course type'}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(p.id)}
                disabled={pending}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      {available.length > 0 && (
        <div className="flex items-center gap-2">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Add a prerequisite…" />
            </SelectTrigger>
            <SelectContent>
              {available.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.short_code} — {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} disabled={!selected || pending}>
            {pending ? 'Adding…' : 'Add'}
          </Button>
        </div>
      )}
    </div>
  )
}
