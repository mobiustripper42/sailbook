/**
 * DEV/TEST ONLY — sets or clears a profile's mailing address by email (#129).
 * Gated behind devOnly() — local dev only, refused on Vercel deployments.
 *
 * POST /api/test/set-address
 * Body: { email: string; address?: { address_line1, address_line2?, city, state, postal_code } | null }
 *   - address omitted or null clears all five columns (for the ASA-gate test).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { devOnly } from '@/lib/dev-only'

export async function POST(req: NextRequest) {
  const blocked = devOnly()
  if (blocked) return blocked

  const { email, address } = (await req.json()) as {
    email: string
    address?: {
      address_line1: string
      address_line2?: string | null
      city: string
      state: string
      postal_code: string
    } | null
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

  const update = address
    ? {
        address_line1: address.address_line1,
        address_line2: address.address_line2 ?? null,
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
      }
    : {
        address_line1: null,
        address_line2: null,
        city: null,
        state: null,
        postal_code: null,
      }

  const { error } = await admin.from('profiles').update(update).eq('id', profile.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
