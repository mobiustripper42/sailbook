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

  const [courseTypeId, setCourseTypeId] = useState(course.course_type_id)
  const [instructorId, setInstructorId] = useState(course.instructor_id ?? 'none')
  const [title, setTitle] = useState(course.title ?? '')
  const [capacity, setCapacity] = useState(String(course.capacity))
  const [price, setPrice] = useState(String(course.price ?? ''))
  const [memberPrice, setMemberPrice] = useState(String(course.member_price ?? ''))
  const [description, setDescription] = useState(course.description ?? '')
  const [notes, setNotes] = useState(course.notes ?? '')

  function handleChange() { setIsDirty(true) }

  return (
    <form action={formAction} className="space-y-4" onChange={handleChange}>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-2">
        <Label htmlFor="course_type_id">Course Type</Label>
        <Select name="course_type_id" value={courseTypeId} onValueChange={(v) => { setCourseTypeId(v); setIsDirty(true) }} required>
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
        <Select name="instructor_id" value={instructorId} onValueChange={(v) => { setInstructorId(v); setIsDirty(true) }}>
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
        <Input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input id="capacity" name="capacity" type="number" min={1} required value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Price ($)</Label>
          <Input id="price" name="price" type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="member_price">Member Price ($)</Label>
          <Input id="member_price" name="member_price" type="number" min={0} step="0.01" value={memberPrice} onChange={(e) => setMemberPrice(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Internal Notes</Label>
        <Textarea id="notes" name="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
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
