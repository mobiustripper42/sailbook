import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  BookOpen,
  Tags,
  Users,
  Flag,
  Bell,
  Search,
  GraduationCap,
  CircleUser,
  type LucideIcon,
} from 'lucide-react'

export type Role = 'admin' | 'instructor' | 'student'

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  // Extra path prefixes that also mark this item active (e.g. a consolidated
  // item whose detail pages live under a different route).
  match?: string[]
}

export const ALL_ROLES: Role[] = ['admin', 'instructor', 'student']

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  instructor: 'Instructor',
  student: 'Student',
}

export const ROLE_HOME: Record<Role, string> = {
  admin: '/admin/dashboard',
  instructor: '/instructor/dashboard',
  student: '/student/dashboard',
}

// Route/tab changes land per task: /schedule merge was 10.3, dropping the
// student Attendance/Experience tabs was 10.7, the audit item is 10.8.
export const NAV_ITEMS: Record<Role, NavItem[]> = {
  admin: [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    // Schedule = sessions (Month calendar / List agenda). Courses = the table,
    // a separate destination. (task 10.3)
    { href: '/admin/schedule', label: 'Schedule', icon: CalendarRange },
    { href: '/admin/courses', label: 'Courses', icon: BookOpen },
    { href: '/admin/course-types', label: 'Course Types', icon: Tags },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/missed-sessions', label: 'Missed Sessions', icon: Flag },
    { href: '/admin/notification-preferences', label: 'Notifications', icon: Bell },
  ],
  instructor: [
    { href: '/instructor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/instructor/calendar', label: 'Calendar', icon: CalendarDays },
  ],
  student: [
    { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/student/courses', label: 'Browse Courses', icon: Search },
    // My Courses absorbed Attendance + Experience in 10.7 — schedule,
    // attendance status, and past courses are one destination now.
    { href: '/student/my-courses', label: 'My Courses', icon: GraduationCap },
    { href: '/student/account', label: 'Account', icon: CircleUser },
  ],
}
