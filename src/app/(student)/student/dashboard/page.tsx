import { logout } from '@/app/actions'
import { Button } from '@/components/ui/button'

export default function StudentDashboard() {
  return (
    <div className="p-8 flex items-center justify-between">
      <h1 className="text-2xl font-semibold">Student Dashboard</h1>
      <form action={logout}>
        <Button variant="outline" size="sm">Sign out</Button>
      </form>
    </div>
  )
}
