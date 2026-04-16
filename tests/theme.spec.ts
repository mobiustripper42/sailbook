import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

// Theme tests run desktop-only — toggle is in sidebar footer.
// All tests use test.use({ viewport }) to run at a consistent 1440px
// regardless of project, so theme detection isn't conflated with viewport.
test.describe('Theme toggle', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  // ThemeProvider uses defaultTheme="system". In a headless browser with no
  // OS preference set, 'system' resolves to light. Unauthenticated pages
  // (login, register) should NOT be hardcoded dark.
  test('unauthenticated pages follow system preference (light in headless browser)', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })

  // next-themes reads theme from localStorage on every full page load.
  // If localStorage has 'dark', the page renders dark.
  test('localStorage dark preference renders dark on page load', async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
    // Set localStorage directly — tests ThemeSync's write + next-themes read in isolation
    await page.evaluate(() => localStorage.setItem('theme', 'dark'))
    await page.goto('/admin/courses')
    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('toggle switches to light mode', async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
    // Seed dark preference into localStorage directly so this test doesn't
    // depend on DB state — parallel project runs modify pw_admin's DB value
    await page.evaluate(() => localStorage.setItem('theme', 'dark'))
    await page.goto('/admin/courses')
    await expect(page.locator('html')).toHaveClass(/dark/)

    // Wait for the button to be mounted and show the correct label
    const toggleBtn = page.getByRole('button', { name: 'Switch to light mode' })
    await expect(toggleBtn).toBeVisible()
    await toggleBtn.click()

    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })

  test('toggle switches back to dark mode', async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
    await page.evaluate(() => localStorage.setItem('theme', 'dark'))
    await page.goto('/admin/courses')

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
