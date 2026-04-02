'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { createCourseType, updateCourseType } from '@/actions/course-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { CourseType } from '@/lib/supabase/types'

type Props = {
  courseType?: CourseType
}

export default function CourseTypeForm({ courseType }: Props) {
  const action = courseType
    ? updateCourseType.bind(null, courseType.id)
    : createCourseType

  const [error, formAction, pending] = useActionState(action, null)

  return (
    <form action={formAction} className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required defaultValue={courseType?.name} placeholder="ASA 101 - Basic Keelboat Sailing" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="short_code">Short Code</Label>
        <Input id="short_code" name="short_code" required defaultValue={courseType?.short_code} placeholder="ASA101" className="uppercase" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="certification_body">Certification Body</Label>
        <Input id="certification_body" name="certification_body" defaultValue={courseType?.certification_body ?? ''} placeholder="ASA (leave blank if none)" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="max_students">Max Students</Label>
          <Input id="max_students" name="max_students" type="number" min={1} required defaultValue={courseType?.max_students ?? 4} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="min_hours">Min Hours</Label>
          <Input id="min_hours" name="min_hours" type="number" min={0} defaultValue={courseType?.min_hours ?? ''} placeholder="Optional" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={3} defaultValue={courseType?.description ?? ''} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : courseType ? 'Save Changes' : 'Create'}
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/admin/course-types">Cancel</Link>
        </Button>
      </div>
    </form>
  )
}
