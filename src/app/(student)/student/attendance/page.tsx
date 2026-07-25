import { permanentRedirect } from 'next/navigation'

// Attendance folded into My Courses (10.7) — the schedule and its attendance
// status now render together instead of on two separate pages. Kept as a
// redirect so bookmarks and older notification links don't 404.
export default function StudentAttendanceRedirect() {
  permanentRedirect('/student/my-courses')
}
