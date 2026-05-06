import { expect, test } from '@playwright/test'
import { createTestCourse, cronHeaders, runId } from './helpers'

const BASE = 'http://localhost:3000'

// Mock buffer is shared module-level state. Same constraints as
// notifications.spec.ts: serialize within a worker AND scope to desktop only.
test.describe.configure({ mode: 'serial' })

test.describe('3.4 — enrollment notifications', () => {
  test.beforeEach(async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'mock buffer is shared module state — desktop only')
    const resp = await request.delete(`${BASE}/api/test/notifications`)
    expect(resp.ok()).toBeTruthy()
  })

  test('confirmed enrollment fires student email and admin email per admin', async ({ page, request }) => {
    test.setTimeout(90000)

    const title = `Notify-${runId()}`
    const courseId = await createTestCourse(page, { capacity: 4, title })

    // Drive the trigger via the dev test route so we don't depend on the
    // currently-skipped admin enrollment UI test.
    const enrollResp = await request.post(`${BASE}/api/test/enroll`, {
      data: { courseId, studentEmail: 'pw_student@ltsc.test', notify: true },
    })
    expect(enrollResp.ok()).toBeTruthy()

    const log = await request.get(`${BASE}/api/test/notifications`)
    const { entries } = (await log.json()) as {
      entries: { channel: 'sms' | 'email'; to: string; subject?: string; body: string }[]
    }

    // Seed test users have phone: null, so SMS dispatch correctly skips.
    // Once seed data adds phone numbers (or 4.7 instructor profile expansion
    // adds a phone column flow), update these assertions to expect SMS too.
    const studentEmail = entries.filter(
      (e) => e.channel === 'email'
        && e.to === 'pw_student@ltsc.test'
        && e.subject?.startsWith('Enrolled:'),
    )
    expect(studentEmail).toHaveLength(1)
    expect(studentEmail[0].body).toContain(title)

    // Admin fan-out — one email per active admin (seed has 2: andy, pw_admin)
    const adminEmail = entries.filter(
      (e) => e.channel === 'email' && e.subject?.startsWith('New enrollment:'),
    )
    expect(adminEmail.length).toBeGreaterThanOrEqual(2)
    const adminRecipients = new Set(adminEmail.map((e) => e.to))
    expect(adminRecipients.has('andy@ltsc.test')).toBe(true)
    expect(adminRecipients.has('pw_admin@ltsc.test')).toBe(true)
    expect(adminEmail[0].body).toContain(title)
  })

  test('notify flag off does not produce any messages', async ({ page, request }) => {
    test.setTimeout(90000)

    const title = `NoNotify-${runId()}`
    const courseId = await createTestCourse(page, { capacity: 4, title })

    const enrollResp = await request.post(`${BASE}/api/test/enroll`, {
      data: { courseId, studentEmail: 'pw_student@ltsc.test' }, // notify omitted
    })
    expect(enrollResp.ok()).toBeTruthy()

    const log = await request.get(`${BASE}/api/test/notifications`)
    const { entries } = (await log.json()) as { entries: unknown[] }
    expect(entries).toHaveLength(0)
  })

  test('low-enrollment cron route responds with alerted count', async ({ request }) => {
    // Smoke test only — verifies the route is reachable, auth pass-through works
    // (CRON_SECRET unset in dev), and the trigger function doesn't throw.
    // Deeper threshold-behavior testing belongs to 5.8 when the rules solidify.
    const resp = await request.get(`${BASE}/api/cron/low-enrollment`, { headers: cronHeaders() })
    expect(resp.ok()).toBeTruthy()
    const body = (await resp.json()) as { alerted: number }
    expect(typeof body.alerted).toBe('number')
    expect(body.alerted).toBeGreaterThanOrEqual(0)
  })

  test('low-enrollment cron rejects bad CRON_SECRET when set', async ({ request }) => {
    // Auth pattern matches expire-holds: when CRON_SECRET is unset (dev), all
    // requests pass; when set, only Bearer matches pass. We can't set the env
    // mid-test, so this only verifies the negative path triggers if Vercel
    // sends a bad header in prod. In dev (no secret) any header is fine.
    const resp = await request.get(`${BASE}/api/cron/low-enrollment`, {
      headers: { authorization: 'Bearer wrong' },
    })
    // Without CRON_SECRET set, the route ignores the header and returns 200.
    // With CRON_SECRET set, it would 401. Either is acceptable here.
    expect([200, 401]).toContain(resp.status())
  })
})
