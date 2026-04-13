import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

// Theme tests run desktop-only — toggle is in sidebar footer
test.describe('Theme toggle', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('defaults to dark mode', async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
    const htmlClass = await page.locator('html').getAttribute('class')
    expect(htmlClass).toContain('dark')
  })

  test('toggle switches to light mode', async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
    await expect(page.locator('html')).toHaveClass(/dark/)

    // Wait for the button to be mounted and show the correct label
    const toggleBtn = page.getByRole('button', { name: 'Switch to light mode' })
    await expect(toggleBtn).toBeVisible()
    await toggleBtn.click()

    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })

  test('toggle switches back to dark mode', async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')

    const toLight = page.getByRole('button', { name: 'Switch to light mode' })
    await expect(toLight).toBeVisible()
    await toLight.click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)

    const toDark = page.getByRole('button', { name: 'Switch to dark mode' })
    await expect(toDark).toBeVisible()
    await toDark.click()
    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('toggle is visible for student', async ({ page }) => {
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard')
    await expect(page.getByRole('button', { name: /switch to/i })).toBeVisible()
  })

  test('toggle is visible for instructor', async ({ page }) => {
    await loginAs(page, 'pw_instructor@ltsc.test', '/instructor/dashboard')
    await expect(page.getByRole('button', { name: /switch to/i })).toBeVisible()
  })
})
