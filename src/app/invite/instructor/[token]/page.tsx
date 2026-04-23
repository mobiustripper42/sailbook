import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AcceptInstructorInviteForm from './accept-form'

export default async function AcceptInstructorInvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Instructor invitation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user ? (
            <>
              <p className="text-sm">
                Sign in or create an account, then return to this link to accept the invitation.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/register">Create account</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm">
                Accepting this invitation will grant your account instructor access.
              </p>
              <AcceptInstructorInviteForm token={token} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
