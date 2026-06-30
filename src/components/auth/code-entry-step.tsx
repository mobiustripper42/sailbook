'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { verifyEmailCode } from '@/app/(auth)/actions'

/**
 * Shared step 2 of the email-code flow (DEC-031/DEC-033): enter the 6-digit
 * code and verify. Used by both login (`email-code-form`) and passwordless
 * registration. Only this step is shared — step 1 differs (login is a bare
 * email; register is the full profile form). `verifyEmailCode` is identical
 * for sign-in OTP and new-signup confirmation, so both callers reuse it.
 */
export default function CodeEntryStep({
  email,
  next,
  intro,
  onBack,
  backLabel = 'Use a different email',
  submitLabel = 'Sign in',
}: {
  email: string
  next?: string
  intro: React.ReactNode
  onBack: () => void
  backLabel?: string
  submitLabel?: string
}) {
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyEmailCode,
    null,
  )

  return (
    <form action={verifyAction} className="space-y-3">
      <input type="hidden" name="email" value={email} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <p className="text-sm text-muted-foreground">{intro}</p>
      <div className="space-y-2">
        <Label htmlFor="token">6-digit code</Label>
        <Input
          id="token"
          name="token"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          required
          autoFocus
        />
      </div>
      {verifyState?.error ? (
        <p className="text-sm text-destructive">{verifyState.error}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={verifyPending}>
        {verifyPending ? 'Verifying…' : submitLabel}
      </Button>
      <button
        type="button"
        onClick={onBack}
        className="w-full text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        {backLabel}
      </button>
    </form>
  )
}
