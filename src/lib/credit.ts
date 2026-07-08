// #106/#107 — single source of truth for a student's account credit balance.
// credit_ledger is an append-only table (DEC-035); balance is always
// SUM(amount_cents) — never a separately-stored column. Positive rows are
// issuance (#106, admin-initiated), negative rows are redemption (#107, at
// checkout).

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Client = SupabaseClient<Database>

export async function getCreditBalanceCents(client: Client, studentId: string): Promise<number> {
  const { data, error } = await client
    .from('credit_ledger')
    .select('amount_cents')
    .eq('student_id', studentId)

  if (error) {
    console.error('getCreditBalanceCents: lookup failed', error)
    return 0
  }

  return (data ?? []).reduce((sum, r) => sum + r.amount_cents, 0)
}
