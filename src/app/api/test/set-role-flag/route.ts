/**
 * DEV/TEST ONLY — toggles a role flag on a profile by email.
 * Gated behind devOnly() — local dev only, refused on Vercel deployments.
 *
 * POST /api/test/set-role-flag
 * Body: { email: string; flag: 'is_admin'|'is_instructor'|'is_student'; value: boolean }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { devOnly } from '@/lib/dev-only'

const ALLOWED_FLAGS = ['is_admin', 'is_instructor', 'is_student'] as const
type Flag = (typeof ALLOWED_FLAGS)[number]

export async function POST(req: NextRequest) {
  const blocked = devOnly()
  if (blocked) return blocked

  const { email, flag, value } = (await req.json()) as {
    email: string
    flag: Flag
    value: boolean
  }

  if (!email || !(ALLOWED_FLAGS as readonly string[]).includes(flag) || typeof value !== 'boolean') {
    return NextResponse.json({ error: 'email, flag, and value are required' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const admin = createClient<Database>(supabaseUrl, serviceKey)

  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({ error: `No profile found for ${email}` }, { status: 404 })
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({ [flag]: value })
    .eq('id', profile.id)
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  // Merge the flag into user_metadata so existing keys (first_name, etc.) survive.
  const { data: userData, error: getErr } = await admin.auth.admin.getUserById(profile.id)
  if (getErr) return NextResponse.json({ error: getErr.message }, { status: 500 })

  const currentMeta = (userData.user?.user_metadata ?? {}) as Record<string, unknown>
  const { error: metaError } = await admin.auth.admin.updateUserById(profile.id, {
    user_metadata: { ...currentMeta, [flag]: value },
  })
  if (metaError) return NextResponse.json({ error: metaError.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
