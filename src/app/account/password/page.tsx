import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChangePasswordForm from '@/components/auth/change-password-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata = { title: 'SailBook — Change password' }

export default async function ChangePasswordPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=' + encodeURIComponent('/account/password'))

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const dashboardHref = meta.is_admin
    ? '/admin/dashboard'
    : meta.is_instructor
      ? '/instructor/dashboard'
      : '/student/dashboard'

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <Link
        href={dashboardHref}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to dashboard
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>
            Enter your current password, then choose a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  )
}
