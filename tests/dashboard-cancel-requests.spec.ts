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
      const r = await apiPage.request.post('http://localhost:3000/api/test/enroll', {
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
      const res = await apiPage.request.post('http://localhost:3000/api/test/set-cancel-requested', {
        data: { enrollmentId },
      })
      expect(res.ok()).toBeTruthy()
    } finally {
      await apiCtx.close()
    }

    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
    const cancelCard = page.locator('[data-slot="card"]').filter({ hasText: /Cancellation Requests \(\d+\)/ })
    await expect(cancelCard).toBeVisible()

    const row = cancelCard.getByRole('row').filter({ hasText: courseTitle })
    await expect(row).toBeVisible()

    const courseLink = row.getByRole('link')
    await expect(courseLink).toHaveAttribute('href', `/admin/courses/${courseId}`)
  })
})
