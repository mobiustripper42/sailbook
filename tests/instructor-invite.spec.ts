import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

const ADMIN_EMAIL = 'pw_admin@ltsc.test'
const STUDENT_EMAIL = 'pw_student2@ltsc.test'

async function resetInstructorFlag(request: import('@playwright/test').APIRequestContext, value: boolean) {
  const resp = await request.post('http://localhost:3000/api/test/set-role-flag', {
    data: { email: STUDENT_EMAIL, flag: 'is_instructor', value },
  })
  if (!resp.ok()) {
    throw new Error(`Failed to reset role flag: ${resp.status()} ${await resp.text()}`)
  }
}

// The invites table uses `role` as the primary key — there is only ever a
// single row per role. Tests that regenerate that row race when they run in
// parallel: worker A captures token T_A, worker B regenerates to T_B before
// A's student clicks Accept, and T_A fails.
//
// Serial mode pins the whole describe to one worker in a fixed order, so
// tests 1 and 3 never race each other. Token flow is not viewport-specific,
// so the mutating tests (1, 3) are further scoped to desktop only. Test 2
// (invalid token) is safe on all viewports — it reads a token that never
// exists in the DB.
test.describe.configure({ mode: 'serial' })

test.describe('Instructor invite link', () => {

  test('admin generates link, student accepts and becomes instructor', async ({ browser, request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'desktop-only to avoid cross-viewport race on the shared invites row')
    // Make sure pw_student2 starts as a pure student, no matter what a previous run left behind
    await resetInstructorFlag(request, false)

    // Step 1: admin generates a fresh invite link
    const adminCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    let inviteUrl: string
    try {
      await loginAs(adminPage, ADMIN_EMAIL, '/admin/dashboard')
      await adminPage.goto('/admin/instructors')
      await expect(adminPage.getByRole('heading', { name: 'Instructors' })).toBeVisible()

      // Capture whatever token is currently displayed (if any) so we can
      // tell when the regenerate action has actually landed.
      const initialText =
        (await adminPage.getByTestId('invite-url').textContent().catch(() => null))?.trim() ?? null

      // Regenerate — confirm dialog pops up; accept it.
      // `.on` (not `.once`) — the page may emit multiple dialogs over the
      // life of the test, and a stray earlier dialog consuming the one-shot
      // handler caused this click to hang waiting on an unhandled confirm.
      adminPage.on('dialog', (d) => d.accept())
      await adminPage
        .getByRole('button', { name: /Generate link|Regenerate link/ })
        .click()

      // Wait for the displayed token to differ from the pre-click value —
      // otherwise we race the server action and read the stale token from a
      // previous run (initialText is null on a fresh DB, so any populated
      // value satisfies this check).
      await expect
        .poll(async () =>
          (await adminPage.getByTestId('invite-url').textContent().catch(() => null))?.trim() ?? null,
        )
        .not.toBe(initialText)

      inviteUrl = (await adminPage.getByTestId('invite-url').textContent())?.trim() ?? ''
      expect(inviteUrl).toMatch(/\/invite\/instructor\/[A-Za-z0-9_-]+$/)
    } finally {
      await adminCtx.close()
    }

    // Step 2: student opens the invite link in a fresh context, signs in, accepts
    const studentCtx = await browser.newContext()
    const studentPage = await studentCtx.newPage()
    try {
      // Unauthenticated visit should show sign-in prompt (page is public).
      // CardTitle renders as a div, so match by text rather than role=heading.
      await studentPage.goto(inviteUrl)
      await expect(studentPage.getByText('Instructor invitation')).toBeVisible()
      await expect(studentPage.getByRole('link', { name: 'Sign in' })).toBeVisible()

      // Sign in, then revisit the link
      await loginAs(studentPage, STUDENT_EMAIL, /\/student\/dashboard/)
      await studentPage.goto(inviteUrl)
      await expect(studentPage.getByRole('button', { name: 'Accept invitation' })).toBeVisible()

      await studentPage.getByRole('button', { name: 'Accept invitation' }).click()

      // On success the action redirects to the instructor dashboard
      await studentPage.waitForURL(/\/instructor\/dashboard/, { timeout: 15000 })
      await expect(studentPage).toHaveURL(/\/instructor\/dashboard/)
    } finally {
      await studentCtx.close()
      // Clean up — flip pw_student2 back to a pure student so downstream tests keep working
      await resetInstructorFlag(request, false)
    }
  })

  test('invalid token shows a clear error', async ({ page }) => {
    // Sign in first — the accept form only renders for authenticated users
    await loginAs(page, STUDENT_EMAIL, /\/student\/dashboard/)
    await page.goto('/invite/instructor/definitely-not-a-real-token')

    await expect(page.getByRole('button', { name: 'Accept invitation' })).toBeVisible()
    await page.getByRole('button', { name: 'Accept invitation' }).click()

    await expect(page.getByText(/invalid or has been revoked/i)).toBeVisible()
    await expect(page).toHaveURL(/\/invite\/instructor\//)
  })

  test('regenerating invalidates the old link', async ({ browser, request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'desktop-only to avoid cross-viewport race on the shared invites row')

    await resetInstructorFlag(request, false)

    const adminCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    let oldUrl: string
    let newUrl: string
    try {
      await loginAs(adminPage, ADMIN_EMAIL, '/admin/dashboard')
      await adminPage.goto('/admin/instructors')

      // Single durable handler accepts every confirm dialog this test fires.
      adminPage.on('dialog', (d) => d.accept())

      // Generate once
      await adminPage.getByRole('button', { name: /Generate link|Regenerate link/ }).click()
      await expect(adminPage.getByTestId('invite-url')).toContainText('/invite/instructor/')
      oldUrl = (await adminPage.getByTestId('invite-url').textContent())?.trim() ?? ''

      // Regenerate again
      await adminPage.getByRole('button', { name: 'Regenerate link' }).click()
      // Wait for the URL to actually change
      await expect
        .poll(async () => (await adminPage.getByTestId('invite-url').textContent())?.trim())
        .not.toBe(oldUrl)
      newUrl = (await adminPage.getByTestId('invite-url').textContent())?.trim() ?? ''
      expect(newUrl).not.toEqual(oldUrl)
    } finally {
      await adminCtx.close()
    }

    // Student tries to use the OLD url — should fail
    const studentCtx = await browser.newContext()
    const studentPage = await studentCtx.newPage()
    try {
      await loginAs(studentPage, STUDENT_EMAIL, /\/student\/dashboard/)
      await studentPage.goto(oldUrl)
      await studentPage.getByRole('button', { name: 'Accept invitation' }).click()
      await expect(studentPage.getByText(/invalid or has been revoked/i)).toBeVisible()

      // Confirm pw_student2 is still a pure student
      await studentPage.goto('/student/dashboard')
      await expect(studentPage).toHaveURL(/\/student\/dashboard/)
    } finally {
      await studentCtx.close()
      await resetInstructorFlag(request, false)
    }
  })
})
