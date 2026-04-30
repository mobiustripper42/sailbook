import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AcceptInviteForm from '@/components/invite/accept-invite-form'

type Role = 'instructor' | 'admin'

const ROLE_COPY: Record<Role, { title: string; access: string }> = {
  instructor: { title: 'Instructor invitation', access: 'instructor access' },
  admin: { title: 'Admin invitation', access: 'admin access' },
}

function isRole(value: string): value is Role {
  return value === 'instructor' || value === 'admin'
}

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ role: string; token: string }>
}) {
  const { role, token } = await params
  if (!isRole(role)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const copy = ROLE_COPY[role]
  const returnPath = `/invite/${role}/${token}`

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{copy.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user ? (
            <>
              <p className="text-sm">
                Sign in or create an account to accept the invitation. You&rsquo;ll be brought back here.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild>
                  <Link href={`/login?next=${encodeURIComponent(returnPath)}`}>Sign in</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/register?next=${encodeURIComponent(returnPath)}`}>Create account</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm">
                Accepting this invitation will grant your account {copy.access}.
              </p>
              <AcceptInviteForm role={role} token={token} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
