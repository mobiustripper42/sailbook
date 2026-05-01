/**
 * Task 5.2 — Open Sailing drop-in enrollment
 *
 * Covers:
 *   - Admin sees "Drop-in" badge on course detail for a drop-in course type
 *   - Student sees drop-in callout on course detail page
 *   - Admin can create a course type with is_drop_in = true
 */

import { test, expect } from '@playwright/test'
import { loginAs, runId } from './helpers'

test.describe('Open Sailing drop-in', () => {
  test.describe.configure({ mode: 'serial' })

  let courseId: string

  // Use the seed Open Sailing course type (is_drop_in = true after db reset)
  // and create a fresh course for each test run.
  test.beforeAll(async ({ browser }) => {
    test.setTimeout(30000)
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    try {
      await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
      await page.goto('/admin/courses/new')
      await expect(page.getByRole('heading', { name: 'New Course' })).toBeVisible()

      await page.getByLabel('Course Type').click()
      await page.getByRole('option', { name: /Open Sailing/ }).click()

      await page.getByLabel('Title Override').fill(`Open Sailing ${runId()}`)
      await page.getByLabel('Capacity').fill('8')
      await page.getByLabel('Price ($)', { exact: true }).fill('11')

      await page.locator('input[type="date"]').fill('2027-07-14')
      await page.locator('input[type="time"]').first().fill('18:00')
      await page.locator('input[type="time"]').nth(1).fill('21:00')
      await page.locator('section').filter({ hasText: 'Sessions' }).getByPlaceholder(/Dock A/).fill('Edgewater Marina')

      await page.getByRole('button', { name: 'Create Course' }).click({ force: true })
      await page.waitForURL(/\/admin\/courses\/[0-9a-f-]+$/, { timeout: 10000 })

      const match = page.url().match(/\/admin\/courses\/([0-9a-f-]+)$/)
      if (!match) throw new Error('Could not extract course ID from URL')
      courseId = match[1]

      await page.getByRole('button', { name: 'Publish' }).click()
      await expect(page.getByRole('button', { name: 'Mark Completed' })).toBeVisible({ timeout: 10000 })
    } finally {
      await ctx.close()
    }
  })

  test('admin course detail shows Drop-in badge', async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
    await page.goto(`/admin/courses/${courseId}`)
    await expect(page.getByText('Drop-in')).toBeVisible()
  })

  test('student course detail shows drop-in callout', async ({ page }) => {
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard')
    await page.goto(`/student/courses/${courseId}`)
    await expect(page.getByText(/Pay \$11 now to reserve your spot/)).toBeVisible()
    await expect(page.getByText(/balance is paid to the captain/)).toBeVisible()
  })

  test('admin can create a course type with is_drop_in checked', async ({ page }) => {
    const id = runId()
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
    await page.goto('/admin/course-types/new')

    await page.getByLabel('Name').fill(`Drop-in Test ${id}`)
    await page.getByLabel('Short Code').fill(`DRP${id}`)
    await page.getByLabel('Max Students').fill('6')
    await page.getByLabel('Public URL Slug').fill(`drop-${id}`)
    await page.getByLabel('Drop-in / per-session enrollment').check()

    await page.getByRole('button', { name: 'Create' }).click()
    await page.waitForURL('/admin/course-types', { timeout: 10000 })

    // The new type should appear in the list
    await expect(page.getByText(`DRP${id}`)).toBeVisible()
  })
})
