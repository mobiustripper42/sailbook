import { redirect } from 'next/navigation'

/**
 * Send a freshly-authenticated user to their role's dashboard.
 *
 * Reads the role flags off Supabase `user_metadata`. Calls `redirect()`,
 * which throws (`never`) — so this never returns; call it last in a server
 * action. Shared by `login`, `updatePassword`, and `verifyEmailCode` so the
 * role→dashboard mapping lives in exactly one place.
 */
export function redirectForRole(
  meta: Record<string, unknown> | null | undefined,
): never {
  const m = meta ?? {}
  if (m.is_admin) redirect('/admin/dashboard')
  if (m.is_instructor) redirect('/instructor/dashboard')
  redirect('/student/dashboard')
}
