import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function CheckoutCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ course_id?: string }>
}) {
  const { course_id } = await searchParams
  const holdMinutes = parseInt(process.env.ENROLLMENT_HOLD_MINUTES ?? '15', 10)

  return (
    <div className="max-w-lg mx-auto pt-12">
      <Card>
        <CardHeader>
          <CardTitle>Payment cancelled</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your spot is held for {holdMinutes} {holdMinutes === 1 ? 'minute' : 'minutes'}.
            Come back and complete payment before your hold expires.
          </p>
          <div className="flex gap-3">
            {course_id && (
              <Button asChild>
                <Link href={`/student/courses/${course_id}`}>Return to course</Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/student/courses">Browse courses</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
