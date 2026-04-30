/**
 * DEV/TEST ONLY — force-confirms a user's email by setting email_confirmed_at
 * via the admin API. Lets Playwright tests simulate clicking a confirmation
 * link without parsing Inbucket emails.
 *
 * Gated behind devOnly() — refused on any Vercel deployment.
 *
 * POST /api/test/confirm-email
 * Body: { email: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { devOnly } from '@/lib/dev-only'

export async function POST(req: NextRequest) {
  const blocked = devOnly()
  if (blocked) return blocked

  const { email } = (await req.json()) as { email: string }

  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const admin = createClient<Database>(supabaseUrl, serviceKey)

  // listUsers paginates; for tests we only need the first page (max 1000 users
  // locally) and we filter in JS — Supabase admin API has no built-in email filter.
  const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 })
  }

  const user = list.users.find((u) => u.email === email)
  if (!user) {
    return NextResponse.json({ error: `No user found for ${email}` }, { status: 404 })
  }

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    email_confirm: true,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
