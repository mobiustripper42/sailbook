import { test, expect } from '@playwright/test'
import { loginAs, selectTime } from './helpers'

// New Course Cancel returns to where you came from (bug: it always went to the
// courses list, even when launched from Schedule).
test.describe('Admin — New Course cancel returns to origin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
  })

  test('Schedule → New Course → Cancel lands back on Schedule', async ({ page }) => {
    await page.goto('/admin/schedule')
    await page.getByRole('link', { name: 'New Course' }).click()
    await expect(page).toHaveURL(/\/admin\/courses\/new\?from=schedule/)
    // Breadcrumb (scoped to the "… / New" line) reflects the origin.
    const breadcrumb = page.locator('p').filter({ hasText: '/ New' })
    await expect(breadcrumb.getByRole('link', { name: 'Schedule' })).toBeVisible()

    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page).toHaveURL(/\/admin\/schedule$/)
  })

  test('direct New Course → Cancel lands on the courses list', async ({ page }) => {
    await page.goto('/admin/courses/new')
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page).toHaveURL(/\/admin\/courses$/)
  })

  test('Schedule → New Course → Save keeps the Schedule breadcrumb on the new course', async ({ page }) => {
    await page.goto('/admin/courses/new?from=schedule')
    await page.getByLabel('Course Type').click()
    await page.getByRole('option', { name: /ASA 101.*Basic Keelboat/ }).click()
    await page.locator('input[type="date"]').first().fill('2027-12-01')
    await selectTime(page, 'session_start_0', '09:00')
    await selectTime(page, 'session_end_0', '17:00')

    const createBtn = page.getByRole('button', { name: 'Create Course' })
    await createBtn.scrollIntoViewIfNeeded()
    await createBtn.click({ force: true })

    // Redirect preserves the origin, and the breadcrumb reads Schedule (not Courses).
    await expect(page).toHaveURL(/\/admin\/courses\/[0-9a-f-]+\?from=schedule$/)
    const breadcrumb = page.locator('p').filter({ hasText: 'Schedule /' })
    await expect(breadcrumb.getByRole('link', { name: 'Schedule' })).toBeVisible()
  })
})
