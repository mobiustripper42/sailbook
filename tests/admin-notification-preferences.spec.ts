import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

// 3.8 — Admin notification preferences UI.
//
// These tests cover the preferences page itself: form loads with defaults,
// saves, persists across reload, non-admins are bounced. They do NOT trigger
// the dispatcher — the "channel disabled → buffer doesn't get the channel"
// path requires NOTIFICATIONS_ENABLED=false to use the mock buffer, and the
// setup for asserting absence is brittle. Run dispatcher behavior manually
// or as a follow-up when convenient.

test.describe('Admin notification preferences', () => {
  test('admin: page loads with all channels enabled by default', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop')

    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
    await page.goto('/admin/notification-preferences')

    await expect(page.getByRole('heading', { name: 'Notification preferences' })).toBeVisible()

    // Every checkbox is checked on first visit (null prefs → all enabled)
    await expect(page.getByLabel('SMS').first()).toBeChecked()
    await expect(page.getByLabel('Email').first()).toBeChecked()
    await expect(page.getByLabel('SMS').nth(1)).toBeChecked()
    await expect(page.getByLabel('Email').nth(1)).toBeChecked()
  })

  test('admin: save toggles persist across reload', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop')

    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
    await page.goto('/admin/notification-preferences')

    // Disable SMS for admin_enrollment_alert (first SMS checkbox in the form)
    const enrollmentSms = page.locator('input[name="admin_enrollment_alert__sms"]')
    const enrollmentEmail = page.locator('input[name="admin_enrollment_alert__email"]')
    const lowSms = page.locator('input[name="admin_low_enrollment__sms"]')
    const lowEmail = page.locator('input[name="admin_low_enrollment__email"]')

    await enrollmentSms.uncheck()
    await lowEmail.uncheck()

    await page.getByRole('button', { name: 'Save preferences' }).click()

    // Server action returns null on success — wait for loading to finish
    await expect(page.getByRole('button', { name: 'Save preferences' })).toBeEnabled()

    // Reload — values must persist
    await page.reload()

    await expect(enrollmentSms).not.toBeChecked()
    await expect(enrollmentEmail).toBeChecked()
    await expect(lowSms).toBeChecked()
    await expect(lowEmail).not.toBeChecked()

    // Reset for downstream tests / smoke runs — re-enable everything.
    await enrollmentSms.check()
    await lowEmail.check()
    await page.getByRole('button', { name: 'Save preferences' }).click()
    await expect(page.getByRole('button', { name: 'Save preferences' })).toBeEnabled()
  })

  test('non-admin: redirected away from preferences page', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop')

    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard')
    await page.goto('/admin/notification-preferences')

    // Proxy / page guard should redirect — not on the preferences page anymore.
    await expect(page).not.toHaveURL(/\/admin\/notification-preferences/)
  })

  test('admin nav: Notifications link visible in sidebar', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop')

    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')

    await expect(
      page.getByRole('link', { name: 'Notifications', exact: true }),
    ).toBeVisible()
  })
})
