import { test, expect } from '@playwright/test'

test.describe('?next= param forwarding through auth pages', () => {
  test('login page register link includes ?next= after hydration', async ({ page }) => {
    await page.goto('/login?next=/student/courses/123')
    const registerLink = page.getByRole('link', { name: 'Register' })
    // After hydration, useSearchParams() returns the real params and the href updates
    await expect(registerLink).toHaveAttribute('href', /\/register.*next=/)
  })

  test('register page sign-in link includes ?next= after hydration', async ({ page }) => {
    await page.goto('/register?next=/student/courses/123')
    const signInLink = page.getByRole('link', { name: 'Sign in' })
    await expect(signInLink).toHaveAttribute('href', /\/login.*next=/)
  })

  test('login page register link has no ?next= when none present', async ({ page }) => {
    await page.goto('/login')
    const registerLink = page.getByRole('link', { name: 'Register' })
    await expect(registerLink).toHaveAttribute('href', '/register')
  })
})
