import { test, expect } from '@playwright/test'

// Email one-time-code sign-in (DEC-031). Flag-gated and dark by default, so
// these only run when NEXT_PUBLIC_EMAIL_CODE_AUTH=true (the dev server must be
// started with it; both the server and this runner read it from the env).
// They depend on local Supabase's mail catcher (Mailpit at :54324) for the
// emailed code, so they're desktop-only to avoid 3× the Supabase round-trips.
const FLAG_ON = process.env.NEXT_PUBLIC_EMAIL_CODE_AUTH === 'true'
const MAILPIT = 'http://127.0.0.1:54324'

// andy@ltsc.test is a seeded, email-confirmed admin → signs in to /admin/dashboard.
const KNOWN_EMAIL = 'andy@ltsc.test'
const UNKNOWN_EMAIL = 'nobody-not-seeded@example.test'

async function purgeAllMail() {
  await fetch(`${MAILPIT}/api/v1/messages`, { method: 'DELETE' }).catch(() => {})
}

async function searchTo(email: string): Promise<Array<{ ID: string; Created: string }>> {
  const res = await fetch(
    `${MAILPIT}/api/v1/search?query=${encodeURIComponent('to:' + email)}`,
  ).catch(() => null)
  if (!res || !res.ok) return []
  const json = await res.json().catch(() => ({}))
  return Array.isArray(json.messages) ? json.messages : []
}

async function fetchLatestCode(email: string): Promise<string> {
  for (let i = 0; i < 30; i++) {
    const msgs = await searchTo(email)
    if (msgs.length) {
      const newest = msgs.sort((a, b) => b.Created.localeCompare(a.Created))[0]
      const msg = await fetch(`${MAILPIT}/api/v1/message/${newest.ID}`).then((r) => r.json())
      const body = `${msg?.Text ?? ''} ${msg?.HTML ?? ''}`
      const m = body.match(/\b(\d{6})\b/)
      if (m) return m[1]
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`No sign-in code arrived for ${email}`)
}

test.describe('Email one-time-code sign-in (DEC-031)', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(!FLAG_ON, 'NEXT_PUBLIC_EMAIL_CODE_AUTH is off (feature is dark)')
    test.skip(testInfo.project.name !== 'desktop', 'desktop-only (Mailpit-dependent)')
  })

  test('a known account can request a code and sign in', async ({ page }) => {
    await purgeAllMail()

    await page.goto('/login')
    // #code-email is the code form's field (distinct from the password form's #email).
    await page.locator('#code-email').fill(KNOWN_EMAIL)
    await page.getByRole('button', { name: 'Email me a code' }).click()

    // Advances to the code step with enumeration-safe copy.
    await expect(page.getByText(/a 6-digit code is on its way/i)).toBeVisible()

    const code = await fetchLatestCode(KNOWN_EMAIL)
    await page.getByLabel('6-digit code').fill(code)
    // Scope to the verify form — the password form below also has a "Sign in" button.
    const verifyForm = page.locator('form').filter({ has: page.locator('#token') })
    await verifyForm.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL(/\/admin\/dashboard/)
  })

  test('an unknown email gets identical UX and no code is sent (no enumeration)', async ({ page }) => {
    await purgeAllMail()

    await page.goto('/login')
    await page.locator('#code-email').fill(UNKNOWN_EMAIL)
    await page.getByRole('button', { name: 'Email me a code' }).click()

    // Same step-2 UI as a real account — the response must not reveal anything.
    await expect(page.getByText(/a 6-digit code is on its way/i)).toBeVisible()

    // No account → Supabase sends nothing. Give it a beat, then assert empty.
    await page.waitForTimeout(3000)
    expect(await searchTo(UNKNOWN_EMAIL)).toHaveLength(0)
  })
})
