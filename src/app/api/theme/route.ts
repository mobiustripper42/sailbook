import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_THEMES = ['light', 'dark', 'system'] as const
type Theme = typeof VALID_THEMES[number]

export async function POST(request: Request) {
  try {
    const body = await request.json() as { theme?: unknown }
    const theme = body.theme

    if (!VALID_THEMES.includes(theme as Theme)) {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await supabase
      .from('profiles')
      .update({ theme_preference: theme })
      .eq('id', user.id)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
