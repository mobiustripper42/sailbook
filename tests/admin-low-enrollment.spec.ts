import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

const ASA_101_ID = 'b1000000-0000-0000-0000-000000000001'

// Mutates a seed course type. Desktop-only — running across all viewports in
// parallel would race the mid-test state.
test.describe('Admin — low enrollment dashboard tile', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop', 'Mutates seed; desktop only')
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
  })

  test('default seed: tile shows healthy state (minimum_enrollment is NULL on all course types)', async ({ page }) => {
    await expect(page.getByText('Enrollment is healthy')).toBeVisible()
  })

  test('setting minimum_enrollment above current count flags the dashboard tile', async ({ page }) => {
    // Set ASA 101's minimum to an impossible value. ASA 101 has an active
    // course (c002 Evening Series) whose first session is seeded ~5 days out —
    // inside the default 14-day lead window — so the "starting soon" tile fires.
    // Seed dates are anchored to current_date (issue #70), so this holds on any run date.
    await page.goto(`/admin/course-types/${ASA_101_ID}/edit`)
    await page.getByLabel('Minimum Enrollment').fill('99')
    await page.getByRole('button', { name: 'Save Changes' }).click()
    await page.waitForURL('**/admin/course-types', { timeout: 10000 })

    try {
      await page.goto('/admin/dashboard')
      await expect(page.getByText('Low Enrollment')).toBeVisible()
      await expect(page.getByText('Below minimum, starting soon')).toBeVisible()
    } finally {
      // Restore so other tests / re-runs see the seed default.
      await page.goto(`/admin/course-types/${ASA_101_ID}/edit`)
      await page.getByLabel('Minimum Enrollment').fill('')
      await page.getByRole('button', { name: 'Save Changes' }).click()
      await page.waitForURL('**/admin/course-types', { timeout: 10000 })
    }
  })
})
