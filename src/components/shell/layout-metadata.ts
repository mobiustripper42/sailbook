import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

// Shared generateMetadata for the role layouts — title is "SailBook - <first
// name>" when signed in, else "SailBook".
export async function roleLayoutMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const firstName = user?.user_metadata?.first_name
  return { title: firstName ? `SailBook - ${firstName}` : 'SailBook' }
}
