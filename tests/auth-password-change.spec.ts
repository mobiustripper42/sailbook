import { test, expect, type Page, type APIRequestContext } from '@playwright/test'

// Phase 3.15 — logged-in password change.
// Each test registers a fresh email user (random suffix), force-confirms, and
// signs in. Avoids mutating shared seed users.

const VALID_PW = 'ValidPassword12'

async function registerFreshUser(
  page: Page,
  request: APIRequestContext,
): Promise<{ email: string; password: string }> {
  const suffix = Math.random().toString(36).slice(2, 8)
  const email = `pwchange_${suffix}@ltsc.test`

  await page.goto('/register')
  await page.getByLabel('First name').fill('Pw')
  await page.getByLabel('Last name').fill('Change')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(VALID_PW)
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.waitForURL(/\/register\/check-email/, { timeout: 10000 })

  const confirm = await request.post('http://localhost:3000/api/test/confirm-email', {
    data: { email },
  })
  expect(confirm.ok()).toBe(true)

  return { email, password: VALID_PW }
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('/student/dashboard', { timeout: 10000 })
}

test.describe('3.15 — change password', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'auth flow — desktop only')
  })

  test('signed-out user is redirected away from /account/password', async ({ page }) => {
    await page.goto('/account/password')
    await page.waitForURL(/\/login/, { timeout: 5000 })
  })

  test('happy path: change password, then sign in with the new one', async ({ page, request }) => {
    const { email, password } = await registerFreshUser(page, request)
    await signIn(page, email, password)

    const newPassword = 'BrandNewPass99'
    await page.goto('/account/password')
    await page.getByLabel('Current password').fill(password)
    await page.getByLabel('New password', { exact: true }).fill(newPassword)
    await page.getByLabel('Confirm new password').fill(newPassword)
    await page.getByRole('button', { name: 'Change password' }).click()
    await expect(page.getByText('Password updated.')).toBeVisible({ timeout: 10000 })

    // Sign out (clearing cookies is faster + role-agnostic) and sign in with the new password.
    await page.context().clearCookies()
    await signIn(page, email, newPassword)
  })

  test('old password is rejected after change', async ({ page, request }) => {
    const { email, password } = await registerFreshUser(page, request)
    await signIn(page, email, password)

    const newPassword = 'AnotherNewPw88'
    await page.goto('/account/password')
    await page.getByLabel('Current password').fill(password)
    await page.getByLabel('New password', { exact: true }).fill(newPassword)
    await page.getByLabel('Confirm new password').fill(newPassword)
    await page.getByRole('button', { name: 'Change password' }).click()
    await expect(page.getByText('Password updated.')).toBeVisible({ timeout: 10000 })

    await page.context().clearCookies()
    await page.goto('/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill(password) // old password
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByText(/invalid login credentials/i)).toBeVisible({ timeout: 10000 })
  })

  test('wrong current password is rejected', async ({ page, request }) => {
    const { email, password } = await registerFreshUser(page, request)
    await signIn(page, email, password)

    await page.goto('/account/password')
    await page.getByLabel('Current password').fill('WrongPassword12')
    await page.getByLabel('New password', { exact: true }).fill('NewPassword12345')
    await page.getByLabel('Confirm new password').fill('NewPassword12345')
    await page.getByRole('button', { name: 'Change password' }).click()
    await expect(page.getByText('Current password is incorrect.')).toBeVisible({ timeout: 10000 })
  })

  test('mismatched new + confirm is rejected', async ({ page, request }) => {
    const { email, password } = await registerFreshUser(page, request)
    await signIn(page, email, password)

    await page.goto('/account/password')
    await page.getByLabel('Current password').fill(password)
    await page.getByLabel('New password', { exact: true }).fill('NewPassword12345')
    await page.getByLabel('Confirm new password').fill('Different12345')
    await page.getByRole('button', { name: 'Change password' }).click()
    await expect(page.getByText('New password and confirmation do not match.')).toBeVisible({
      timeout: 10000,
    })
  })
})
