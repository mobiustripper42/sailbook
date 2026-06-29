import { test, expect } from '@playwright/test'

// The public marketing page is a static server component (hardcoded card array,
// no auth, no DB), so these run across every viewport project — including the
// 375px mobile project required by issue #78's acceptance criteria.
test.describe('Public sailing-classes marketing page', () => {
  test('Open Sailing is the first card, ahead of ASA101', async ({ page }) => {
    await page.goto('/sailing-classes')

    const cards = page.locator('article')
    await expect(cards.first()).toBeVisible()

    // First card is Open Sailing; second is ASA101.
    await expect(cards.nth(0).getByRole('heading')).toContainText('Open Sailing')
    await expect(cards.nth(1).getByRole('heading')).toContainText('ASA101')
  })

  test('Open Sailing card shows the copy + price and registers at /courses/open', async ({ page }) => {
    await page.goto('/sailing-classes')

    const openSailing = page.locator('article').first()
    await expect(openSailing.getByRole('heading')).toContainText('No Experience Needed')
    await expect(openSailing.getByText(/take the tiller/)).toBeVisible()
    await expect(openSailing.getByText('3 Hours – $70')).toBeVisible()

    // "Register Here" lands on the seeded Open Sailing slug (`open`, not `open-sailing`).
    await expect(
      openSailing.getByRole('link', { name: 'Register Here' }),
    ).toHaveAttribute('href', '/courses/open')
  })

  test('the card image renders', async ({ page }) => {
    await page.goto('/sailing-classes')
    const img = page.locator('article').first().getByRole('img')
    await expect(img).toBeVisible()
    await expect(img).toHaveAttribute('alt', /Open Sailing/)
  })
})
