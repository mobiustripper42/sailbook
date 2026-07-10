'use client'

import { useTransition, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { register, requestRegisterCode } from '../actions'
import { safeNextPath } from '@/lib/auth/safe-next'
import { PASSWORD_MIN_LENGTH, PASSWORD_RULES_HELP } from '@/lib/auth/password-rules'
import GoogleSignInButton from '@/components/auth/google-sign-in-button'
import CodeEntryStep from '@/components/auth/code-entry-step'

type ExperienceCode = {
  value: string
  label: string
  description: string | null
}

// Build-inlined client-side, same as the login page reads it (DEC-033). On →
// registration is passwordless (request a code, then verify); off → today's
// password sign-up. Login + password recovery are unaffected either way.
const PASSWORDLESS = process.env.NEXT_PUBLIC_EMAIL_CODE_AUTH === 'true'

export default function RegisterForm({ experienceCodes, smsEnabled = false }: { experienceCodes: ExperienceCode[]; smsEnabled?: boolean }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [step, setStep] = useState<'form' | 'code'>('form')
  const searchParams = useSearchParams()
  const next = safeNextPath(searchParams.get('next')) ?? undefined

  // All inputs are controlled so values survive server-action errors.
  // onSubmit + e.preventDefault() is used instead of action={serverAction}
  // to prevent React 19 from calling form.reset() after the action, which
  // resets native <select> elements even when controlled via value prop.
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [instructorNotes, setInstructorNotes] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      if (PASSWORDLESS) {
        // Passwordless: create the account + email a code, then verify.
        const result = await requestRegisterCode(null, formData)
        if (result.ok) setStep('code')
        else setError(result.error)
      } else {
        const result = await register(null, formData)
        if (result?.error) setError(result.error)
      }
    })
  }

  // Passwordless step 2 — verify the emailed code (shared with login).
  if (PASSWORDLESS && step === 'code') {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>Enter your code to finish signing up</CardDescription>
        </CardHeader>
        <CardContent>
          <CodeEntryStep
            email={email}
            next={next}
            intro={
              <>
                We&rsquo;ve emailed a 6-digit code to{' '}
                <span className="font-medium text-foreground">{email}</span>. Enter
                it to finish creating your account.
              </>
            }
            onBack={() => setStep('form')}
            backLabel="Edit details"
            submitLabel="Create account"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>Sign up for SailBook</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pb-0">
        <GoogleSignInButton next={next} />
        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>
      </CardContent>
      <form onSubmit={handleSubmit} noValidate>
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                name="firstName"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                name="lastName"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {smsEnabled && (
              <p className="text-xs text-muted-foreground">
                By providing your phone number you consent to receive SMS messages from Learn to Sail Cleveland (Riverfront Marine) about your enrollment, session reminders, and cancellations. Msg frequency varies. Msg &amp; data rates may apply. Reply STOP to cancel, HELP for help.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="experienceLevel">Sailing experience</Label>
            <select
              id="experienceLevel"
              name="experienceLevel"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="flex h-9 w-full rounded-xs border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select experience level</option>
              {experienceCodes.map((code) => (
                <option key={code.value} value={code.value}>
                  {code.description ? `${code.label} — ${code.description}` : code.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructorNotes">Anything you want an instructor to know? <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              id="instructorNotes"
              name="instructorNotes"
              rows={3}
              value={instructorNotes}
              onChange={(e) => setInstructorNotes(e.target.value)}
              placeholder="Prior sailing experience, medical conditions, seasickness, etc."
              className="resize-none"
            />
          </div>
          {!PASSWORDLESS && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={PASSWORD_MIN_LENGTH}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{PASSWORD_RULES_HELP}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-4">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending
              ? PASSWORDLESS ? 'Sending…' : 'Creating account…'
              : PASSWORDLESS ? 'Email me a code' : 'Create account'}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{' '}
            <Link
              href={next ? `/login?next=${next}` : '/login'}
              className="underline underline-offset-4 hover:text-foreground"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
