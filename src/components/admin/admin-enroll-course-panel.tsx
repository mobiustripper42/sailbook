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

export type EnrollableCourse = {
  id: string
  title: string
  priceCents: number | null
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Enrolling...' : 'Enroll'}
    </Button>
  )
}

/**
 * The mirror of AdminEnrollStudentPanel (#137): same `adminEnrollStudent`
 * action, driven from the student's page instead of the course's — pick a
 * course for this student rather than a student for this course. Andy works
 * from whichever page he's already on.
 */
export default function AdminEnrollCoursePanel({
  studentId,
  courses,
}: {
  studentId: string
  courses: EnrollableCourse[]
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

  const [courseId, setCourseId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [amount, setAmount] = useState('')

  // Selecting a course pre-fills its price, the same convenience the
  // course-side panel gets from its single known price.
  function handleCourseChange(next: string) {
    setCourseId(next)
    const price = courses.find((c) => c.id === next)?.priceCents
    setAmount(price != null ? (price / 100).toFixed(2) : '')
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Enroll in Course
      </Button>
    )
  }

  return (
    <div className="rounded-lg border bg-muted/40 p-4">
      <h3 className="text-sm font-medium mb-3">Enroll in Course</h3>
      <form action={action} className="space-y-3">
        <input type="hidden" name="student_id" value={studentId} />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Course</Label>
            <Select name="course_id" value={courseId} onValueChange={handleCourseChange} required>
              <SelectTrigger>
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Payment method</Label>
            <Select name="payment_method" value={paymentMethod} onValueChange={setPaymentMethod}>
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
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <SubmitButton />
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
