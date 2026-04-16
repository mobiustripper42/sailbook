/**
 * DEV/TEST ONLY — assigns an instructor to a course by email.
 * Gated behind NODE_ENV !== 'development'. Never deploy with NODE_ENV=development.
 *
 * POST /api/test/assign-instructor
 * Body: { courseId: string; instructorEmail: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 403 })
  }

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
