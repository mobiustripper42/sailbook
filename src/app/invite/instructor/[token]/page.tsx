import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AcceptInviteForm from '@/components/invite/accept-invite-form'

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
                Sign in or create an account to accept the invitation. You&rsquo;ll be brought back here.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild>
                  <Link href={`/login?next=${encodeURIComponent(`/invite/instructor/${token}`)}`}>Sign in</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/register?next=${encodeURIComponent(`/invite/instructor/${token}`)}`}>Create account</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm">
                Accepting this invitation will grant your account instructor access.
              </p>
              <AcceptInviteForm role="instructor" token={token} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
