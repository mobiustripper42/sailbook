import { test, expect } from '@playwright/test'
import { createTestCourse, loginAs, runId } from './helpers'

test.describe('Admin dashboard — cancellation requests widget', () => {
  test.describe.configure({ mode: 'serial' })

  let courseId: string
  let courseTitle: string
  let enrollmentId: string

  test.beforeAll(async ({ browser }) => {
    const adminCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    try {
      courseTitle = `Cancel Widget Test ${runId()}`
      courseId = await createTestCourse(adminPage, {
        capacity: 6,
        title: courseTitle,
        price: 100,
      })
    } finally {
      await adminCtx.close()
    }

    const apiCtx = await browser.newContext()
    const apiPage = await apiCtx.newPage()
    try {
      const r = await apiPage.request.post('http://localhost:3300/api/test/enroll', {
        data: { courseId, studentEmail: 'pw_student@ltsc.test' },
      })
      expect(r.ok()).toBeTruthy()
      enrollmentId = ((await r.json()) as { enrollmentId: string }).enrollmentId
    } finally {
      await apiCtx.close()
    }
  })

  test('widget shows request after enrollment is cancel_requested', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop', 'desktop-only — avoids triple-run across viewports')
    const apiCtx = await page.context().browser()!.newContext()
    const apiPage = await apiCtx.newPage()
    try {
      const res = await apiPage.request.post('http://localhost:3300/api/test/set-cancel-requested', {
        data: { enrollmentId },
      })
      expect(res.ok()).toBeTruthy()
    } finally {
      await apiCtx.close()
    }

    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
    // 10.5: cancellations surface as a "Needs you" triage card. The most-recent
    // request (this freshly-enrolled one) is previewed with student · course.
    const cancelCard = page.getByRole('link').filter({ hasText: /Cancellation request/ })
    await expect(cancelCard).toBeVisible()
    await expect(cancelCard).toContainText(courseTitle)
    // Deep-links the previewed course (this freshly-cancelled one), from=dashboard.
    await expect(cancelCard).toHaveAttribute('href', `/admin/courses/${courseId}?from=dashboard`)
  })
})
