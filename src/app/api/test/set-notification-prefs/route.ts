/**
 * DEV/TEST ONLY — directly writes notification_preferences for a profile by
 * email. Bypasses the form/auth path so dispatcher gating tests can set
 * arbitrary prefs in one POST without UI navigation.
 *
 * Gated behind devOnly() — refused on any Vercel deployment.
 *
 * POST /api/test/set-notification-prefs
 * Body: { email: string, prefs: object }
 *  - prefs is written verbatim into the column. Pass null to clear.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/supabase/types'
import { devOnly } from '@/lib/dev-only'

export async function POST(req: NextRequest) {
  const blocked = devOnly()
  if (blocked) return blocked

  const { email, prefs } = (await req.json()) as {
    email: string
    prefs: Json | null
  }

  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
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

  const { error } = await admin
    .from('profiles')
    .update({ notification_preferences: prefs })
    .eq('id', profile.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
