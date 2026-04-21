import { test, expect } from '@playwright/test'
import { createTestCourse, loginAs, runId } from './helpers'

test.describe('Member pricing', () => {
  test.describe.configure({ mode: 'serial' })

  let courseId: string
  const REGULAR_PRICE = 200
  const MEMBER_PRICE = 150

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(60000)
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    try {
      courseId = await createTestCourse(page, {
        capacity: 4,
        title: `Member Pricing Test ${runId()}`,
        price: REGULAR_PRICE,
      })
      // Set member price via the edit form
      await page.goto(`/admin/courses/${courseId}/edit`)
      await page.getByLabel('Member Price ($)').fill(String(MEMBER_PRICE))
      await page.getByRole('button', { name: 'Save Changes' }).click()
      await page.waitForURL(`/admin/courses/${courseId}`, { timeout: 10000 })
    } finally {
      await ctx.close()
    }
  })

  test('non-member student sees regular price', async ({ page }) => {
    test.setTimeout(30000)
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard')
    await page.goto(`/student/courses/${courseId}`)
    await expect(page.getByText(`$${REGULAR_PRICE}`)).toBeVisible()
    await expect(page.getByText('Member price applied')).not.toBeVisible()
  })

  test('admin can mark student as LTSC member', async ({ page }) => {
    test.setTimeout(30000)
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
    await page.goto('/admin/students')
    // Find the row containing "PW Student" and click its Edit link
    const row = page.getByRole('row').filter({ hasText: 'PW Student' }).first()
    await row.getByRole('link', { name: 'Edit' }).click()
    await page.waitForURL(/\/admin\/students\/.*\/edit/, { timeout: 10000 })
    await page.getByLabel('LTSC Member').check()
    await page.getByRole('button', { name: 'Save Changes' }).click()
    await page.waitForURL('/admin/students', { timeout: 10000 })
  })

  test('member student sees member price with strikethrough', async ({ page }) => {
    test.setTimeout(30000)
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard')
    await page.goto(`/student/courses/${courseId}`)
    await expect(page.getByText(`$${MEMBER_PRICE}`)).toBeVisible()
    await expect(page.getByText('Member price applied')).toBeVisible()
  })

  test.afterAll(async ({ browser }) => {
    // Reset pw_student back to non-member
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    try {
      await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
      await page.goto('/admin/students')
      const row = page.getByRole('row').filter({ hasText: 'PW Student' }).first()
      await row.getByRole('link', { name: 'Edit' }).click()
      await page.waitForURL(/\/admin\/students\/.*\/edit/, { timeout: 10000 })
      await page.getByLabel('LTSC Member').uncheck()
      await page.getByRole('button', { name: 'Save Changes' }).click()
      await page.waitForURL('/admin/students', { timeout: 10000 })
    } finally {
      await ctx.close()
    }
  })
})
