import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Check your email</CardTitle>
        <CardDescription>
          {email
            ? `We sent a confirmation link to ${email}. Click it to finish creating your account.`
            : 'We sent a confirmation link to your email. Click it to finish creating your account.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          The link expires in an hour. If you don&apos;t see the email, check your spam folder.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Link
          href="/login"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  )
}
