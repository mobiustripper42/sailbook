import { mockSendEmail, mockSendSMS } from './mock'

export type SMSParams = {
  to: string
  body: string
}

export type EmailParams = {
  to: string
  subject: string
  text: string
  html?: string
}

export type NotificationResult = {
  ok: boolean
  error?: string
  providerId?: string
}

function notificationsEnabled(): boolean {
  return process.env.NOTIFICATIONS_ENABLED === 'true'
}

// Mock is statically imported so the dispatcher and the test API route
// share one module instance (and thus one buffer). Real providers stay
// lazy-loaded — their npm packages aren't installed until 3.1/3.2.

export async function sendSMS(params: SMSParams): Promise<NotificationResult> {
  if (!notificationsEnabled()) {
    return mockSendSMS(params)
  }
  const { sendSMS: twilioSend } = await import('./twilio')
  return twilioSend(params)
}

export async function sendEmail(params: EmailParams): Promise<NotificationResult> {
  if (!notificationsEnabled()) {
    return mockSendEmail(params)
  }
  const { sendEmail: resendSend } = await import('./resend')
  return resendSend(params)
}
