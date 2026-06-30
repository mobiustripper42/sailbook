'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestEmailCode } from '@/app/(auth)/actions'
import CodeEntryStep from '@/components/auth/code-entry-step'

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
      <CodeEntryStep
        email={email}
        next={next}
        intro={
          <>
            If an account exists for{' '}
            <span className="font-medium text-foreground">{email}</span>, a
            6-digit code is on its way. Enter it below.
          </>
        }
        onBack={() => setStep('email')}
      />
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
