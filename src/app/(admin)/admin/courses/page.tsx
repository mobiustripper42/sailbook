import { redirect } from 'next/navigation'

// Consolidated into /admin/schedule (task 10.3). The course list is now the
// "List" view there; course detail lives at /admin/courses/[id].
export default function CoursesIndexRedirect() {
  redirect('/admin/schedule')
}
