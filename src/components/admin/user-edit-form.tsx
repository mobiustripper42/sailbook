'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserProfile } from '@/actions/profiles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'

type Profile = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  is_admin: boolean
  is_instructor: boolean
  is_student: boolean
  is_active: boolean
}

export default function UserEditForm({
  profile,
  isSelf,
}: {
  profile: Profile
  isSelf: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const { confirmDiscard } = useUnsavedChanges(isDirty)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await updateUserProfile(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/admin/users')
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-8 max-w-lg" onChange={() => setIsDirty(true)}>
      <input type="hidden" name="id" value={profile.id} />

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* All */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">All</h2>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={profile.email} disabled className="bg-muted" />
          <p className="text-xs text-muted-foreground">Managed through Supabase Auth — cannot be changed here.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name</Label>
            <Input id="first_name" name="first_name" defaultValue={profile.first_name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input id="last_name" name="last_name" defaultValue={profile.last_name} required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={profile.phone ?? ''} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="is_active">Status</Label>
          <select
            id="is_active"
            name="is_active"
            defaultValue={profile.is_active ? 'true' : 'false'}
            className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      <hr />

      {/* Instructor */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Instructor</h2>
        <p className="text-sm text-muted-foreground">Credentials and certifications — coming in V2.</p>
      </div>

      <hr />

      {/* Roles */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Roles</h2>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_admin"
              name="is_admin"
              defaultChecked={profile.is_admin}
              disabled={isSelf}
              className="h-4 w-4 rounded border-input accent-foreground"
            />
            <Label htmlFor="is_admin" className={isSelf ? 'text-muted-foreground' : ''}>
              Admin
            </Label>
            {isSelf && (
              <span className="text-xs text-muted-foreground">— can&apos;t remove your own admin access</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_instructor"
              name="is_instructor"
              defaultChecked={profile.is_instructor}
              className="h-4 w-4 rounded border-input accent-foreground"
            />
            <Label htmlFor="is_instructor">Instructor</Label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_student"
              name="is_student"
              defaultChecked={profile.is_student}
              className="h-4 w-4 rounded border-input accent-foreground"
            />
            <Label htmlFor="is_student">Student</Label>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save Changes'}
        </Button>
        <Button type="button" variant="outline" onClick={() => { if (confirmDiscard()) router.push('/admin/users') }}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
