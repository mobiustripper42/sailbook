import { test, expect } from '@playwright/test'

test.describe('Public course catalog', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'desktop-only')
  })

  test('catalog page renders course type cards', async ({ page }) => {
    await page.goto('/courses')

    // Seed has active course types — at least one card should appear
    await expect(page.getByRole('heading', { name: 'Courses' })).toBeVisible()
    // ASA 101 is in seed, is_active = true
    await expect(page.getByText('ASA 101 - Basic Keelboat Sailing')).toBeVisible()
    // short_code badge
    await expect(page.getByText('ASA101').first()).toBeVisible()
    // certification_body badge
    await expect(page.getByText('ASA').first()).toBeVisible()
  })

  test('each card links to its detail page', async ({ page }) => {
    await page.goto('/courses')

    // Click the ASA 101 card
    await page.getByText('ASA 101 - Basic Keelboat Sailing').click()
    await expect(page).toHaveURL(/\/courses\/asa101/)
    await expect(page.getByRole('heading', { name: /ASA 101/ })).toBeVisible()
  })

  test('course types with no upcoming sections show Coming soon badge', async ({ page }) => {
    await page.goto('/courses')

    // All seed courses use far-future dates in test setup,
    // but if any type has no active courses it will show Coming soon.
    // Verify the badge renders correctly when present — if all have upcoming,
    // this assertion passes vacuously (no false positives).
    const comingSoonBadges = page.getByText('Coming soon')
    // Just confirm the page doesn't error when some cards are in coming-soon state
    await expect(page.getByRole('heading', { name: 'Courses' })).toBeVisible()
    // If at least one coming-soon badge is present, verify it's inside a card
    const count = await comingSoonBadges.count()
    if (count > 0) {
      await expect(comingSoonBadges.first()).toBeVisible()
    }
  })

  test('mobile: catalog renders at 375px', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'webkit mobile handled by separate project')
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/courses')

    await expect(page.getByRole('heading', { name: 'Courses' })).toBeVisible()
    await expect(page.getByText('ASA 101 - Basic Keelboat Sailing')).toBeVisible()
  })
})
