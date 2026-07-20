import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

// Unified app-shell (task 10.2): one config-driven shell renders the correct
// nav per role, marks the active item, and shows the Muster brand block.
// Sidebar is desktop/tablet (md+); skip on the mobile project.
test.describe('unified app shell — nav per role', () => {
  test('admin sidebar shows the admin nav items + active state', async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', /\/admin\/dashboard/)
    await page.goto('/admin/schedule')
    test.skip((page.viewportSize()?.width ?? 768) < 768, 'sidebar is md+ only')

    const aside = page.locator('aside')
    // Calendar + Courses are consolidated into one Schedule item (10.3).
    for (const label of [
      'Dashboard',
      'Schedule',
      'Course Types',
      'Users',
      'Missed Sessions',
      'Notifications',
    ]) {
      await expect(aside.getByRole('link', { name: label })).toBeVisible()
    }
    // The current section is marked active for assistive tech + styling.
    await expect(aside.getByRole('link', { name: 'Schedule' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    // Muster brand block subtitle.
    await expect(aside.getByText('Learn to Sail Cleveland')).toBeVisible()
  })

  test('student sidebar shows the student nav items', async ({ page }) => {
    await loginAs(page, 'pw_student@ltsc.test', /\/student\/dashboard/)
    await page.goto('/student/dashboard')
    test.skip((page.viewportSize()?.width ?? 768) < 768, 'sidebar is md+ only')

    const aside = page.locator('aside')
    for (const label of ['Dashboard', 'Browse Courses', 'My Courses', 'Attendance', 'Experience', 'Account']) {
      await expect(aside.getByRole('link', { name: label })).toBeVisible()
    }
    // No admin-only item leaks into the student shell.
    await expect(aside.getByRole('link', { name: 'Users' })).toHaveCount(0)
  })
})
