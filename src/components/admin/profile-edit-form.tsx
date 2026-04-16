'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile } from '@/actions/profiles'
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
  experience_level: string | null
  asa_number: string | null
  is_active: boolean
  is_student: boolean
  is_instructor: boolean
}

type ExperienceCode = {
  value: string
  label: string
  description: string | null
}

export default function ProfileEditForm({
  profile,
  returnPath,
  experienceCodes = [],
}: {
  profile: Profile
  returnPath: string
  experienceCodes?: ExperienceCode[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const { confirmDiscard } = useUnsavedChanges(isDirty)

  function handleSubmit(formData: FormData) {
    setError(null)

    if (profile.is_instructor && profile.is_active && formData.get('is_active') === 'false') {
      if (!window.confirm('Deactivating this instructor will remove them from all assigned courses and sessions. Continue?')) {
        return
      }
    }

    startTransition(async () => {
      const result = await updateProfile(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        router.push(returnPath)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-lg" onChange={() => setIsDirty(true)}>
      <input type="hidden" name="id" value={profile.id} />
      <input type="hidden" name="return_path" value={returnPath} />
      <input type="hidden" name="is_admin_caller" value="true" />

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={profile.email} disabled className="bg-muted" />
        <p className="text-xs text-muted-foreground">Email is managed through Supabase Auth and cannot be changed here.</p>
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

      {profile.is_student && (
        <div className="space-y-2">
          <Label htmlFor="asa_number">ASA Number</Label>
          <Input id="asa_number" name="asa_number" defaultValue={profile.asa_number ?? ''} placeholder="e.g. 123456" maxLength={20} />
        </div>
      )}

      {profile.is_student && (
        <div className="space-y-2">
          <Label htmlFor="experience_level">Experience Level</Label>
          <select
            id="experience_level"
            name="experience_level"
            defaultValue={profile.experience_level ?? '—'}
            className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="—">Not set</option>
            {experienceCodes.map((code) => (
              <option key={code.value} value={code.value}>
                {code.label}
              </option>
            ))}
          </select>
        </div>
      )}

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

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save Changes'}
        </Button>
        <Button type="button" variant="outline" onClick={() => { if (confirmDiscard()) router.push(returnPath) }}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
