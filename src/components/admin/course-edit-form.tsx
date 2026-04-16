'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateCourse } from '@/actions/courses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'
import type { Tables } from '@/lib/supabase/types'

type Course = Tables<'courses'>

type Props = {
  course: Course
  courseTypes: { id: string; name: string; short_code: string; max_students: number }[]
  instructors: { id: string; first_name: string; last_name: string }[]
}

export default function CourseEditForm({ course, courseTypes, instructors }: Props) {
  const router = useRouter()
  const action = updateCourse.bind(null, course.id)
  const [error, formAction, pending] = useActionState(action, null)
  const [isDirty, setIsDirty] = useState(false)
  const { confirmDiscard } = useUnsavedChanges(isDirty)

  return (
    <form action={formAction} className="space-y-4" onChange={() => setIsDirty(true)}>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-2">
        <Label htmlFor="course_type_id">Course Type</Label>
        <Select name="course_type_id" defaultValue={course.course_type_id} required>
          <SelectTrigger id="course_type_id">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {courseTypes.map((ct) => (
              <SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructor_id">
          Instructor <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Select name="instructor_id" defaultValue={course.instructor_id ?? 'none'}>
          <SelectTrigger id="instructor_id">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— Unassigned —</SelectItem>
            {instructors.map((i) => (
              <SelectItem key={i.id} value={i.id}>{i.first_name} {i.last_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title Override</Label>
        <Input id="title" name="title" defaultValue={course.title ?? ''} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input id="capacity" name="capacity" type="number" min={1} required defaultValue={course.capacity} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Price ($)</Label>
          <Input id="price" name="price" type="number" min={0} step="0.01" defaultValue={course.price ?? ''} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={2} defaultValue={course.description ?? ''} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Internal Notes</Label>
        <Textarea id="notes" name="notes" rows={2} defaultValue={course.notes ?? ''} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save Changes'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => { if (confirmDiscard()) router.push(`/admin/courses/${course.id}`) }}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
