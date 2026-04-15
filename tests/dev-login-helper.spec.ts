import { test, expect } from '@playwright/test'

test.describe('dev login helper', () => {
  test.beforeEach(() => {
    test.skip(!process.env.NEXT_PUBLIC_DEV_MODE, 'NEXT_PUBLIC_DEV_MODE not set — skipping dev login helper tests')
  })

  test('quick login dropdown visible on login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('combobox')).toBeVisible()
    await expect(page.getByText('dev')).toBeVisible()
  })

  test('selecting a seed user logs in as admin', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: /Andy Kaminski/ }).click()
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 })
  })

  test('selecting a seed user logs in as student', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: /Sam Davies/ }).click()
    await page.waitForURL(/\/student\/dashboard/, { timeout: 10000 })
  })

  test('selecting a seed user logs in as instructor', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: /Mike Theriault/ }).click()
    await page.waitForURL(/\/instructor\/dashboard/, { timeout: 10000 })
  })
})
