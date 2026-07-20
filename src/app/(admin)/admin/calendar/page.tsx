import { redirect } from 'next/navigation'

// Consolidated into /admin/schedule (task 10.3), where it's the "Month" view.
export default function CalendarRedirect() {
  redirect('/admin/schedule')
}
