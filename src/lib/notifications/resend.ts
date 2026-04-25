import type { EmailParams, NotificationResult } from './index'

const FROM_DEFAULT = 'SailBook <info@sailbook.live>'

export async function sendEmail(params: EmailParams): Promise<NotificationResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { ok: false, error: 'Resend API key not configured' }
  }

  try {
    // @ts-expect-error — resend package added with task 3.2; remove this directive when installed.
    const resendMod = await import('resend')
    const client = new resendMod.Resend(apiKey)
    const result = await client.emails.send({
      from: FROM_DEFAULT,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    })
    if (result.error) {
      return { ok: false, error: result.error.message }
    }
    return { ok: true, providerId: result.data?.id }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
