type RoleMeta = {
  is_admin?: boolean
  is_instructor?: boolean
  is_student?: boolean
}

export function getPrimaryHome(meta: RoleMeta | Record<string, unknown>): string {
  const m = meta as RoleMeta
  if (m.is_admin) return '/admin/dashboard'
  if (m.is_instructor) return '/instructor/dashboard'
  return '/student/dashboard'
}
