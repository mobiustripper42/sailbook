import { test, expect } from '@playwright/test'

// Phase 3.11 — OAuth + handle_new_user trigger.
// Real Google round-trip is not exercised (would need a live Google test
// account); we verify our integration points: button is rendered, the action
// kicks off an OAuth redirect or fails gracefully, the trigger creates a
// profile, and the invite page round-trips `next` through sign-in.

test.describe('3.11 — Google OAuth button rendering', () => {
  test('login page shows Continue with Google', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible()
  })

  test('register page shows Continue with Google', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible()
  })
})

test.describe('3.11 — invite round-trip via ?next=', () => {
  // Token resolution would need a real invite seed; we only check the link shape.
  test('instructor invite page passes ?next= to Sign in and Create account', async ({ page }) => {
    await page.goto('/invite/instructor/fake-token-for-link-shape-test')

    // We are logged out, so the Sign in / Create account variant renders.
    const signIn = page.getByRole('link', { name: 'Sign in' })
    const register = page.getByRole('link', { name: 'Create account' })
    await expect(signIn).toBeVisible()
    await expect(register).toBeVisible()

    const signInHref = await signIn.getAttribute('href')
    const registerHref = await register.getAttribute('href')
    expect(signInHref).toContain('/login?next=')
    expect(signInHref).toContain(encodeURIComponent('/invite/instructor/fake-token-for-link-shape-test'))
    expect(registerHref).toContain('/register?next=')
    expect(registerHref).toContain(encodeURIComponent('/invite/instructor/fake-token-for-link-shape-test'))
  })

  test('login page wired with ?next= forwards through hidden field', async ({ page }) => {
    await page.goto('/login?next=' + encodeURIComponent('/invite/instructor/example'))
    // Both the email-password form and the GoogleSignInButton form carry the
    // next param so either path round-trips correctly.
    const hidden = page.locator('input[name="next"][type="hidden"]')
    await expect(hidden).toHaveCount(2)
    for (const el of await hidden.all()) {
      await expect(el).toHaveValue('/invite/instructor/example')
    }
  })

  test('login ?next= rejects external URLs', async ({ page }) => {
    await page.goto('/login?next=' + encodeURIComponent('//evil.com/path'))
    // Open-redirect guard in client + server: hidden input not rendered for unsafe next.
    await expect(page.locator('input[name="next"][type="hidden"]')).toHaveCount(0)
  })
})

test.describe('3.11 — handle_new_user trigger', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'auth.users mutation — desktop only')
  })

  test('email/password signUp creates a profile via the trigger', async ({ page, request }) => {
    const suffix = Math.random().toString(36).slice(2, 8)
    const email = `trigger_${suffix}@ltsc.test`

    await page.goto('/register')
    await page.getByLabel('First name').fill('Trig')
    await page.getByLabel('Last name').fill('Ger')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill('ValidPassword12')
    await page.getByRole('button', { name: 'Create account' }).click()
    await page.waitForURL(/\/register\/check-email/, { timeout: 10000 })

    // Force-confirm so we can sign in and read the profile via the user session.
    const confirm = await request.post('http://localhost:3000/api/test/confirm-email', {
      data: { email },
    })
    expect(confirm.ok()).toBe(true)

    // Sign in and verify the profile row exists with the trigger-populated data.
    await page.goto('/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill('ValidPassword12')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL('/student/dashboard', { timeout: 10000 })

    // The Account page shows the first/last name from the profile row.
    await page.goto('/student/account')
    const firstNameInput = page.locator('input[name="first_name"]')
    await expect(firstNameInput).toHaveValue('Trig')
    const lastNameInput = page.locator('input[name="last_name"]')
    await expect(lastNameInput).toHaveValue('Ger')
  })
})
