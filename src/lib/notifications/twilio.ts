import type { NotificationResult, SMSParams } from './index'

export async function sendSMS(params: SMSParams): Promise<NotificationResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_NUMBER

  if (!sid || !token || !from) {
    return { ok: false, error: 'Twilio credentials not configured' }
  }

  try {
    // @ts-expect-error — twilio package added with task 3.1; remove this directive when installed.
    const twilioMod = await import('twilio')
    const client = twilioMod.default(sid, token)
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
