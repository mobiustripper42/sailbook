import type { EmailParams, NotificationResult, SMSParams } from './index'

export type MockEntry = {
  channel: 'sms' | 'email'
  to: string
  subject?: string
  body: string
  at: string
}

const buffer: MockEntry[] = []

export function mockSendSMS(params: SMSParams): NotificationResult {
  const entry: MockEntry = {
    channel: 'sms',
    to: params.to,
    body: params.body,
    at: new Date().toISOString(),
  }
  buffer.push(entry)
  console.log('[notifications:mock] SMS', entry)
  return { ok: true, providerId: `mock-sms-${buffer.length}` }
}

export function mockSendEmail(params: EmailParams): NotificationResult {
  const entry: MockEntry = {
    channel: 'email',
    to: params.to,
    subject: params.subject,
    body: params.text,
    at: new Date().toISOString(),
  }
  buffer.push(entry)
  console.log('[notifications:mock] Email', entry)
  return { ok: true, providerId: `mock-email-${buffer.length}` }
}

export function getMockBuffer(): readonly MockEntry[] {
  return buffer
}

export function clearMockBuffer(): void {
  buffer.length = 0
}
