import { test, expect } from '@playwright/test'

test.describe('?next= param forwarding through auth pages', () => {
  test('login page register link includes ?next= after hydration', async ({ page }) => {
    await page.goto('/login?next=/student/courses/123')
    const registerLink = page.getByRole('link', { name: 'Register' })
    await expect(registerLink).toHaveAttribute('href', '/register?next=/student/courses/123')
  })

  test('register page sign-in link includes ?next= after hydration', async ({ page }) => {
    await page.goto('/register?next=/student/courses/123')
    const signInLink = page.getByRole('link', { name: 'Sign in' })
    await expect(signInLink).toHaveAttribute('href', '/login?next=/student/courses/123')
  })

  test('login page register link has no ?next= when none present', async ({ page }) => {
    await page.goto('/login')
    const registerLink = page.getByRole('link', { name: 'Register' })
    await expect(registerLink).toHaveAttribute('href', '/register')
  })

  test('open-redirect attempt is rejected — register link falls back to bare /register', async ({ page }) => {
    await page.goto('/login?next=https://evil.com')
    const registerLink = page.getByRole('link', { name: 'Register' })
    // safeNextPath rejects non-path values; href must not carry the malicious URL
    await expect(registerLink).toHaveAttribute('href', '/register')
  })
})
