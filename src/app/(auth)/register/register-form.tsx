'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { register } from '../actions'
import { safeNextPath } from '@/lib/auth/safe-next'
import GoogleSignInButton from '@/components/auth/google-sign-in-button'

type ExperienceCode = {
  value: string
  label: string
  description: string | null
}

export default function RegisterForm({ experienceCodes }: { experienceCodes: ExperienceCode[] }) {
  const [state, action, pending] = useActionState(register, null)
  const searchParams = useSearchParams()
  const next = safeNextPath(searchParams.get('next')) ?? undefined

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
      <form action={action}>
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <CardContent className="space-y-4">
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" name="firstName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" name="lastName" required />
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="tel" autoComplete="tel" />
            <p className="text-xs text-muted-foreground">
              Used for enrollment confirmations and session reminders. Standard message rates apply. Reply STOP to opt out.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="experienceLevel">Sailing experience</Label>
            <select
              id="experienceLevel"
              name="experienceLevel"
              className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
            <textarea
              id="instructorNotes"
              name="instructorNotes"
              rows={3}
              className="flex w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              placeholder="Prior sailing experience, medical conditions, seasickness, etc."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={12}
            />
            <p className="text-xs text-muted-foreground">
              At least 12 characters, with upper case, lower case, and a digit.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-4">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Creating account…' : 'Create account'}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{' '}
            <Link
              href="/login"
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
