import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Tags,
  Users,
  Flag,
  Bell,
  Search,
  GraduationCap,
  ClipboardCheck,
  Award,
  CircleUser,
  type LucideIcon,
} from 'lucide-react'

export type Role = 'admin' | 'instructor' | 'student'

export type NavItem = { href: string; label: string; icon: LucideIcon }

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

// Nav item lists match the pre-redesign navs 1:1 (task 10.2 is shell
// unification only). Route/tab changes land later: /schedule merge is 10.3,
// dropping student Attendance/Experience is 10.7, the audit item is 10.8.
export const NAV_ITEMS: Record<Role, NavItem[]> = {
  admin: [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/calendar', label: 'Calendar', icon: CalendarDays },
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
    { href: '/student/my-courses', label: 'My Courses', icon: GraduationCap },
    { href: '/student/attendance', label: 'Attendance', icon: ClipboardCheck },
    { href: '/student/history', label: 'Experience', icon: Award },
    { href: '/student/account', label: 'Account', icon: CircleUser },
  ],
}
