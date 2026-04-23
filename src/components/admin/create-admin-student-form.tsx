'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { createAdminStudent } from '@/actions/profiles'
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

type ExperienceCode = { value: string; label: string }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create Student'}
    </Button>
  )
}

export default function CreateAdminStudentForm({
  experienceCodes,
}: {
  experienceCodes: ExperienceCode[]
}) {
  const [error, action] = useActionState(createAdminStudent, null)

  return (
    <form action={action} className="space-y-4 max-w-sm">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="first_name">First name</Label>
          <Input id="first_name" name="first_name" required autoFocus />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="last_name">Last name</Label>
          <Input id="last_name" name="last_name" required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" type="tel" placeholder="Optional" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="asa_number">ASA number</Label>
        <Input id="asa_number" name="asa_number" placeholder="Optional" />
      </div>

      {experienceCodes.length > 0 && (
        <div className="space-y-1.5">
          <Label>Experience level</Label>
          <Select name="experience_level">
            <SelectTrigger>
              <SelectValue placeholder="Select level (optional)" />
            </SelectTrigger>
            <SelectContent>
              {experienceCodes.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <SubmitButton />
    </form>
  )
}
