'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(_: unknown, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) return { error: error.message }

  redirect('/')
}

export async function register(_: unknown, formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const phone = (formData.get('phone') as string) || null
  const experienceLevel = (formData.get('experienceLevel') as string) || null

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role: 'student', first_name: firstName, last_name: lastName },
    },
  })

  if (error) return { error: error.message }

  if (data.user) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
      role: 'student',
      experience_level: experienceLevel,
    })

    if (profileError) return { error: 'Account created but profile setup failed.' }
  }

  redirect('/')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
