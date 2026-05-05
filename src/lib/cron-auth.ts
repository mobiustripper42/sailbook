import { NextRequest, NextResponse } from 'next/server'

/**
 * Auth gate for /api/cron/* routes.
 *
 * In production, `CRON_SECRET` MUST be set — if it's missing, the route is
 * blocked. This prevents a misconfigured Vercel deploy (env var dropped or
 * never set) from silently exposing cron handlers to the open internet.
 *
 * When the secret is set (any env), the request must include
 * `Authorization: Bearer $CRON_SECRET`. Vercel Cron sends this header
 * automatically when configured at the project level.
 *
 * In dev (`CRON_SECRET` unset, `NODE_ENV !== 'production'`), the route is
 * open so local invocations and tests don't need the header.
 *
 * Returns a NextResponse if the caller should be blocked, otherwise null.
 * Use at the top of every cron route handler:
 *
 *     const blocked = verifyCron(req)
 *     if (blocked) return blocked
 */
export function verifyCron(req: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET

  if (process.env.NODE_ENV === 'production' && !cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 },
    )
  }

  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return null
}
