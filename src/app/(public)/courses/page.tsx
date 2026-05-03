import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Courses | SailBook',
  description: 'Browse sailing courses offered by Simply Sailing.',
}

export default async function PublicCourseCatalogPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: courseTypes } = await supabase
    .from('course_types')
    .select(`
      id, name, short_code, slug, certification_body, description, is_drop_in,
      courses ( price, status, sessions ( date, status ) )
    `)
    .eq('is_active', true)
    .order('slug')

  const enriched = (courseTypes ?? []).map((ct) => {
    const allCourses = (ct.courses ?? []) as {
      price: number | null
      status: string
      sessions: { date: string; status: string }[]
    }[]

    const upcoming = allCourses.filter(
      (c) =>
        c.status === 'active' &&
        (c.sessions ?? []).some((s) => s.status !== 'cancelled' && s.date >= today),
    )

    const prices = upcoming.map((c) => c.price).filter((p): p is number => p !== null)
    const minPrice = prices.length > 0 ? Math.min(...prices) : null

    return { ...ct, hasUpcoming: upcoming.length > 0, minPrice }
  })

  if (enriched.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg font-medium mb-2">No courses available yet.</p>
        <p className="text-sm">
          <Link href="/login" className="underline hover:text-foreground">
            Log in
          </Link>{' '}
          to stay notified when courses open.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Courses</h1>
        <p className="text-muted-foreground text-sm">
          Sailing courses offered by Simply Sailing.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {enriched.map((ct) => (
          <Link key={ct.id} href={`/courses/${ct.slug}`} className="group block">
            <Card className="h-full flex flex-col transition-colors group-hover:border-foreground/20">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {ct.short_code && (
                    <Badge variant="neutral" className="text-xs">{ct.short_code}</Badge>
                  )}
                  {ct.certification_body && (
                    <Badge variant="neutral" className="text-xs">{ct.certification_body}</Badge>
                  )}
                  {!ct.hasUpcoming && (
                    <Badge variant="neutral" className="text-xs text-muted-foreground">Coming soon</Badge>
                  )}
                </div>
                <CardTitle className="text-base leading-snug">{ct.name}</CardTitle>
              </CardHeader>

              {ct.description && (
                <CardContent className="pb-3 flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {ct.description}
                  </p>
                </CardContent>
              )}

              <CardFooter className="pt-0 flex items-center justify-between">
                <span className="text-sm font-medium">
                  {ct.hasUpcoming && ct.minPrice !== null
                    ? `From $${ct.minPrice}`
                    : ct.hasUpcoming
                    ? null
                    : null}
                </span>
                <Button size="sm" variant="ghost" className="pointer-events-none" tabIndex={-1}>
                  View details →
                </Button>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
