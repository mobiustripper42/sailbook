import type { NotificationResult, SMSParams } from './index'

export async function sendSMS(params: SMSParams): Promise<NotificationResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_NUMBER

  if (!sid || !token || !from) {
    return { ok: false, error: 'Twilio credentials not configured' }
  }

  try {
    // Named import + constructor — avoids leaning on CJS/ESM default-interop
    // (`twilioMod.default(...)` works today but is fragile across bundlers).
    const { Twilio } = await import('twilio')
    const client = new Twilio(sid, token)
    const msg = await client.messages.create({
      body: params.body,
      from,
      to: params.to,
    })
    return { ok: true, providerId: msg.sid }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
