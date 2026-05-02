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
  is_member: boolean
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

  const [firstName, setFirstName] = useState(profile.first_name)
  const [lastName, setLastName] = useState(profile.last_name)
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [asaNumber, setAsaNumber] = useState(profile.asa_number ?? '')
  const [experienceLevel, setExperienceLevel] = useState(profile.experience_level ?? '—')
  const [isMember, setIsMember] = useState(profile.is_member)
  const [isActive, setIsActive] = useState(profile.is_active ? 'true' : 'false')

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
          <Input id="first_name" name="first_name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name</Label>
          <Input id="last_name" name="last_name" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      {profile.is_student && (
        <div className="space-y-2">
          <Label htmlFor="asa_number">ASA Number</Label>
          <Input id="asa_number" name="asa_number" value={asaNumber} onChange={(e) => setAsaNumber(e.target.value)} placeholder="e.g. 123456" maxLength={20} />
        </div>
      )}

      {profile.is_student && (
        <div className="space-y-2">
          <Label htmlFor="experience_level">Experience Level</Label>
          <select
            id="experience_level"
            name="experience_level"
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
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

      {profile.is_student && (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="is_member"
            name="is_member"
            checked={isMember}
            onChange={(e) => setIsMember(e.target.checked)}
            className="h-4 w-4 rounded border border-input accent-primary"
          />
          <Label htmlFor="is_member" className="cursor-pointer">Simply Sailing Member (member pricing at checkout)</Label>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="is_active">Status</Label>
        <select
          id="is_active"
          name="is_active"
          value={isActive}
          onChange={(e) => setIsActive(e.target.value)}
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
        <Button type="button" variant="ghost" onClick={() => { if (confirmDiscard()) router.push(returnPath) }}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
