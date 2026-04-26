/**
 * DEV/TEST ONLY — assigns an instructor to a course by email.
 * Gated behind devOnly() — local dev only, refused on Vercel deployments.
 *
 * POST /api/test/assign-instructor
 * Body: { courseId: string; instructorEmail: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { devOnly } from '@/lib/dev-only'

export async function POST(req: NextRequest) {
  const blocked = devOnly()
  if (blocked) return blocked

  const { courseId, instructorEmail } = await req.json() as {
    courseId: string
    instructorEmail: string
  }

  if (!courseId || !instructorEmail) {
    return NextResponse.json({ error: 'courseId and instructorEmail are required' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const admin = createClient<Database>(supabaseUrl, serviceKey)

  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', instructorEmail)
    .eq('is_instructor', true)
    .single()

  if (!profile) {
    return NextResponse.json({ error: `No instructor found for ${instructorEmail}` }, { status: 404 })
  }

  const { error } = await admin
    .from('courses')
    .update({ instructor_id: profile.id })
    .eq('id', courseId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
