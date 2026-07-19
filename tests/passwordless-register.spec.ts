import { test, expect } from '@playwright/test'

// Passwordless registration (DEC-033, phase 2). Flag-gated and dark by default,
// so these run only when NEXT_PUBLIC_EMAIL_CODE_AUTH=true (the dev server must be
// started with it). They read the emailed code from local Supabase's Mailpit, so
// they're desktop-only.
const FLAG_ON = process.env.NEXT_PUBLIC_EMAIL_CODE_AUTH === 'true'
const MAILPIT = 'http://127.0.0.1:54324'

async function searchTo(email: string): Promise<Array<{ ID: string; Created: string }>> {
  const res = await fetch(
    `${MAILPIT}/api/v1/search?query=${encodeURIComponent('to:' + email)}`,
  ).catch(() => null)
  if (!res || !res.ok) return []
  const json = await res.json().catch(() => ({}))
  return Array.isArray(json.messages) ? json.messages : []
}

async function purgeMailbox(email: string) {
  const ids = (await searchTo(email)).map((m) => m.ID)
  if (ids.length) {
    await fetch(`${MAILPIT}/api/v1/messages`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ IDs: ids }),
    }).catch(() => {})
  }
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
  throw new Error(`No code email arrived for ${email}`)
}

async function fillProfile(page: import('@playwright/test').Page, first: string, last: string, email: string) {
  await page.getByLabel('First name').fill(first)
  await page.getByLabel('Last name').fill(last)
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Phone').fill('216-555-0100') // required as of #129
}

test.describe('Passwordless registration (DEC-033)', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(!FLAG_ON, 'NEXT_PUBLIC_EMAIL_CODE_AUTH is off (feature is dark)')
    test.skip(testInfo.project.name !== 'desktop', 'desktop-only (Mailpit-dependent)')
  })

  test('a new user registers with no password and lands signed in', async ({ page }) => {
    const stamp = Date.now()
    const email = `pwless-${stamp}@example.test`
    const first = `Pat${stamp}`

    await page.goto('/register')
    // No password field in passwordless mode.
    await expect(page.getByLabel('Password')).toHaveCount(0)

    await fillProfile(page, first, 'Sailor', email)
    await page.getByRole('button', { name: 'Email me a code' }).click()
    await expect(page.getByText(/Enter it to finish creating your account/i)).toBeVisible()

    const code = await fetchLatestCode(email)
    await page.getByLabel('6-digit code').fill(code)
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page).toHaveURL(/\/student\/dashboard/)
    // Profile row was created by handle_new_user from the OTP `data` — the
    // signed-in student's first name renders in the chrome.
    await expect(page.getByText(first).first()).toBeVisible()
  })

  test('re-registering an email signs into the existing account without clobbering the profile', async ({ page }) => {
    // Self-contained (no seed-user OTP contention): register a unique email,
    // sign out, then re-register the SAME email with a different name. The
    // second request just sends a sign-in code (no dup); the original profile
    // must survive — collision is silent + non-destructive (DEC-033).
    const stamp = Date.now()
    const email = `collide-${stamp}@example.test`

    await page.goto('/register')
    await fillProfile(page, `Orig${stamp}`, 'Sailor', email)
    await page.getByRole('button', { name: 'Email me a code' }).click()
    await page.getByLabel('6-digit code').fill(await fetchLatestCode(email))
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page).toHaveURL(/\/student\/dashboard/)

    // Sign out without depending on nav chrome.
    await page.context().clearCookies()
    // Drop the first (now-consumed) code so we read only the re-register code.
    await purgeMailbox(email)

    await page.goto('/register')
    await fillProfile(page, `Clobber${stamp}`, 'Nope', email)
    await page.getByRole('button', { name: 'Email me a code' }).click()
    await page.getByLabel('6-digit code').fill(await fetchLatestCode(email))
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page).toHaveURL(/\/student\/dashboard/)

    // Existing profile intact — original name shows, the re-typed one never applied.
    await expect(page.getByText(`Orig${stamp}`).first()).toBeVisible()
    await expect(page.getByText(`Clobber${stamp}`)).toHaveCount(0)
  })
})
