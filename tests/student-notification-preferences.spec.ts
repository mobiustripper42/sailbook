import { expect, test } from '@playwright/test'
import { createTestCourse, loginAs, runId } from './helpers'

const BASE = 'http://localhost:3000'
const STUDENT_EMAIL = 'pw_student@ltsc.test'

// Mock buffer is shared module-level state. Same constraints as
// notifications.spec.ts: serialize within a worker AND scope to desktop only.
test.describe.configure({ mode: 'serial' })

test.describe('3.9 — student notification preferences', () => {
  test.beforeEach(async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'mock buffer + DB writes — desktop only')
    // Reset buffer
    const resp = await request.delete(`${BASE}/api/test/notifications`)
    expect(resp.ok()).toBeTruthy()
    // Reset student prefs to "all enabled" (null) so each test starts from a known state
    const reset = await request.post(`${BASE}/api/test/set-notification-prefs`, {
      data: { email: STUDENT_EMAIL, prefs: null },
    })
    expect(reset.ok()).toBeTruthy()
  })

  test.afterAll(async ({ request }) => {
    // Final reset so downstream specs don't inherit suppressed prefs
    await request.post(`${BASE}/api/test/set-notification-prefs`, {
      data: { email: STUDENT_EMAIL, prefs: null },
    })
  })

  // ─── UI ────────────────────────────────────────────────────────────────

  test('section renders on /student/account with both channels enabled by default', async ({ page }) => {
    await loginAs(page, STUDENT_EMAIL, '/student/dashboard')
    await page.goto('/student/account')

    await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible()
    await expect(page.getByLabel('Receive SMS notifications')).toBeChecked()
    await expect(page.getByLabel('Receive email notifications')).toBeChecked()
  })

  test('save toggles persist across reload', async ({ page }) => {
    await loginAs(page, STUDENT_EMAIL, '/student/dashboard')
    await page.goto('/student/account')

    await page.getByLabel('Receive SMS notifications').uncheck()
    await page.getByRole('button', { name: 'Save preferences' }).click()
    await expect(page.getByText('Preferences saved.')).toBeVisible({ timeout: 5000 })

    await page.reload()
    await expect(page.getByLabel('Receive SMS notifications')).not.toBeChecked()
    await expect(page.getByLabel('Receive email notifications')).toBeChecked()
  })

  // ─── Dispatcher gating ────────────────────────────────────────────────
  // NOTIFICATIONS_ENABLED=false in .env.local — sends land in the mock buffer.

  test('SMS off + email on: enrollment confirmation produces email only for student', async ({ page, request }) => {
    test.setTimeout(90000)

    // Suppress SMS, keep email
    const setResp = await request.post(`${BASE}/api/test/set-notification-prefs`, {
      data: {
        email: STUDENT_EMAIL,
        prefs: { student_global: { sms: false, email: true } },
      },
    })
    expect(setResp.ok()).toBeTruthy()

    const title = `PrefSmsOff-${runId()}`
    const courseId = await createTestCourse(page, { capacity: 4, title })

    const enrollResp = await request.post(`${BASE}/api/test/enroll`, {
      data: { courseId, studentEmail: STUDENT_EMAIL, notify: true },
    })
    expect(enrollResp.ok()).toBeTruthy()

    const log = await request.get(`${BASE}/api/test/notifications`)
    const { entries } = (await log.json()) as {
      entries: { channel: 'sms' | 'email'; to: string; subject?: string; body: string }[]
    }

    // Student SMS template uses "you're enrolled" — admin uses "X enrolled in".
    // Filter on the student-specific phrase to disambiguate.
    const studentSms = entries.filter(
      (e) => e.channel === 'sms' && e.body.includes(title) && e.body.includes("you're enrolled"),
    )
    expect(studentSms).toHaveLength(0)

    const studentEmail = entries.filter(
      (e) => e.channel === 'email' && e.to === STUDENT_EMAIL && e.subject?.startsWith('Enrolled:'),
    )
    expect(studentEmail).toHaveLength(1)

    // Admin alerts unaffected — admin prefs are in their own block
    const adminAlerts = entries.filter(
      (e) => e.subject?.startsWith('New enrollment:'),
    )
    expect(adminAlerts.length).toBeGreaterThanOrEqual(1)
  })

  test('email off + SMS on: enrollment confirmation produces SMS only for student', async ({ page, request }) => {
    test.setTimeout(90000)

    const setResp = await request.post(`${BASE}/api/test/set-notification-prefs`, {
      data: {
        email: STUDENT_EMAIL,
        prefs: { student_global: { sms: true, email: false } },
      },
    })
    expect(setResp.ok()).toBeTruthy()

    const title = `PrefEmailOff-${runId()}`
    const courseId = await createTestCourse(page, { capacity: 4, title })

    const enrollResp = await request.post(`${BASE}/api/test/enroll`, {
      data: { courseId, studentEmail: STUDENT_EMAIL, notify: true },
    })
    expect(enrollResp.ok()).toBeTruthy()

    const log = await request.get(`${BASE}/api/test/notifications`)
    const { entries } = (await log.json()) as {
      entries: { channel: 'sms' | 'email'; to: string; subject?: string; body: string }[]
    }

    const studentEmail = entries.filter(
      (e) => e.channel === 'email' && e.to === STUDENT_EMAIL && e.subject?.startsWith('Enrolled:'),
    )
    expect(studentEmail).toHaveLength(0)

    const studentSms = entries.filter(
      (e) => e.channel === 'sms' && e.body.includes(title) && e.body.includes("you're enrolled"),
    )
    expect(studentSms).toHaveLength(1)
  })

  test('both channels off: no student notifications fire', async ({ page, request }) => {
    test.setTimeout(90000)

    const setResp = await request.post(`${BASE}/api/test/set-notification-prefs`, {
      data: {
        email: STUDENT_EMAIL,
        prefs: { student_global: { sms: false, email: false } },
      },
    })
    expect(setResp.ok()).toBeTruthy()

    const title = `PrefBothOff-${runId()}`
    const courseId = await createTestCourse(page, { capacity: 4, title })

    const enrollResp = await request.post(`${BASE}/api/test/enroll`, {
      data: { courseId, studentEmail: STUDENT_EMAIL, notify: true },
    })
    expect(enrollResp.ok()).toBeTruthy()

    const log = await request.get(`${BASE}/api/test/notifications`)
    const { entries } = (await log.json()) as {
      entries: { channel: 'sms' | 'email'; to: string; subject?: string; body: string }[]
    }

    const studentEmail = entries.filter(
      (e) => e.channel === 'email' && e.to === STUDENT_EMAIL && e.subject?.startsWith('Enrolled:'),
    )
    const studentSms = entries.filter(
      (e) => e.channel === 'sms' && e.body.includes(title) && e.body.includes("you're enrolled"),
    )
    expect(studentEmail).toHaveLength(0)
    expect(studentSms).toHaveLength(0)

    // Admins still get their alerts
    const adminAlerts = entries.filter((e) => e.subject?.startsWith('New enrollment:'))
    expect(adminAlerts.length).toBeGreaterThanOrEqual(1)
  })
})
