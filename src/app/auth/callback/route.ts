import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const nextParam = url.searchParams.get('next')

  // Only allow same-origin paths (single leading slash, no protocol-relative).
  const next =
    nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
      ? nextParam
      : '/student/dashboard'

  // Prefer the Host header (the URL the browser actually used — VS Code
  // Remote-SSH preserves it through the tunnel, so Eric's :55934 and
  // Playwright's :3000 both round-trip correctly). Fall back to
  // NEXT_PUBLIC_SITE_URL, then to request.url's origin.
  const hostHeader = request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') ?? 'http'
  const baseUrl = hostHeader
    ? `${proto}://${hostHeader}`
    : (process.env.NEXT_PUBLIC_SITE_URL ?? url.origin)

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${baseUrl}/login?error=invalid_link`)
  }

  return NextResponse.redirect(`${baseUrl}${next}`)
}
