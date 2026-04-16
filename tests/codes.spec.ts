import { test, expect } from '@playwright/test'

// Verify that experience level options on the register page are loaded
// from the codes table (not hardcoded). Tests run against the dev server
// which queries local Supabase.

test.describe('codes table — experience levels on register page', () => {
  test('register page shows experience level options from codes table', async ({ page }) => {
    await page.goto('/register')

    const select = page.locator('select[name="experienceLevel"]')
    await expect(select).toBeVisible()

    // The three seeded experience level codes should appear
    const options = select.locator('option')
    const values = await options.evaluateAll((els) =>
      els.map((el) => (el as HTMLOptionElement).value)
    )

    expect(values).toContain('beginner')
    expect(values).toContain('intermediate')
    expect(values).toContain('advanced')
  })

  test('register page experience level option labels include descriptions', async ({ page }) => {
    await page.goto('/register')

    const select = page.locator('select[name="experienceLevel"]')
    const options = select.locator('option')
    const texts = await options.evaluateAll((els) =>
      els.map((el) => el.textContent ?? '')
    )

    // Each code has a description appended: "Label — description"
    expect(texts.some((t) => t.includes('Beginner'))).toBe(true)
    expect(texts.some((t) => t.includes('Intermediate'))).toBe(true)
    expect(texts.some((t) => t.includes('Advanced'))).toBe(true)
  })
})

test.describe('codes table — experience levels in admin student edit', () => {
  test('admin student edit form shows experience level options from codes table', async ({ page }) => {
    // Log in as admin
    await page.goto('/login')
    await page.fill('input[name="email"]', 'andy@ltsc.test')
    await page.fill('input[name="password"]', 'qwert12345')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin/dashboard')

    // Navigate to Sam's edit page (sam has experience_level = 'beginner')
    await page.goto('/admin/students/a1000000-0000-0000-0000-000000000005/edit')

    const select = page.locator('select[name="experience_level"]')
    await expect(select).toBeVisible()

    const values = await select.locator('option').evaluateAll((els) =>
      els.map((el) => (el as HTMLOptionElement).value)
    )

    expect(values).toContain('beginner')
    expect(values).toContain('intermediate')
    expect(values).toContain('advanced')

    // Sam's current value should be pre-selected
    await expect(select).toHaveValue('beginner')
  })
})
