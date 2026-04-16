import { createClient } from '@/lib/supabase/server'
import RegisterForm from './register-form'

export default async function RegisterPage() {
  const supabase = await createClient()

  const { data: codes } = await supabase
    .from('codes')
    .select('value, label, description')
    .eq('category', 'experience_level')
    .eq('is_active', true)
    .order('sort_order')

  return <RegisterForm experienceCodes={codes ?? []} />
}
