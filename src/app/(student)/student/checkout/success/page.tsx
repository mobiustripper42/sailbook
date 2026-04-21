import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CheckoutSuccessPage() {
  return (
    <div className="max-w-lg mx-auto">
      <Card size="sm">
        <CardHeader>
          <CardTitle>You&apos;re registered!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your payment was received. Check your email for a confirmation receipt.
          </p>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/student/dashboard">Go to dashboard</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/student/courses">Browse courses</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
