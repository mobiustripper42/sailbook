'use client'

import { useActionState, useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { adminEnrollStudent } from '@/actions/enrollments'
import { MANUAL_PAYMENT_METHODS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Student = { id: string; first_name: string; last_name: string; email: string }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Enrolling...' : 'Enroll'}
    </Button>
  )
}

export default function AdminEnrollStudentPanel({
  courseId,
  coursePriceCents,
  students,
}: {
  courseId: string
  coursePriceCents: number | null
  students: Student[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()
  const [error, action] = useActionState(
    async (prev: string | null, formData: FormData) => {
      const result = await adminEnrollStudent(prev, formData)
      if (result === null) {
        setOpen(false)
        startTransition(() => router.refresh())
      }
      return result
    },
    null,
  )

  const defaultAmount = coursePriceCents != null
    ? (coursePriceCents / 100).toFixed(2)
    : ''

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Enroll Student
      </Button>
    )
  }

  return (
    <div className="rounded-lg border bg-muted/40 p-4">
      <h3 className="text-sm font-medium mb-3">Enroll Student</h3>
      <form action={action} className="space-y-3">
        <input type="hidden" name="course_id" value={courseId} />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Student</Label>
            <Select name="student_id" required>
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.last_name}, {s.first_name} — {s.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Payment method</Label>
            <Select name="payment_method" defaultValue="cash">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MANUAL_PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m === 'stripe_manual' ? 'Stripe (manual)' : m.charAt(0).toUpperCase() + m.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5 max-w-36">
          <Label htmlFor="amount">Amount ($)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={defaultAmount}
            placeholder="0.00"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <SubmitButton />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
