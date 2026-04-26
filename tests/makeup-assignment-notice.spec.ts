import { expect, test } from '@playwright/test'
import { createEnrolledCourse, runId } from './helpers'

const BASE = 'http://localhost:3000'

// Mock buffer is shared module-level state. Same constraints as
// notifications.spec.ts and the other notification specs: serialize within a
// worker AND scope to desktop only.
test.describe.configure({ mode: 'serial' })

test.describe('3.6 — makeup assignment notice', () => {
  test.beforeEach(async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'mock buffer is shared module state — desktop only')
    const resp = await request.delete(`${BASE}/api/test/notifications`)
    expect(resp.ok()).toBeTruthy()
  })

  test('creating a makeup fires email per affected student', async ({ browser, request }) => {
    test.setTimeout(120000)

    const title = `MakeupNotify-${runId()}`
    const { courseId, sessionId } = await createEnrolledCourse(browser, { title })

    // Cancel the session so the student's attendance flips to 'missed'.
    // notify: false here — we don't want the cancellation entries in the buffer
    // when we assert on the makeup notice below.
    const cancelResp = await request.post(`${BASE}/api/test/cancel-session`, {
      data: { sessionId, cancelReason: 'Weather', notify: false },
    })
    expect(cancelResp.ok()).toBeTruthy()

    // Now create the makeup with notify: true
    const makeupResp = await request.post(`${BASE}/api/test/create-makeup-session`, {
      data: {
        originalSessionId: sessionId,
        courseId,
        date: '2027-09-22',
        startTime: '09:00',
        endTime: '17:00',
        location: 'Edgewater Park (Makeup)',
        notify: true,
      },
    })
    expect(makeupResp.ok()).toBeTruthy()

    const log = await request.get(`${BASE}/api/test/notifications`)
    const { entries } = (await log.json()) as {
      entries: { channel: 'sms' | 'email'; to: string; subject?: string; body: string }[]
    }

    const studentEmail = entries.filter(
      (e) =>
        e.channel === 'email' &&
        e.to === 'pw_student@ltsc.test' &&
        e.subject?.startsWith('Makeup scheduled:'),
    )
    expect(studentEmail).toHaveLength(1)
    expect(studentEmail[0].body).toContain(title)
    expect(studentEmail[0].body).toContain('Edgewater Park (Makeup)')

    // No admin notice on makeup assignment (admin scheduled it).
    const adminEmail = entries.filter(
      (e) =>
        e.channel === 'email' &&
        e.subject?.startsWith('Makeup scheduled:') &&
        e.to.includes('admin'),
    )
    expect(adminEmail).toHaveLength(0)
  })

  test('notify flag off produces no messages', async ({ browser, request }) => {
    test.setTimeout(120000)

    const title = `MakeupNoNotify-${runId()}`
    const { courseId, sessionId } = await createEnrolledCourse(browser, { title })

    await request.post(`${BASE}/api/test/cancel-session`, {
      data: { sessionId, notify: false },
    })

    const makeupResp = await request.post(`${BASE}/api/test/create-makeup-session`, {
      data: {
        originalSessionId: sessionId,
        courseId,
        date: '2027-09-22',
        startTime: '09:00',
        endTime: '17:00',
        location: 'Edgewater Park',
      }, // notify omitted
    })
    expect(makeupResp.ok()).toBeTruthy()

    const log = await request.get(`${BASE}/api/test/notifications`)
    const { entries } = (await log.json()) as { entries: unknown[] }
    expect(entries).toHaveLength(0)
  })

  test('makeup with no missed students sends nothing', async ({ browser, request }) => {
    test.setTimeout(120000)

    const title = `MakeupEmpty-${runId()}`
    const { courseId, sessionId } = await createEnrolledCourse(browser, { title })

    // Skip the cancel step — without 'missed' attendance, no one has anything
    // to make up. The trigger should short-circuit.
    const makeupResp = await request.post(`${BASE}/api/test/create-makeup-session`, {
      data: {
        originalSessionId: sessionId,
        courseId,
        date: '2027-09-22',
        startTime: '09:00',
        endTime: '17:00',
        notify: true,
      },
    })
    expect(makeupResp.ok()).toBeTruthy()

    const log = await request.get(`${BASE}/api/test/notifications`)
    const { entries } = (await log.json()) as { entries: unknown[] }
    expect(entries).toHaveLength(0)
  })
})
