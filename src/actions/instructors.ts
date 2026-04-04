'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function toggleInstructorActive(id: string, currentlyActive: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: !currentlyActive, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/instructors')
  return { error: null }
}
