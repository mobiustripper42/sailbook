import { expect, test } from '@playwright/test'

const BASE = 'http://localhost:3000'

// The notification dispatcher routes to the mock when NOTIFICATIONS_ENABLED is
// not "true". Local dev defaults to mock; these tests assert the wiring (mock
// is reachable, buffer captures calls, dispatcher returns success). Real
// Twilio/Resend calls aren't covered here — they're gated by env in 3.1/3.2.
//
// The mock buffer is module-level state in the single dev-server Node process.
// Parallel viewport workers stomp on each other (one's DELETE clears another's
// just-posted entry), so we serialize within a worker AND scope to desktop
// only. The skip sits in beforeEach so non-desktop workers don't even run the
// DELETE step. Buffer behavior isn't viewport-specific.
test.describe.configure({ mode: 'serial' })

test.describe('Notification service — mock dispatch', () => {
  test.beforeEach(async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'mock buffer is shared module state — desktop only')
    const resp = await request.delete(`${BASE}/api/test/notifications`)
    expect(resp.ok()).toBeTruthy()
  })

  test('SMS dispatch routes to mock and appears in buffer', async ({ request }) => {
    const send = await request.post(`${BASE}/api/test/notifications`, {
      data: { channel: 'sms', to: '+15555550100', body: 'Test SMS body' },
    })
    expect(send.ok()).toBeTruthy()
    const sendBody = (await send.json()) as { ok: boolean; providerId?: string; error?: string }
    expect(sendBody.ok).toBe(true)
    expect(sendBody.providerId).toMatch(/^mock-sms-/)

    const log = await request.get(`${BASE}/api/test/notifications`)
    const { entries } = (await log.json()) as { entries: { channel: string; to: string; body: string }[] }
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      channel: 'sms',
      to: '+15555550100',
      body: 'Test SMS body',
    })
  })

  test('Email dispatch routes to mock with subject + body', async ({ request }) => {
    const send = await request.post(`${BASE}/api/test/notifications`, {
      data: {
        channel: 'email',
        to: 'student@example.com',
        subject: 'Enrollment confirmed',
        body: 'You are in!',
      },
    })
    expect(send.ok()).toBeTruthy()
    const sendBody = (await send.json()) as { ok: boolean; providerId?: string }
    expect(sendBody.ok).toBe(true)
    expect(sendBody.providerId).toMatch(/^mock-email-/)

    const log = await request.get(`${BASE}/api/test/notifications`)
    const { entries } = (await log.json()) as {
      entries: { channel: string; to: string; subject?: string; body: string }[]
    }
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      channel: 'email',
      to: 'student@example.com',
      subject: 'Enrollment confirmed',
      body: 'You are in!',
    })
  })

  test('Buffer accumulates across calls and clear empties it', async ({ request }) => {
    await request.post(`${BASE}/api/test/notifications`, {
      data: { channel: 'sms', to: '+15555550101', body: 'first' },
    })
    await request.post(`${BASE}/api/test/notifications`, {
      data: { channel: 'sms', to: '+15555550102', body: 'second' },
    })

    let log = await request.get(`${BASE}/api/test/notifications`)
    let body = (await log.json()) as { entries: unknown[] }
    expect(body.entries).toHaveLength(2)

    await request.delete(`${BASE}/api/test/notifications`)
    log = await request.get(`${BASE}/api/test/notifications`)
    body = (await log.json()) as { entries: unknown[] }
    expect(body.entries).toHaveLength(0)
  })

  test('Invalid channel returns 400', async ({ request }) => {
    const send = await request.post(`${BASE}/api/test/notifications`, {
      data: { channel: 'pigeon', to: '+15555550103', body: 'noted' },
    })
    expect(send.status()).toBe(400)
  })
})
