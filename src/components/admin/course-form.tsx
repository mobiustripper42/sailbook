'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCourse } from '@/actions/courses'
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

type CourseTypeOption = { id: string; name: string; short_code: string; max_students: number }
type InstructorOption = { id: string; first_name: string; last_name: string }
type SessionRow = { date: string; start_time: string; end_time: string; location: string }

type Props = {
  courseTypes: CourseTypeOption[]
  instructors: InstructorOption[]
}

const DEFAULT_SESSION: SessionRow = { date: '', start_time: '08:00', end_time: '16:00', location: '' }

export default function CourseForm({ courseTypes, instructors }: Props) {
  const router = useRouter()
  const [error, formAction, pending] = useActionState(createCourse, null)
  const [sessions, setSessions] = useState<SessionRow[]>([{ ...DEFAULT_SESSION }])
  const [selectedTypeId, setSelectedTypeId] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const { confirmDiscard } = useUnsavedChanges(isDirty)

  const selectedType = courseTypes.find((ct) => ct.id === selectedTypeId)

  function addSession() {
    setSessions((prev) => [...prev, { ...DEFAULT_SESSION }])
  }

  function removeSession(index: number) {
    setSessions((prev) => prev.filter((_, i) => i !== index))
  }

  function updateSession(index: number, field: keyof SessionRow, value: string) {
    setSessions((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  return (
    <form action={formAction} className="space-y-6" onChange={() => setIsDirty(true)}>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <section className="space-y-4">
        <h2 className="font-medium">Course Details</h2>

        <div className="space-y-2">
          <Label htmlFor="course_type_id">Course Type</Label>
          <Select name="course_type_id" onValueChange={setSelectedTypeId}>
            <SelectTrigger id="course_type_id">
              <SelectValue placeholder="Select a course type" />
            </SelectTrigger>
            <SelectContent>
              {courseTypes.map((ct) => (
                <SelectItem key={ct.id} value={ct.id}>
                  {ct.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructor_id">
            Instructor <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Select name="instructor_id">
            <SelectTrigger id="instructor_id">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Unassigned —</SelectItem>
              {instructors.map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  {i.first_name} {i.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title Override <span className="text-muted-foreground">(optional)</span></Label>
          <Input id="title" name="title" placeholder={selectedType?.name ?? 'e.g. ASA 101 — Weekend Intensive'} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity</Label>
            <Input
              id="capacity"
              name="capacity"
              type="number"
              min={1}
              required
              defaultValue={selectedType?.max_students ?? 4}
              key={selectedTypeId}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price ($)</Label>
            <Input id="price" name="price" type="number" min={0} step="0.01" placeholder="Optional" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="member_price">Member Price ($)</Label>
            <Input id="member_price" name="member_price" type="number" min={0} step="0.01" placeholder="Optional" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={2} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Internal Notes</Label>
          <Textarea id="notes" name="notes" rows={2} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Sessions</h2>
          <Button type="button" variant="outline" size="sm" onClick={addSession}>
            + Add Session
          </Button>
        </div>

        {sessions.map((session, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Session {index + 1}</span>
              {sessions.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeSession(index)}>
                  Remove
                </Button>
              )}
            </div>

            <input type="hidden" name={`session_date_${index}`} value={session.date} />
            <input type="hidden" name={`session_start_${index}`} value={session.start_time} />
            <input type="hidden" name={`session_end_${index}`} value={session.end_time} />
            <input type="hidden" name={`session_location_${index}`} value={session.location} />

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  required
                  value={session.date}
                  onChange={(e) => updateSession(index, 'date', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Start</Label>
                <Input
                  type="time"
                  required
                  value={session.start_time}
                  onChange={(e) => updateSession(index, 'start_time', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>End</Label>
                <Input
                  type="time"
                  required
                  value={session.end_time}
                  onChange={(e) => updateSession(index, 'end_time', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input
                placeholder="e.g. Dock A, Edgewater"
                value={session.location}
                onChange={(e) => updateSession(index, 'location', e.target.value)}
              />
            </div>
          </div>
        ))}
      </section>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating…' : 'Create Course'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => { if (confirmDiscard()) router.push('/admin/courses') }}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
