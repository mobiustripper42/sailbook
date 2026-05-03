import { test, expect } from '@playwright/test'
import { createEnrolledCourse, loginAs, runId } from './helpers'

test.describe('Admin restore cancelled enrollment', () => {
  test('admin can cancel then restore an enrollment', async ({ browser }) => {
    test.skip(test.info().project.name !== 'desktop')
    test.setTimeout(120000)

    const { courseId } = await createEnrolledCourse(browser, {
      title: `Restore Test ${runId()}`,
    })

    const adminCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    try {
      await loginAs(adminPage, 'pw_admin@ltsc.test', '/admin/dashboard')
      await adminPage.goto(`/admin/courses/${courseId}`)

      // Accept the window.confirm before clicking Cancel
      adminPage.on('dialog', (dialog) => dialog.accept())
      await adminPage.getByRole('button', { name: 'Cancel' }).first().click()

      // Optimistic update flips status immediately — badge shows 'cancelled'
      // and Restore button appears in the same row
      await expect(adminPage.getByRole('cell').filter({ hasText: 'cancelled' })).toBeVisible({ timeout: 10000 })
      await expect(adminPage.getByRole('button', { name: 'Restore' })).toBeVisible()

      // Restore the enrollment
      await adminPage.getByRole('button', { name: 'Restore' }).click()

      // Badge flips back to Enrolled; Restore button is gone
      await expect(adminPage.getByRole('cell').filter({ hasText: 'Enrolled' })).toBeVisible({ timeout: 10000 })
      await expect(adminPage.getByRole('button', { name: 'Restore' })).not.toBeVisible()
    } finally {
      await adminCtx.close()
    }
  })
})
