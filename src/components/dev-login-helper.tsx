'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const SEED_USERS = [
  { label: 'Andy Kaminski (admin)', email: 'andy@ltsc.test' },
  { label: 'Mike Theriault (instructor)', email: 'mike@ltsc.test' },
  { label: 'Lisa Chen (instructor)', email: 'lisa@ltsc.test' },
  { label: 'Chris Marino (instructor + student)', email: 'chris@ltsc.test' },
  { label: 'Sam Davies (student)', email: 'sam@ltsc.test' },
  { label: 'Alex Rivera (student)', email: 'alex@ltsc.test' },
  { label: 'Jordan Park (student, unenrolled)', email: 'jordan@ltsc.test' },
]

const DEV_PASSWORD = 'Sailbook12345'

export default function DevLoginHelper() {
  if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') return null

  function handleSelect(email: string) {
    const emailInput = document.getElementById('email') as HTMLInputElement | null
    const passwordInput = document.getElementById('password') as HTMLInputElement | null
    if (!emailInput || !passwordInput) return
    emailInput.value = email
    passwordInput.value = DEV_PASSWORD
    emailInput.form?.requestSubmit()
  }

  return (
    <div className="w-full max-w-sm mt-3">
      <div className="relative flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <div className="flex-1 border-t" />
        <span>dev</span>
        <div className="flex-1 border-t" />
      </div>
      <Select onValueChange={handleSelect}>
        <SelectTrigger className="w-full text-xs h-8" aria-label="Quick login as a seed user">
          <SelectValue placeholder="Quick login as…" />
        </SelectTrigger>
        <SelectContent>
          {SEED_USERS.map((u) => (
            <SelectItem key={u.email} value={u.email} className="text-xs">
              {u.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
