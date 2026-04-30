import { expect, test } from '@playwright/test'
import { createEnrolledCourse, runId } from './helpers'

const BASE = 'http://localhost:3000'

// Mock buffer is shared module-level state. Same constraints as
// notifications.spec.ts and enrollment-notifications.spec.ts: serialize
// within a worker AND scope to desktop only.
test.describe.configure({ mode: 'serial' })

test.describe('3.5 — session cancellation notice', () => {
  test.beforeEach(async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'mock buffer is shared module state — desktop only')
    const resp = await request.delete(`${BASE}/api/test/notifications`)
    expect(resp.ok()).toBeTruthy()
  })

  test('cancelling a session fires email per affected student (with reason)', async ({ browser, request }) => {
    test.setTimeout(90000)

    const title = `CancelNotify-${runId()}`
    const { sessionId } = await createEnrolledCourse(browser, { title })

    const cancelResp = await request.post(`${BASE}/api/test/cancel-session`, {
      data: {
        sessionId,
        cancelReason: 'Weather — gale-force winds forecast',
        notify: true,
      },
    })
    expect(cancelResp.ok()).toBeTruthy()

    const log = await request.get(`${BASE}/api/test/notifications`)
    const { entries } = (await log.json()) as {
      entries: { channel: 'sms' | 'email'; to: string; subject?: string; body: string }[]
    }

    // pw_student is enrolled by createEnrolledCourse — should receive one email.
    // Seed users now share +14403631199 so SMS dispatches too.
    const studentEmail = entries.filter(
      (e) =>
        e.channel === 'email' &&
        e.to === 'pw_student@ltsc.test' &&
        e.subject?.startsWith('Cancelled:'),
    )
    expect(studentEmail).toHaveLength(1)
    expect(studentEmail[0].body).toContain(title)
    expect(studentEmail[0].body).toContain('Weather')

    // Admins are not notified on session cancellation (they did the cancelling).
    const adminEmail = entries.filter(
      (e) =>
        e.channel === 'email' &&
        e.subject?.startsWith('Cancelled:') &&
        e.to.includes('admin'),
    )
    expect(adminEmail).toHaveLength(0)
  })

  test('cancelling without a reason omits the reason line', async ({ browser, request }) => {
    test.setTimeout(90000)

    const title = `CancelNoReason-${runId()}`
    const { sessionId } = await createEnrolledCourse(browser, { title })

    const cancelResp = await request.post(`${BASE}/api/test/cancel-session`, {
      data: { sessionId, notify: true }, // cancelReason omitted
    })
    expect(cancelResp.ok()).toBeTruthy()

    const log = await request.get(`${BASE}/api/test/notifications`)
    const { entries } = (await log.json()) as {
      entries: { channel: 'sms' | 'email'; to: string; subject?: string; body: string }[]
    }

    const studentEmail = entries.find(
      (e) =>
        e.channel === 'email' &&
        e.to === 'pw_student@ltsc.test' &&
        e.subject?.startsWith('Cancelled:'),
    )
    expect(studentEmail).toBeDefined()
    expect(studentEmail!.body).not.toContain('Reason:')
  })

  test('notify flag off produces no messages', async ({ browser, request }) => {
    test.setTimeout(90000)

    const title = `CancelNoNotify-${runId()}`
    const { sessionId } = await createEnrolledCourse(browser, { title })

    const cancelResp = await request.post(`${BASE}/api/test/cancel-session`, {
      data: { sessionId, cancelReason: 'Test' }, // notify omitted → false
    })
    expect(cancelResp.ok()).toBeTruthy()

    const log = await request.get(`${BASE}/api/test/notifications`)
    const { entries } = (await log.json()) as { entries: unknown[] }
    expect(entries).toHaveLength(0)
  })
})
