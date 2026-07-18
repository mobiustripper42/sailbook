'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  addressInputToColumns,
  readAddressForm,
  validateAddressInput,
  type MailingAddress,
} from '@/lib/address'

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

  const parsed = readAddressForm(formData)
  const validationError = validateAddressInput(parsed, { required: true })
  if (validationError) return { error: validationError }

  const { error } = await supabase
    .from('profiles')
    .update({
      ...addressInputToColumns(parsed),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/student/account')
  return { error: null }
}
