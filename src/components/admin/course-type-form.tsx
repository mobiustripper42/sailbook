'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCourseType, updateCourseType } from '@/actions/course-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'
import type { Tables } from '@/lib/supabase/types'

type CourseType = Tables<'course_types'>

type Props = {
  courseType?: CourseType
}

export default function CourseTypeForm({ courseType }: Props) {
  const router = useRouter()
  const action = courseType
    ? updateCourseType.bind(null, courseType.id)
    : createCourseType

  const [error, formAction, pending] = useActionState(action, null)
  const [isDirty, setIsDirty] = useState(false)
  const { confirmDiscard } = useUnsavedChanges(isDirty)

  return (
    <form action={formAction} className="space-y-4" onChange={() => setIsDirty(true)}>
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minimum_enrollment">Minimum Enrollment</Label>
          <Input
            id="minimum_enrollment"
            name="minimum_enrollment"
            type="number"
            min={0}
            defaultValue={courseType?.minimum_enrollment ?? ''}
            placeholder="Leave blank to skip"
          />
          <p className="text-xs text-muted-foreground">
            Below this, the course is flagged on the dashboard and admins receive a daily alert.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="low_enrollment_lead_days">Low Enrollment Lead Days</Label>
          <Input
            id="low_enrollment_lead_days"
            name="low_enrollment_lead_days"
            type="number"
            min={0}
            required
            defaultValue={courseType?.low_enrollment_lead_days ?? 14}
          />
          <p className="text-xs text-muted-foreground">
            How far ahead of the first session to start flagging.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Public URL Slug</Label>
        <div className="flex items-center gap-0">
          <span className="text-sm text-muted-foreground bg-muted border border-r-0 rounded-l-xs px-2 py-1.5 h-9 flex items-center">/courses/</span>
          <Input
            id="slug"
            name="slug"
            required
            defaultValue={courseType?.slug ?? ''}
            placeholder="asa101"
            className="rounded-l-none"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Lowercase letters, numbers, hyphens only. Used in the public LTSC link.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={3} defaultValue={courseType?.description ?? ''} />
      </div>

      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="is_drop_in"
          name="is_drop_in"
          value="true"
          defaultChecked={courseType?.is_drop_in ?? false}
          className="mt-0.5"
        />
        <div>
          <Label htmlFor="is_drop_in" className="font-medium">Drop-in / per-session enrollment</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Students pay to hold a single session spot. Remaining balance is paid on the day.
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : courseType ? 'Save Changes' : 'Create'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => { if (confirmDiscard()) router.push('/admin/course-types') }}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
