import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeNextPath } from '@/lib/auth/safe-next'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = safeNextPath(url.searchParams.get('next')) ?? '/student/dashboard'

  // Trust the Host header only when it matches an allow-list — the canonical
  // site host (production) or localhost/127.0.0.1 any-port (dev: Hetzner's :3000
  // AND VS Code Remote-SSH's random forwarded port like :55934 both work). A
  // spoofed Host falls back to NEXT_PUBLIC_SITE_URL so it can't be used to
  // redirect users off-site post-auth.
  const hostHeader = request.headers.get('host') ?? ''
  const proto = request.headers.get('x-forwarded-proto') ?? 'http'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const siteHost = siteUrl ? new URL(siteUrl).host : null
  const isAllowedHost =
    hostHeader === siteHost ||
    /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(hostHeader)
  const baseUrl = isAllowedHost
    ? `${proto}://${hostHeader}`
    : (siteUrl ?? url.origin)

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
