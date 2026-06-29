'use client'

import { useActionState, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestEmailCode, verifyEmailCode } from '@/app/(auth)/actions'

/**
 * Two-step email one-time-code sign-in (DEC-031). Step 1 requests a 6-digit
 * code; step 2 verifies it. Steps are bridged by plain React state — no cookie,
 * no second route — since the login page is already a client component.
 *
 * The whole component only renders when NEXT_PUBLIC_EMAIL_CODE_AUTH is on
 * (gated by the caller); the server actions hard-gate the flag independently.
 */
export default function EmailCodeForm({ next }: { next?: string }) {
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [requestError, setRequestError] = useState<string | null>(null)
  const [requestPending, startRequest] = useTransition()
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyEmailCode,
    null,
  )

  // Advance to code entry in the submit handler (not an effect). `ok` only
  // means "request accepted" — the response is identical whether or not the
  // email has an account (enumeration-safe), so it never reveals existence.
  function handleRequest(formData: FormData) {
    startRequest(async () => {
      const result = await requestEmailCode(null, formData)
      if (result.ok) {
        setRequestError(null)
        setStep('code')
      } else {
        setRequestError(result.error)
      }
    })
  }

  if (step === 'code') {
    return (
      <form action={verifyAction} className="space-y-3">
        <input type="hidden" name="email" value={email} />
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <p className="text-sm text-muted-foreground">
          If an account exists for{' '}
          <span className="font-medium text-foreground">{email}</span>, a 6-digit
          code is on its way. Enter it below.
        </p>
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
          {verifyPending ? 'Verifying…' : 'Sign in'}
        </Button>
        <button
          type="button"
          onClick={() => setStep('email')}
          className="w-full text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Use a different email
        </button>
      </form>
    )
  }

  return (
    <form action={handleRequest} className="space-y-3">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <div className="space-y-2">
        <Label htmlFor="code-email">Email</Label>
        <Input
          id="code-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {requestError ? (
        <p className="text-sm text-destructive">{requestError}</p>
      ) : null}
      <Button
        type="submit"
        variant="outline"
        className="w-full"
        disabled={requestPending}
      >
        {requestPending ? 'Sending…' : 'Email me a code'}
      </Button>
    </form>
  )
}
