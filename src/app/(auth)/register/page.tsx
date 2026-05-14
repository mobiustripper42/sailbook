import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { isSMSEnabled } from '@/lib/notifications/preferences'
import RegisterForm from './register-form'

export default async function RegisterPage() {
  const supabase = await createClient()

  const { data: codes } = await supabase
    .from('codes')
    .select('value, label, description')
    .eq('category', 'experience_level')
    .eq('is_active', true)
    .order('sort_order')

  // RegisterForm uses useSearchParams() — Suspense bailout required for build.
  return (
    <Suspense>
      <RegisterForm experienceCodes={codes ?? []} smsEnabled={isSMSEnabled()} />
    </Suspense>
  )
}
