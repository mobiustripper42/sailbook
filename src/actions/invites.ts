'use server'

import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type InviteRole = 'instructor' | 'admin'

function generateToken() {
  return randomBytes(24).toString('base64url')
}

export async function regenerateInvite(role: InviteRole) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()
  if (!callerProfile?.is_admin) return { error: 'Unauthorized.' }

  const token = generateToken()
  const { error } = await supabase
    .from('invites')
    .upsert(
      { role, token, created_by: user.id, created_at: new Date().toISOString() },
      { onConflict: 'role' },
    )
  if (error) return { error: error.message }

  revalidatePath('/admin/instructors')
  revalidatePath('/admin/users')
  return { error: null }
}

export async function acceptInstructorInvite(token: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in to accept an invite.' }

  const { data: ok, error: rpcError } = await supabase.rpc('accept_invite', {
    p_role: 'instructor',
    p_token: token,
  })
  if (rpcError) return { error: rpcError.message }
  if (!ok) return { error: 'This invite link is invalid or has been revoked.' }

  // Propagate the new role flag into user_metadata, then force a session
  // refresh so the new JWT (with is_instructor=true) lands in the cookie
  // before the redirect. updateUser alone does not re-issue the access
  // token, so without refreshSession the proxy would read a stale JWT on
  // the next request and bounce the user off /instructor/*.
  const { error: metaError } = await supabase.auth.updateUser({
    data: { is_instructor: true },
  })
  if (metaError) return { error: metaError.message }

  const { error: refreshError } = await supabase.auth.refreshSession()
  if (refreshError) return { error: refreshError.message }

  redirect('/instructor/dashboard')
}
