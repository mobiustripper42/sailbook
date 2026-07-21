import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { getDashboardData } from '@/lib/dashboard'
import {
  NeedsYou,
  TodayOnTheWater,
  RestOfWeek,
  FillingNow,
  JustEnrolled,
} from '@/components/admin/dashboard-sections'

function todayHeading(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export default async function AdminDashboard() {
  const supabase = await createClient()
  const now = new Date()
  const data = await getDashboardData(supabase, now)

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{todayHeading()}</p>
        </div>
        <p className="text-sm text-muted-foreground tabular-nums">
          {data.activeCourses} {data.activeCourses === 1 ? 'course' : 'courses'} running
        </p>
      </header>

      <QuickActions />

      <NeedsYou items={data.needsYou} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <TodayOnTheWater sessions={data.today} />
          <RestOfWeek sessions={data.restOfWeek} now={now} />
        </div>
        <div className="space-y-6">
          <FillingNow courses={data.fillingNow} />
          <JustEnrolled items={data.justEnrolled} />
        </div>
      </div>
    </div>
  )
}

function QuickActions() {
  return (
    <nav aria-label="Quick actions" className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href="/admin/courses/new">+ New Course</Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href="/admin/students/new">+ New Student</Link>
      </Button>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/schedule">Schedule</Link>
      </Button>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/missed-sessions">Missed Sessions</Link>
      </Button>
    </nav>
  )
}
