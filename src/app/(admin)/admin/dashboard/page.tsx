import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

async function getStats() {
  const supabase = await createClient()

  const [courses, sessions, enrollments, instructors] = await Promise.all([
    supabase.from('courses').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'scheduled')
      .gte('date', new Date().toISOString().slice(0, 10)),
    supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'registered'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'instructor').eq('is_active', true),
  ])

  return {
    activeCourses: courses.count ?? 0,
    upcomingSessions: sessions.count ?? 0,
    enrollments: enrollments.count ?? 0,
    activeInstructors: instructors.count ?? 0,
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Courses" value={stats.activeCourses} />
        <StatCard label="Upcoming Sessions" value={stats.upcomingSessions} />
        <StatCard label="Enrollments" value={stats.enrollments} />
        <StatCard label="Active Instructors" value={stats.activeInstructors} />
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}
