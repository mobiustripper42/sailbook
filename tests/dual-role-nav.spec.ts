import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

// Chris Marino — is_instructor: true, is_student: true
const DUAL_ROLE_EMAIL = 'chris@ltsc.test'

test.describe('dual-role nav toggle', () => {
  test('student view shows Switch to Instructor View link', async ({ page }) => {
    await loginAs(page, DUAL_ROLE_EMAIL, /\/student\/dashboard|\/instructor\/dashboard/)
    await page.goto('/student/dashboard')
    await expect(page.getByRole('link', { name: 'Switch to Instructor View' })).toBeVisible()
  })

  test('Switch to Instructor View navigates to instructor dashboard', async ({ page }) => {
    await loginAs(page, DUAL_ROLE_EMAIL, /\/student\/dashboard|\/instructor\/dashboard/)
    await page.goto('/student/dashboard')
    const viewport = page.viewportSize()
    if (viewport && viewport.width < 768) {
      await page.getByRole('button', { name: 'Open navigation' }).click()
    }
    await page.getByRole('link', { name: 'Switch to Instructor View' }).click()
    await page.waitForURL(/\/instructor\/dashboard/, { timeout: 10000 })
    await expect(page).toHaveURL(/\/instructor\/dashboard/)
  })

  test('instructor view shows Switch to Student View link', async ({ page }) => {
    await loginAs(page, DUAL_ROLE_EMAIL, /\/student\/dashboard|\/instructor\/dashboard/)
    await page.goto('/instructor/dashboard')
    await expect(page.getByRole('link', { name: 'Switch to Student View' })).toBeVisible()
  })

  test('Switch to Student View navigates to student dashboard', async ({ page }) => {
    await loginAs(page, DUAL_ROLE_EMAIL, /\/student\/dashboard|\/instructor\/dashboard/)
    await page.goto('/instructor/dashboard')
    await page.getByRole('link', { name: 'Switch to Student View' }).click()
    await page.waitForURL(/\/student\/dashboard/, { timeout: 10000 })
    await expect(page).toHaveURL(/\/student\/dashboard/)
  })

  test('single-role instructor does not see student toggle', async ({ page }) => {
    await loginAs(page, 'pw_instructor@ltsc.test', /\/instructor\/dashboard/)
    await page.goto('/instructor/dashboard')
    // Instructor layout has no mobile drawer — sidebar is always visible
    await expect(page.getByRole('link', { name: 'Switch to Student View' })).not.toBeVisible()
  })

  test('single-role student does not see instructor toggle', async ({ page }) => {
    await loginAs(page, 'pw_student@ltsc.test', /\/student\/dashboard/)
    await page.goto('/student/dashboard')
    const viewport = page.viewportSize()
    if (viewport && viewport.width < 768) {
      await page.getByRole('button', { name: 'Open navigation' }).click()
    }
    await expect(page.getByRole('link', { name: 'Switch to Instructor View' })).not.toBeVisible()
  })
})
