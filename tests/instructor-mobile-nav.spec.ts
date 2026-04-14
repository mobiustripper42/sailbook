import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

test.describe('instructor mobile nav drawer', () => {
  test('hamburger button visible on mobile', async ({ page }) => {
    await loginAs(page, 'pw_instructor@ltsc.test', /\/instructor\/dashboard/)
    await page.goto('/instructor/dashboard')
    test.skip((page.viewportSize()?.width ?? 768) >= 768, 'mobile-only test')
    await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible()
  })

  test('aside sidebar hidden on mobile', async ({ page }) => {
    await loginAs(page, 'pw_instructor@ltsc.test', /\/instructor\/dashboard/)
    await page.goto('/instructor/dashboard')
    test.skip((page.viewportSize()?.width ?? 768) >= 768, 'mobile-only test')
    await expect(page.locator('aside')).not.toBeInViewport()
  })

  test('hamburger opens drawer', async ({ page }) => {
    await loginAs(page, 'pw_instructor@ltsc.test', /\/instructor\/dashboard/)
    await page.goto('/instructor/dashboard')
    test.skip((page.viewportSize()?.width ?? 768) >= 768, 'mobile-only test')
    await page.getByRole('button', { name: 'Open navigation' }).click()
    await expect(page.getByRole('button', { name: 'Close navigation' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Dashboard' }).first()).toBeVisible()
  })

  test('drawer shows Instructor label', async ({ page }) => {
    await loginAs(page, 'pw_instructor@ltsc.test', /\/instructor\/dashboard/)
    await page.goto('/instructor/dashboard')
    test.skip((page.viewportSize()?.width ?? 768) >= 768, 'mobile-only test')
    await page.getByRole('button', { name: 'Open navigation' }).click()
    // The drawer header shows the role label (exact match avoids matching "PW Instructor")
    const drawer = page.locator('.fixed.inset-y-0.left-0.z-40')
    await expect(drawer.getByText('Instructor', { exact: true })).toBeVisible()
  })

  test('close button dismisses drawer', async ({ page }) => {
    await loginAs(page, 'pw_instructor@ltsc.test', /\/instructor\/dashboard/)
    await page.goto('/instructor/dashboard')
    test.skip((page.viewportSize()?.width ?? 768) >= 768, 'mobile-only test')
    await page.getByRole('button', { name: 'Open navigation' }).click()
    await page.getByRole('button', { name: 'Close navigation' }).click()
    // CSS transform doesn't affect Playwright's isVisible; use not.toBeInViewport() instead
    await expect(page.getByRole('button', { name: 'Close navigation' })).not.toBeInViewport()
  })

  test('overlay click dismisses drawer', async ({ page }) => {
    await loginAs(page, 'pw_instructor@ltsc.test', /\/instructor\/dashboard/)
    await page.goto('/instructor/dashboard')
    test.skip((page.viewportSize()?.width ?? 768) >= 768, 'mobile-only test')
    await page.getByRole('button', { name: 'Open navigation' }).click()
    // Click the overlay (outside the 256px drawer, on a 375px viewport)
    await page.mouse.click(350, 300)
    await expect(page.getByRole('button', { name: 'Close navigation' })).not.toBeInViewport()
  })

  test('sidebar visible at tablet+ (no hamburger)', async ({ page }) => {
    await loginAs(page, 'pw_instructor@ltsc.test', /\/instructor\/dashboard/)
    await page.goto('/instructor/dashboard')
    test.skip((page.viewportSize()?.width ?? 0) < 768, 'desktop/tablet-only test')
    await expect(page.getByRole('button', { name: 'Open navigation' })).not.toBeVisible()
  })

  test('dual-role: drawer shows Switch to Student View', async ({ page }) => {
    await loginAs(page, 'chris@ltsc.test', /\/student\/dashboard|\/instructor\/dashboard/)
    await page.goto('/instructor/dashboard')
    test.skip((page.viewportSize()?.width ?? 768) >= 768, 'mobile-only test')
    await page.getByRole('button', { name: 'Open navigation' }).click()
    await expect(page.getByRole('link', { name: 'Switch to Student View' })).toBeVisible()
  })

  test('single-role instructor: drawer has no Switch to Student View', async ({ page }) => {
    await loginAs(page, 'pw_instructor@ltsc.test', /\/instructor\/dashboard/)
    await page.goto('/instructor/dashboard')
    test.skip((page.viewportSize()?.width ?? 768) >= 768, 'mobile-only test')
    await page.getByRole('button', { name: 'Open navigation' }).click()
    await expect(page.getByRole('link', { name: 'Switch to Student View' })).not.toBeVisible()
  })
})
