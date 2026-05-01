import { expect, test } from '@playwright/test'
import { createTestCourse, loginAs, runId } from './helpers'

const BASE = 'http://localhost:3000'

// Mock buffer is shared module-level state — the spot-opened test reads from it
// and must run on desktop only (matches enrollment-notifications.spec.ts).
test.describe.configure({ mode: 'serial' })

test.describe('5.7 — waitlist', () => {
  test('full course shows Join waitlist; joining shows position #1; leaving restores Join', async ({ browser }) => {
    test.skip(test.info().project.name !== 'desktop')
    test.setTimeout(90000)

    // Capacity 1 course → one enrollment fills it.
    const adminCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    let courseId: string
    try {
      courseId = await createTestCourse(adminPage, {
        capacity: 1,
        title: `Waitlist Cap1 ${runId()}`,
      })
    } finally {
      await adminCtx.close()
    }

    // Fill the only spot with pw_student2 via dev-only enrollment route
    const apiCtx = await browser.newContext()
    const apiPage = await apiCtx.newPage()
    try {
      const res = await apiPage.request.post(`${BASE}/api/test/enroll`, {
        data: { courseId, studentEmail: 'pw_student2@ltsc.test' },
      })
      expect(res.ok()).toBeTruthy()
    } finally {
      await apiCtx.close()
    }

    // pw_student visits the course — should see Join waitlist
    const studentCtx = await browser.newContext()
    const studentPage = await studentCtx.newPage()
    try {
      await loginAs(studentPage, 'pw_student@ltsc.test', '/student/dashboard')
      await studentPage.goto(`/student/courses/${courseId}`)

      await expect(studentPage.getByText('Course is full.')).toBeVisible()
      await expect(studentPage.getByRole('button', { name: 'Join waitlist' })).toBeVisible()

      await studentPage.getByRole('button', { name: 'Join waitlist' }).click()

      // Page revalidates — should now show "On waitlist — #1" and Leave button
      await expect(studentPage.getByText(/On waitlist — #1/)).toBeVisible({ timeout: 10000 })
      await expect(studentPage.getByRole('button', { name: 'Leave waitlist' })).toBeVisible()

      // Leave restores the Join state
      await studentPage.getByRole('button', { name: 'Leave waitlist' }).click()
      await expect(studentPage.getByRole('button', { name: 'Join waitlist' })).toBeVisible({ timeout: 10000 })
    } finally {
      await studentCtx.close()
    }
  })

  test('admin sees waitlist card with student listed', async ({ browser }) => {
    test.skip(test.info().project.name !== 'desktop')
    test.setTimeout(90000)

    // Set up a full course
    const adminCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    let courseId: string
    try {
      courseId = await createTestCourse(adminPage, {
        capacity: 1,
        title: `Waitlist Admin ${runId()}`,
      })
    } finally {
      await adminCtx.close()
    }

    const apiCtx = await browser.newContext()
    const apiPage = await apiCtx.newPage()
    try {
      const res = await apiPage.request.post(`${BASE}/api/test/enroll`, {
        data: { courseId, studentEmail: 'pw_student2@ltsc.test' },
      })
      expect(res.ok()).toBeTruthy()
    } finally {
      await apiCtx.close()
    }

    // pw_student joins waitlist
    const studentCtx = await browser.newContext()
    const studentPage = await studentCtx.newPage()
    try {
      await loginAs(studentPage, 'pw_student@ltsc.test', '/student/dashboard')
      await studentPage.goto(`/student/courses/${courseId}`)
      await studentPage.getByRole('button', { name: 'Join waitlist' }).click()
      await expect(studentPage.getByText(/On waitlist — #1/)).toBeVisible({ timeout: 10000 })
    } finally {
      await studentCtx.close()
    }

    // Admin sees the waitlist card with pw_student in it
    const adminCheckCtx = await browser.newContext()
    const adminCheckPage = await adminCheckCtx.newPage()
    try {
      await loginAs(adminCheckPage, 'pw_admin@ltsc.test', '/admin/dashboard')
      await adminCheckPage.goto(`/admin/courses/${courseId}`)

      const card = adminCheckPage.locator('section, div').filter({ hasText: /^Waitlist \(/ }).first()
      await expect(adminCheckPage.getByText('Waitlist (1)')).toBeVisible()
      await expect(card.getByText('pw_student@ltsc.test')).toBeVisible()
    } finally {
      await adminCheckCtx.close()
    }
  })

  test('cancelling an enrollment stamps notified_at on every waitlist entry', async ({ browser, request }) => {
    test.skip(test.info().project.name !== 'desktop')
    test.setTimeout(120000)

    // Course with capacity 1 — one enrollment = full
    const adminCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    let courseId: string
    try {
      courseId = await createTestCourse(adminPage, {
        capacity: 1,
        title: `Waitlist Notify ${runId()}`,
      })
    } finally {
      await adminCtx.close()
    }

    // Fill with pw_student2 (the one whose spot will open)
    let enrollmentId: string
    const apiCtx = await browser.newContext()
    const apiPage = await apiCtx.newPage()
    try {
      const res = await apiPage.request.post(`${BASE}/api/test/enroll`, {
        data: { courseId, studentEmail: 'pw_student2@ltsc.test' },
      })
      expect(res.ok()).toBeTruthy()
      enrollmentId = ((await res.json()) as { enrollmentId: string }).enrollmentId
    } finally {
      await apiCtx.close()
    }

    // pw_student joins the waitlist
    const studentCtx = await browser.newContext()
    const studentPage = await studentCtx.newPage()
    try {
      await loginAs(studentPage, 'pw_student@ltsc.test', '/student/dashboard')
      await studentPage.goto(`/student/courses/${courseId}`)
      await studentPage.getByRole('button', { name: 'Join waitlist' }).click()
      await expect(studentPage.getByText(/On waitlist — #1/)).toBeVisible({ timeout: 10000 })
    } finally {
      await studentCtx.close()
    }

    // Move the enrollment into cancel_requested via the test route, then have
    // the admin click "Cancel (no refund)" — that drives the cancelEnrollment
    // server action which fires notifyWaitlistSpotOpened.
    const setReq = await request.post(`${BASE}/api/test/set-cancel-requested`, {
      data: { enrollmentId },
    })
    expect(setReq.ok()).toBeTruthy()

    const adminFinalCtx = await browser.newContext()
    const adminFinalPage = await adminFinalCtx.newPage()
    try {
      await loginAs(adminFinalPage, 'pw_admin@ltsc.test', '/admin/dashboard')
      await adminFinalPage.goto(`/admin/courses/${courseId}`)
      await adminFinalPage.getByRole('button', { name: 'Cancel (no refund)' }).click()
      await adminFinalPage.waitForLoadState('networkidle', { timeout: 10000 })

      // The trigger stamps notified_at after fan-out. Verify via the admin
      // waitlist card's "Last notified" column — its presence proves the
      // trigger ran end-to-end (DB write happens AFTER all sends complete).
      // Reading the buffer directly doesn't work in Turbopack dev — server
      // actions and API routes live in different module graphs.
      await adminFinalPage.reload()
      const card = adminFinalPage.locator('div').filter({ hasText: /^Waitlist \(1\)/ }).first()
      const row = card.getByRole('row').filter({ hasText: 'pw_student@ltsc.test' })
      // notified_at column is the last cell — it's a date-time string, not "—"
      await expect(row.getByRole('cell').last()).not.toHaveText('—')
    } finally {
      await adminFinalCtx.close()
    }
  })

  test('enrolling auto-removes the student from the waitlist', async ({ browser, request }) => {
    test.skip(test.info().project.name !== 'desktop')
    test.setTimeout(120000)

    // Course with capacity 1; pw_student2 fills it.
    const adminCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    let courseId: string
    try {
      courseId = await createTestCourse(adminPage, {
        capacity: 1,
        title: `Waitlist Auto ${runId()}`,
      })
    } finally {
      await adminCtx.close()
    }

    let blockerEnrollmentId: string
    const apiCtx = await browser.newContext()
    const apiPage = await apiCtx.newPage()
    try {
      const res = await apiPage.request.post(`${BASE}/api/test/enroll`, {
        data: { courseId, studentEmail: 'pw_student2@ltsc.test' },
      })
      expect(res.ok()).toBeTruthy()
      blockerEnrollmentId = ((await res.json()) as { enrollmentId: string }).enrollmentId
    } finally {
      await apiCtx.close()
    }

    // pw_student joins waitlist
    const studentCtx = await browser.newContext()
    const studentPage = await studentCtx.newPage()
    try {
      await loginAs(studentPage, 'pw_student@ltsc.test', '/student/dashboard')
      await studentPage.goto(`/student/courses/${courseId}`)
      await studentPage.getByRole('button', { name: 'Join waitlist' }).click()
      await expect(studentPage.getByText(/On waitlist — #1/)).toBeVisible({ timeout: 10000 })
    } finally {
      await studentCtx.close()
    }

    // Free up the spot — cancel the blocker (admin path bypasses payment)
    const setReq = await request.post(`${BASE}/api/test/set-cancel-requested`, {
      data: { enrollmentId: blockerEnrollmentId },
    })
    expect(setReq.ok()).toBeTruthy()

    const adminFinalCtx = await browser.newContext()
    const adminFinalPage = await adminFinalCtx.newPage()
    try {
      await loginAs(adminFinalPage, 'pw_admin@ltsc.test', '/admin/dashboard')
      await adminFinalPage.goto(`/admin/courses/${courseId}`)
      // Cancel (no refund) fires immediately — no dialog.
      await adminFinalPage.getByRole('button', { name: 'Cancel (no refund)' }).click()
      await adminFinalPage.waitForLoadState('networkidle', { timeout: 10000 })
    } finally {
      await adminFinalCtx.close()
    }

    // Now drive cleanup via admin manual enrollment (adminEnrollStudent action).
    // /api/test/enroll bypasses adminEnrollStudent, so it would NOT clear the
    // waitlist — we verify cleanup through the production path instead.
    const adminEnrollCtx = await browser.newContext()
    const adminEnrollPage = await adminEnrollCtx.newPage()
    try {
      await loginAs(adminEnrollPage, 'pw_admin@ltsc.test', '/admin/dashboard')
      await adminEnrollPage.goto(`/admin/courses/${courseId}`)

      await adminEnrollPage.getByRole('button', { name: 'Enroll Student' }).click()
      // Scope to the panel — the Sessions row also has comboboxes (instructor
      // selector) that would otherwise match `getByRole('combobox').first()`.
      const panel = adminEnrollPage.locator('form').filter({ has: adminEnrollPage.getByText('Amount ($)') })
      await panel.getByRole('combobox').first().click()
      await adminEnrollPage.getByRole('option', { name: /pw_student@ltsc\.test/ }).click()
      await panel.getByLabel('Amount ($)').fill('0')
      await panel.getByRole('button', { name: 'Enroll', exact: true }).click()
      await adminEnrollPage.waitForLoadState('networkidle', { timeout: 10000 })

      // Waitlist count should now be 0
      await expect(adminEnrollPage.getByText('No one on the waitlist.')).toBeVisible({ timeout: 10000 })
    } finally {
      await adminEnrollCtx.close()
    }
  })
})
