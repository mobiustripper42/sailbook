'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { changePassword } from '@/app/(auth)/actions'
import { PASSWORD_MIN_LENGTH, PASSWORD_RULES_HELP } from '@/lib/auth/password-rules'

export default function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, null)
  const formRef = useRef<HTMLFormElement>(null)

  // DEC-015 transient-success pattern (see student-account-form.tsx).
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const prevPending = useRef(false)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (prevPending.current && !pending) setHasSubmitted(true)
    prevPending.current = pending
  }, [pending])

  const showSuccess = hasSubmitted && state === null && !pending

  // Clear all three password fields once we know the change succeeded —
  // avoids leaving the just-typed password sitting in the form.
  const justSucceededRef = useRef(false)
  useEffect(() => {
    if (showSuccess && !justSucceededRef.current) {
      justSucceededRef.current = true
      formRef.current?.reset()
    }
    if (!showSuccess) justSucceededRef.current = false
  }, [showSuccess])

  return (
    <form ref={formRef} action={action} className="space-y-5 max-w-md" noValidate>
      {state && <p className="text-sm text-destructive">{state}</p>}
      {showSuccess && <p className="text-sm text-primary">Password updated.</p>}

      <div className="space-y-2">
        <Label htmlFor="current_password">Current password</Label>
        <Input
          id="current_password"
          name="current_password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="new_password">New password</Label>
        <Input
          id="new_password"
          name="new_password"
          type="password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          autoComplete="new-password"
        />
        <p className="text-xs text-muted-foreground">{PASSWORD_RULES_HELP}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm_password">Confirm new password</Label>
        <Input
          id="confirm_password"
          name="confirm_password"
          type="password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          autoComplete="new-password"
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Change password'}
      </Button>
    </form>
  )
}
