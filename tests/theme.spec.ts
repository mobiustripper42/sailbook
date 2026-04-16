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

  // Full round-trip: toggle → DB save → fresh browser session → ThemeSync re-applies
  // Uses pw_student to avoid conflicts with toggle tests that modify pw_admin.
  // Restores dark at the end so the DB state is clean for subsequent runs.
  test('theme preference persists across a fresh login', async ({ browser }) => {
    const ctx1 = await browser.newContext()
    const page1 = await ctx1.newPage()
    try {
      await loginAs(page1, 'pw_student@ltsc.test', '/student/dashboard')
      // Force dark in localStorage, navigate so it takes effect
      await page1.evaluate(() => localStorage.setItem('theme', 'dark'))
      await page1.goto('/student/courses')
      await expect(page1.locator('html')).toHaveClass(/dark/)
      // Toggle to light → saves 'light' to DB via /api/theme
      await page1.getByRole('button', { name: 'Switch to light mode' }).click()
      await expect(page1.locator('html')).not.toHaveClass(/dark/)
      await page1.waitForLoadState('networkidle')
    } finally {
      await ctx1.close()
    }

    // Fresh browser context — localStorage is empty. ThemeSync fires on first
    // page load and writes 'light' (from DB). On second page load, next-themes
    // reads 'light' from localStorage and applies it.
    const ctx2 = await browser.newContext()
    const page2 = await ctx2.newPage()
    try {
      await loginAs(page2, 'pw_student@ltsc.test', '/student/dashboard')
      // ThemeSync has now written 'light' to localStorage
      await page2.goto('/student/courses')
      await expect(page2.locator('html')).not.toHaveClass(/dark/)

      // Restore dark so subsequent test runs start clean
      await page2.getByRole('button', { name: 'Switch to dark mode' }).click()
      await expect(page2.locator('html')).toHaveClass(/dark/)
      await page2.waitForLoadState('networkidle')
    } finally {
      await ctx2.close()
    }
  })
})
