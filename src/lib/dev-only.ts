import { NextResponse } from 'next/server'

/**
 * Gate for /api/test/* routes — refuse access unless we're on a local dev box
 * or in CI. `VERCEL_ENV` always wins: any Vercel deploy is blocked outright.
 *
 * Two unlock paths:
 *   1. Local `next dev` — NODE_ENV === 'development'
 *   2. CI — CI === 'true' AND NEXT_PUBLIC_DEV_MODE === 'true' (both required;
 *      single env vars are too easy to set by accident).
 */
export function devOnly(): NextResponse | null {
  const isDev = process.env.NODE_ENV === 'development'
  const isCI = process.env.CI === 'true' && process.env.NEXT_PUBLIC_DEV_MODE === 'true'
  if ((!isDev && !isCI) || process.env.VERCEL_ENV) {
    return NextResponse.json({ error: 'Not available' }, { status: 403 })
  }
  return null
}
