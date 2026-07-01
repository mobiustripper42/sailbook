import { test, expect } from '@playwright/test'
import { loginAs, cronHeaders } from './helpers'

const BASE = 'http://localhost:3000'
const ASA_101_ID = 'b1000000-0000-0000-0000-000000000001'
const OPEN_SAILING_ID = 'b1000000-0000-0000-0000-000000000004'

// #103 — low-enrollment digest: multiple qualifying courses in one cron run
// produce ONE email per admin (listing all of them), not one email per course.
// Mutates seed course-type thresholds — desktop-only, serial (shared mock
// notification buffer + shared seed state), same convention as
// session-reminders.spec.ts / enrollment-notifications.spec.ts.
test.describe.configure({ mode: 'serial' })

test.describe('#103 — low-enrollment digest', () => {
  test.beforeEach(async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'mutates seed + shared mock buffer — desktop only')
    const resp = await request.delete(`${BASE}/api/test/notifications`)
    expect(resp.ok()).toBeTruthy()
  })

  test('two low-enrollment courses in one run → each admin gets exactly one digest email', async ({ page, request }) => {
    test.setTimeout(120000)

    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')

    // ASA 101's Evening Series (c002, +5 days) and Open Sailing's Jul 1 course
    // (c006, +7 days) both sit inside the default 14-day lead window (issue
    // #70 seed dates are anchored to current_date, so this holds on any run
    // date). Flip both course types' minimum_enrollment impossibly high so
    // both courses qualify simultaneously.
    for (const id of [ASA_101_ID, OPEN_SAILING_ID]) {
      await page.goto(`/admin/course-types/${id}/edit`)
      await page.getByLabel('Minimum Enrollment').fill('99')
      await page.getByRole('button', { name: 'Save Changes' }).click()
      await page.waitForURL('**/admin/course-types', { timeout: 10000 })
    }

    try {
      const resp = await request.get(`${BASE}/api/cron/low-enrollment`, { headers: cronHeaders() })
      expect(resp.ok()).toBeTruthy()
      const { alerted } = (await resp.json()) as { alerted: number }
      expect(alerted).toBeGreaterThanOrEqual(2)

      const log = await request.get(`${BASE}/api/test/notifications`)
      const { entries } = (await log.json()) as {
        entries: { channel: 'sms' | 'email'; to: string; subject?: string; body: string }[]
      }

      const adminEmails = entries.filter(
        (e) => e.channel === 'email' && e.to === 'pw_admin@ltsc.test' && e.subject?.includes('Low enrollment'),
      )
      expect(adminEmails).toHaveLength(1)
      expect(adminEmails[0].subject).toContain('courses')
      expect(adminEmails[0].body).toContain('ASA 101 - Evening Series (May)')
      expect(adminEmails[0].body).toContain('Open Sailing - Jul 1')
    } finally {
      // Restore both course types so other tests / re-runs see the seed default.
      for (const id of [ASA_101_ID, OPEN_SAILING_ID]) {
        await page.goto(`/admin/course-types/${id}/edit`)
        await page.getByLabel('Minimum Enrollment').fill('')
        await page.getByRole('button', { name: 'Save Changes' }).click()
        await page.waitForURL('**/admin/course-types', { timeout: 10000 })
      }
    }
  })
})
