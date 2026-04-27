import { test, expect } from '@playwright/test'
import { runId } from './helpers'

const BASE = 'http://localhost:3000'

// 3.10 — password strength + email verification.
// Desktop-only because the register flow is the same across viewports and
// these tests create users via real signUp (one auth.users row per run).
test.describe('3.10 — password strength + email verification', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'auth.users mutation — desktop only')
  })

  test('rejects password missing required character classes', async ({ page }) => {
    const email = `auth_pw_${runId().toLowerCase()}@ltsc.test`

    await page.goto('/register')
    await page.getByLabel('First name').fill('Pat')
    await page.getByLabel('Last name').fill('Test')
    await page.getByLabel('Email').fill(email)
    // 14 chars (passes minLength) but no uppercase — Supabase policy rejects.
    await page.getByLabel('Password').fill('alllowercase12')
    await page.getByRole('button', { name: 'Create account' }).click()

    // Server returns Supabase's policy error verbatim, rendered in the
    // destructive-styled paragraph above the form fields.
    const errorMsg = page.locator('p.text-destructive')
    await expect(errorMsg).toBeVisible({ timeout: 10000 })
    await expect(errorMsg).toHaveText(/password/i)
    // Should NOT have redirected to check-email.
    await expect(page).toHaveURL(/\/register$/)
  })

  test('valid registration lands on /register/check-email', async ({ page }) => {
    const email = `auth_ok_${runId().toLowerCase()}@ltsc.test`

    await page.goto('/register')
    await page.getByLabel('First name').fill('Pat')
    await page.getByLabel('Last name').fill('Test')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill('ValidPassword12')
    await page.getByRole('button', { name: 'Create account' }).click()

    await page.waitForURL(/\/register\/check-email/, { timeout: 10000 })
    await expect(page.getByText('Check your email')).toBeVisible()
    await expect(page.getByText(email)).toBeVisible()
  })

  test('unconfirmed user cannot sign in until email is confirmed', async ({ page, request }) => {
    const email = `auth_gate_${runId().toLowerCase()}@ltsc.test`
    const password = 'ValidPassword12'

    // Register
    await page.goto('/register')
    await page.getByLabel('First name').fill('Pat')
    await page.getByLabel('Last name').fill('Test')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: 'Create account' }).click()
    await page.waitForURL(/\/register\/check-email/, { timeout: 10000 })

    // Try to sign in before confirming — should be blocked.
    await page.goto('/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByText(/confirm/i)).toBeVisible({ timeout: 10000 })
    await expect(page).toHaveURL(/\/login/)

    // Force-confirm via test API (simulates clicking the link).
    const resp = await request.post(`${BASE}/api/test/confirm-email`, {
      data: { email },
    })
    expect(resp.ok()).toBe(true)

    // Now sign in succeeds.
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL('/student/dashboard', { timeout: 10000 })
  })

  test('callback route with missing code redirects to /login with error', async ({ page }) => {
    await page.goto('/auth/callback')
    await expect(page).toHaveURL(/\/login\?error=missing_code/)
  })

  test('callback route with invalid code redirects to /login with error', async ({ page }) => {
    await page.goto('/auth/callback?code=not-a-real-code')
    await expect(page).toHaveURL(/\/login\?error=invalid_link/)
  })
})
