import { permanentRedirect } from 'next/navigation'

// The "Experience" page folded into My Courses (10.7): past courses are the
// `past` filter there, and the ASA number moved to the My Courses header.
// Kept as a redirect so bookmarks don't 404.
export default function StudentHistoryRedirect() {
  permanentRedirect('/student/my-courses')
}
