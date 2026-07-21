'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCourse } from '@/actions/courses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import TimeSelect from '@/components/admin/time-select'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'
import { parseLocalDate } from '@/lib/course-schedule'

type CourseTypeOption = { id: string; name: string; short_code: string; max_students: number }
type InstructorOption = { id: string; first_name: string; last_name: string }
type SessionRow = { date: string; start_time: string; end_time: string; location: string }

type Props = {
  courseTypes: CourseTypeOption[]
  instructors: InstructorOption[]
}

const DEFAULT_SESSION: SessionRow = { date: '', start_time: '08:00', end_time: '16:00', location: '' }

const WEEKDAY_OPTIONS = [
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
  { value: '0', label: 'Sunday' },
]

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const MAX_GENERATED_SESSIONS = 52

// Expand weekday + time + [start,end] date range into one SessionRow per matching week.
function generateRecurringSessions(opts: {
  weekday: number
  startTime: string
  endTime: string
  startDate: string
  endDate: string
  location: string
}): SessionRow[] {
  const start = parseLocalDate(opts.startDate)
  const end = parseLocalDate(opts.endDate)
  const out: SessionRow[] = []
  const cur = new Date(start)
  // Advance to the first occurrence of the chosen weekday on or after startDate.
  while (cur.getDay() !== opts.weekday) cur.setDate(cur.getDate() + 1)
  while (cur <= end && out.length < MAX_GENERATED_SESSIONS) {
    out.push({
      date: toISODate(cur),
      start_time: opts.startTime,
      end_time: opts.endTime,
      location: opts.location,
    })
    cur.setDate(cur.getDate() + 7)
  }
  return out
}

export default function CourseForm({ courseTypes, instructors }: Props) {
  const router = useRouter()
  const [error, formAction, pending] = useActionState(createCourse, null)
  const [sessions, setSessions] = useState<SessionRow[]>([{ ...DEFAULT_SESSION }])
  const [selectedTypeId, setSelectedTypeId] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const { confirmDiscard } = useUnsavedChanges(isDirty)

  const [showGenerator, setShowGenerator] = useState(false)
  const [gen, setGen] = useState({
    weekday: '2',
    startTime: '18:00',
    endTime: '20:00',
    startDate: '',
    endDate: '',
    location: '',
  })
  const [genError, setGenError] = useState<string | null>(null)

  function runGenerator() {
    setGenError(null)
    if (!gen.startDate || !gen.endDate) {
      setGenError('Pick a start and end date for the range.')
      return
    }
    if (gen.endDate < gen.startDate) {
      setGenError('End date must be on or after the start date.')
      return
    }
    const generated = generateRecurringSessions({
      weekday: Number(gen.weekday),
      startTime: gen.startTime,
      endTime: gen.endTime,
      startDate: gen.startDate,
      endDate: gen.endDate,
      location: gen.location,
    })
    if (generated.length === 0) {
      setGenError('No matching weekdays fall inside that range.')
      return
    }
    setSessions(generated)
    setIsDirty(true)
    if (generated.length >= MAX_GENERATED_SESSIONS) {
      // Surface the truncation and leave the panel open so the message is seen.
      setGenError(`Range capped at ${MAX_GENERATED_SESSIONS} sessions — shorten the date range if you need fewer.`)
      return
    }
    setShowGenerator(false)
  }

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
          <Label htmlFor="section_label">Section Label <span className="text-muted-foreground">(optional)</span></Label>
          <Input
            id="section_label"
            name="section_label"
            maxLength={50}
            placeholder="e.g. Boat 1"
          />
          <p className="text-xs text-muted-foreground">
            Distinguishes concurrent same-time offerings. Shown as a chip beside the course name.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title Override <span className="text-muted-foreground">(optional)</span></Label>
          <Input id="title" name="title" placeholder={selectedType?.name ?? 'e.g. ASA 101 - Weekend Intensive'} />
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
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowGenerator((v) => !v)}
              aria-expanded={showGenerator}
            >
              {showGenerator ? 'Close generator' : 'Generate recurring…'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={addSession}>
              + Add Session
            </Button>
          </div>
        </div>

        {showGenerator && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Generate a session for each matching weekday in the range. This replaces the list below;
              you can still edit or remove individual sessions afterward.
            </p>
            {genError && <p className="text-sm text-destructive">{genError}</p>}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Weekday</Label>
                <Select value={gen.weekday} onValueChange={(v) => setGen((g) => ({ ...g, weekday: v }))}>
                  <SelectTrigger aria-label="Weekday">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAY_OPTIONS.map((w) => (
                      <SelectItem key={w.value} value={w.value}>
                        {w.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Start time</Label>
                <TimeSelect
                  name="gen_start_time"
                  value={gen.startTime}
                  onChange={(v) => setGen((g) => ({ ...g, startTime: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>End time</Label>
                <TimeSelect
                  name="gen_end_time"
                  value={gen.endTime}
                  onChange={(v) => setGen((g) => ({ ...g, endTime: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gen_start_date">First date</Label>
                <Input
                  id="gen_start_date"
                  type="date"
                  value={gen.startDate}
                  onChange={(e) => setGen((g) => ({ ...g, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gen_end_date">Last date</Label>
                <Input
                  id="gen_end_date"
                  type="date"
                  value={gen.endDate}
                  onChange={(e) => setGen((g) => ({ ...g, endDate: e.target.value }))}
                />
              </div>
              <div className="col-span-2 sm:col-span-1 space-y-1.5">
                <Label htmlFor="gen_location">Location</Label>
                <Input
                  id="gen_location"
                  placeholder="e.g. Dock A, Edgewater"
                  value={gen.location}
                  onChange={(e) => setGen((g) => ({ ...g, location: e.target.value }))}
                />
              </div>
            </div>
            <Button type="button" size="sm" onClick={runGenerator}>
              Generate sessions
            </Button>
          </div>
        )}

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
            <input type="hidden" name={`session_location_${index}`} value={session.location} />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="col-span-2 sm:col-span-1 space-y-1.5">
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
                <TimeSelect
                  name={`session_start_${index}`}
                  value={session.start_time}
                  onChange={(v) => updateSession(index, 'start_time', v)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>End</Label>
                <TimeSelect
                  name={`session_end_${index}`}
                  value={session.end_time}
                  onChange={(v) => updateSession(index, 'end_time', v)}
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
