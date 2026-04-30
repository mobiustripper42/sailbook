import { NextResponse } from 'next/server'

/**
 * Gate for /api/test/* routes — refuse access unless we're on a local dev box.
 *
 * Belt-and-suspenders: requires `NODE_ENV === 'development'` AND requires
 * `VERCEL_ENV` to be unset. `VERCEL_ENV` is always set on Vercel deployments
 * (preview/production), so this prevents a misconfigured `NODE_ENV=development`
 * on a Vercel deploy from exposing service-role-key writes.
 *
 * Returns a 403 NextResponse if the caller should be blocked, otherwise null.
 * Use at the top of every test route handler:
 *
 *     const blocked = devOnly()
 *     if (blocked) return blocked
 */
export function devOnly(): NextResponse | null {
  if (process.env.NODE_ENV !== 'development' || process.env.VERCEL_ENV) {
    return NextResponse.json({ error: 'Not available' }, { status: 403 })
  }
  return null
}
