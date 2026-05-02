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

  const [name, setName] = useState(courseType?.name ?? '')
  const [shortCode, setShortCode] = useState(courseType?.short_code ?? '')
  const [certificationBody, setCertificationBody] = useState(courseType?.certification_body ?? '')
  const [maxStudents, setMaxStudents] = useState(String(courseType?.max_students ?? 4))
  const [minHours, setMinHours] = useState(String(courseType?.min_hours ?? ''))
  const [minimumEnrollment, setMinimumEnrollment] = useState(String(courseType?.minimum_enrollment ?? ''))
  const [lowEnrollmentLeadDays, setLowEnrollmentLeadDays] = useState(String(courseType?.low_enrollment_lead_days ?? 14))
  const [slug, setSlug] = useState(courseType?.slug ?? '')
  const [description, setDescription] = useState(courseType?.description ?? '')
  const [isDropIn, setIsDropIn] = useState(courseType?.is_drop_in ?? false)

  function handleChange() { setIsDirty(true) }

  return (
    <form action={formAction} className="space-y-4" onChange={handleChange}>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="ASA 101 - Basic Keelboat Sailing" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="short_code">Short Code</Label>
        <Input id="short_code" name="short_code" required value={shortCode} onChange={(e) => setShortCode(e.target.value)} placeholder="ASA101" className="uppercase" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="certification_body">Certification Body</Label>
        <Input id="certification_body" name="certification_body" value={certificationBody} onChange={(e) => setCertificationBody(e.target.value)} placeholder="ASA (leave blank if none)" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="max_students">Max Students</Label>
          <Input id="max_students" name="max_students" type="number" min={1} required value={maxStudents} onChange={(e) => setMaxStudents(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="min_hours">Min Hours</Label>
          <Input id="min_hours" name="min_hours" type="number" min={0} value={minHours} onChange={(e) => setMinHours(e.target.value)} placeholder="Optional" />
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
            value={minimumEnrollment}
            onChange={(e) => setMinimumEnrollment(e.target.value)}
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
            value={lowEnrollmentLeadDays}
            onChange={(e) => setLowEnrollmentLeadDays(e.target.value)}
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
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
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
        <Textarea id="description" name="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="is_drop_in"
          name="is_drop_in"
          value="true"
          checked={isDropIn}
          onChange={(e) => setIsDropIn(e.target.checked)}
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
