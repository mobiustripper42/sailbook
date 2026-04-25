/**
 * DEV/TEST ONLY — exercises the notification dispatcher and reads the mock buffer.
 * Gated behind NODE_ENV !== 'development'. Never deploy with NODE_ENV=development.
 *
 * GET    /api/test/notifications        → returns mock buffer entries
 * POST   /api/test/notifications        → { channel: 'sms'|'email', to, subject?, body } → sends via dispatcher
 * DELETE /api/test/notifications        → clears the mock buffer
 */
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, sendSMS } from '@/lib/notifications'
import { clearMockBuffer, getMockBuffer } from '@/lib/notifications/mock'

function devOnly() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 403 })
  }
  return null
}

export async function GET() {
  const blocked = devOnly()
  if (blocked) return blocked
  return NextResponse.json({ entries: getMockBuffer() })
}

export async function POST(req: NextRequest) {
  const blocked = devOnly()
  if (blocked) return blocked

  const body = (await req.json()) as {
    channel: 'sms' | 'email'
    to: string
    subject?: string
    body: string
  }

  if (!body.to || !body.body || (body.channel !== 'sms' && body.channel !== 'email')) {
    return NextResponse.json(
      { error: 'channel ("sms"|"email"), to, and body are required' },
      { status: 400 },
    )
  }

  const result =
    body.channel === 'sms'
      ? await sendSMS({ to: body.to, body: body.body })
      : await sendEmail({
          to: body.to,
          subject: body.subject ?? '(no subject)',
          text: body.body,
        })

  return NextResponse.json(result)
}

export async function DELETE() {
  const blocked = devOnly()
  if (blocked) return blocked
  clearMockBuffer()
  return NextResponse.json({ ok: true })
}
