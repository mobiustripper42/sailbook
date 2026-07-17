'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { MailingAddress } from '@/lib/address'

/**
 * The signed-in student's own mailing address. Used to pre-fill the ASA-enroll
 * confirm dialog (#129). Reads via the user's client — RLS scopes it to their
 * own profile row.
 */
export async function getMyAddress(): Promise<MailingAddress | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('address_line1, address_line2, city, state, postal_code')
    .eq('id', user.id)
    .single()

  return data ?? null
}

/**
 * Save the signed-in student's mailing address (#129). Line 1, city, state, and
 * postal code are required; line 2 is optional. Self-update only — the user's
 * client enforces RLS to their own row.
 */
export async function updateMyAddress(formData: FormData): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const line1 = (formData.get('address_line1') as string)?.trim() || ''
  const line2 = (formData.get('address_line2') as string)?.trim() || ''
  const city = (formData.get('city') as string)?.trim() || ''
  const state = (formData.get('state') as string)?.trim().toUpperCase() || ''
  const postal = (formData.get('postal_code') as string)?.trim() || ''

  if (!line1 || !city || !state || !postal) {
    return { error: 'Street address, city, state, and ZIP are required.' }
  }
  if (state.length !== 2) {
    return { error: 'State must be a 2-letter abbreviation (e.g. OH).' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      address_line1: line1,
      address_line2: line2 || null,
      city,
      state,
      postal_code: postal,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/student/account')
  return { error: null }
}
