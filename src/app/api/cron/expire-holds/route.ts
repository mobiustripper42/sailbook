import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyCron } from '@/lib/cron-auth'

export async function GET(req: NextRequest) {
  const blocked = verifyCron(req)
  if (blocked) return blocked

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('enrollments')
    .update({ status: 'cancelled' })
    .eq('status', 'pending_payment')
    .lt('hold_expires_at', new Date().toISOString())
    .select('id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ expired: data?.length ?? 0 })
}
