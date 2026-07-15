import { expect, test } from '@playwright/test'
import { createEnrolledCourse, cronHeaders, runId } from './helpers'

const BASE = 'http://localhost:3300'

// Mock buffer is shared module-level state. Same constraints as the other
// notification specs: serialize within a worker AND scope to desktop only.
test.describe.configure({ mode: 'serial' })

test.describe('3.7 — session reminders', () => {
  test.beforeEach(async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'mock buffer is shared module state — desktop only')
    const resp = await request.delete(`${BASE}/api/test/notifications`)
    expect(resp.ok()).toBeTruthy()
  })

  // Reference dates relative to the test course's session date (2027-09-15,
  // set in createTestCourse helper). The trigger reads referenceDate as
  // "today" and looks for sessions exactly 1 or 7 days out.
  const ONE_WEEK_BEFORE = '2027-09-08'
  const ONE_DAY_BEFORE = '2027-09-14'
  const TWO_DAYS_BEFORE = '2027-09-13'

  test('fires 1-week reminders on the 7-day-out date', async ({ browser, request }) => {
    test.setTimeout(120000)

    const title = `Reminder7d-${runId()}`
    await createEnrolledCourse(browser, { title })

    const resp = await request.post(`${BASE}/api/test/run-session-reminders`, {
      data: { referenceDate: ONE_WEEK_BEFORE },
    })
    expect(resp.ok()).toBeTruthy()
    const { fired } = (await resp.json()) as { fired: number }
    expect(fired).toBeGreaterThanOrEqual(1)

    const log = await request.get(`${BASE}/api/test/notifications`)
    const { entries } = (await log.json()) as {
      entries: { channel: 'sms' | 'email'; to: string; subject?: string; body: string }[]
    }

    // Scope by title in the BODY, not the subject — earlier seed/test courses
    // sharing pw_student's fixed 2027-09-15 fixture date land in the same
    // digest (#103), so the subject may read "N sessions" instead of naming
    // this specific course. The body always lists every qualifying course.
    const studentEmail = entries.find(
      (e) =>
        e.channel === 'email' &&
        e.to === 'pw_student@ltsc.test' &&
        e.subject?.includes('Reminder:') &&
        e.body?.includes(title),
    )
    expect(studentEmail).toBeDefined()
    expect(studentEmail!.body).toContain(title)
    expect(studentEmail!.body).toContain('in 1 week')
  })

  test('fires 24-hour reminders on the 1-day-out date', async ({ browser, request }) => {
    test.setTimeout(120000)

    const title = `Reminder1d-${runId()}`
    await createEnrolledCourse(browser, { title })

    const resp = await request.post(`${BASE}/api/test/run-session-reminders`, {
      data: { referenceDate: ONE_DAY_BEFORE },
    })
    expect(resp.ok()).toBeTruthy()

    const log = await request.get(`${BASE}/api/test/notifications`)
    const { entries } = (await log.json()) as {
      entries: { channel: 'sms' | 'email'; to: string; subject?: string; body: string }[]
    }

    // Same body-based scoping as the 7-day test above — subject may
    // aggregate ("N sessions") once other pw_student fixture courses share
    // this reference date.
    const studentEmail = entries.find(
      (e) =>
        e.channel === 'email' &&
        e.to === 'pw_student@ltsc.test' &&
        e.subject?.includes('Reminder:') &&
        e.body?.includes(title),
    )
    expect(studentEmail).toBeDefined()
    expect(studentEmail!.body).toContain(title)
    expect(studentEmail!.body).toContain('tomorrow')
  })

  test('fires nothing on dates that are not 1-day or 7-day out', async ({ browser, request }) => {
    test.setTimeout(120000)

    const title = `ReminderOff-${runId()}`
    await createEnrolledCourse(browser, { title })

    const resp = await request.post(`${BASE}/api/test/run-session-reminders`, {
      data: { referenceDate: TWO_DAYS_BEFORE },
    })
    expect(resp.ok()).toBeTruthy()

    const log = await request.get(`${BASE}/api/test/notifications`)
    const { entries } = (await log.json()) as {
      entries: { channel: 'sms' | 'email'; to: string }[]
    }

    // No reminder for our test course — but other seed courses might
    // coincidentally land on a target date relative to this referenceDate.
    // Filter to just our title to keep the assertion isolated.
    const ours = entries.filter((e) => 'subject' in e && (e as { subject?: string }).subject?.includes(title))
    expect(ours).toHaveLength(0)
  })

  test('skips cancelled sessions', async ({ browser, request }) => {
    test.setTimeout(120000)

    const title = `ReminderCancel-${runId()}`
    const { sessionId } = await createEnrolledCourse(browser, { title })

    // Cancel the session before the reminder runs
    await request.post(`${BASE}/api/test/cancel-session`, {
      data: { sessionId, notify: false },
    })

    const resp = await request.post(`${BASE}/api/test/run-session-reminders`, {
      data: { referenceDate: ONE_DAY_BEFORE },
    })
    expect(resp.ok()).toBeTruthy()

    const log = await request.get(`${BASE}/api/test/notifications`)
    const { entries } = (await log.json()) as {
      entries: { subject?: string }[]
    }

    const ours = entries.filter((e) => e.subject?.includes(title))
    expect(ours).toHaveLength(0)
  })

  test('cron route returns fired count', async ({ request }) => {
    // Smoke test only — verifies the route is reachable, auth pass-through works
    // (CRON_SECRET unset in dev), and the trigger doesn't throw. Volume here is
    // whatever sessions happen to be exactly 1d/7d out from real "today".
    const resp = await request.get(`${BASE}/api/cron/session-reminders`, { headers: cronHeaders() })
    expect(resp.ok()).toBeTruthy()
    const body = (await resp.json()) as { fired: number }
    expect(typeof body.fired).toBe('number')
    expect(body.fired).toBeGreaterThanOrEqual(0)
  })

  // #103 — a student with sessions in two different courses landing on the
  // same lead-time date gets ONE digest email listing both, not two separate
  // emails. Both createEnrolledCourse calls use the fixed 2027-09-15 session
  // date and enroll the same pw_student@ltsc.test fixture.
  test('same student, two courses, same lead-time date → one digest email listing both', async ({ browser, request }) => {
    test.setTimeout(120000)

    const titleA = `Digest7dA-${runId()}`
    const titleB = `Digest7dB-${runId()}`
    await createEnrolledCourse(browser, { title: titleA })
    await createEnrolledCourse(browser, { title: titleB })

    const resp = await request.post(`${BASE}/api/test/run-session-reminders`, {
      data: { referenceDate: ONE_WEEK_BEFORE },
    })
    expect(resp.ok()).toBeTruthy()

    const log = await request.get(`${BASE}/api/test/notifications`)
    const { entries } = (await log.json()) as {
      entries: { channel: 'sms' | 'email'; to: string; subject?: string; body: string }[]
    }

    // Regardless of how many other pw_student fixture courses share this
    // reference date (accumulated by other tests/runs), there must be
    // exactly ONE digest email for this slot — not one per course.
    const studentEmails = entries.filter(
      (e) => e.channel === 'email' && e.to === 'pw_student@ltsc.test' && e.subject?.includes('in 1 week'),
    )
    expect(studentEmails).toHaveLength(1)
    expect(studentEmails[0].body).toContain(titleA)
    expect(studentEmails[0].body).toContain(titleB)
  })
})
