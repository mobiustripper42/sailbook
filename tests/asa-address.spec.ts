import { test, expect, type Page } from '@playwright/test'
import { loginAs, createTestCourse, clickCourseAction, selectTime, runId } from './helpers'

// #129 — ASA courses ship a textbook, so a student must have a mailing address
// on file before checkout. Non-ASA courses are unaffected.

const STUDENT = 'pw_student@ltsc.test'

function stripeConfigured() {
  const isPlaceholder = (v: string | undefined) => !v || v.includes('placeholder')
  return !isPlaceholder(process.env.STRIPE_SECRET_KEY)
}

// Mirrors createTestCourse but picks the ASA 101 course type (certification_body='ASA').
async function createAsaCourse(page: Page, title: string): Promise<string> {
  await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
  await page.goto('/admin/courses/new')
  await expect(page.getByRole('heading', { name: 'New Course' })).toBeVisible()

  await page.getByLabel('Course Type').click()
  await page.getByRole('option', { name: /ASA 101.*Basic Keelboat/ }).click()

  await page.getByLabel('Title Override').fill(title)
  await page.getByLabel('Capacity').fill('5')
  await page.getByLabel('Price ($)', { exact: true }).fill('250')
  await page.locator('input[type="date"]').fill('2027-09-15')
  await selectTime(page, 'session_start_0', '09:00')
  await selectTime(page, 'session_end_0', '17:00')
  await page.locator('section').filter({ hasText: 'Sessions' }).getByPlaceholder(/Dock A/).fill('Edgewater Park')

  await page.getByRole('button', { name: 'Create Course' }).click({ force: true })
  await page.waitForURL(/\/admin\/courses\/[0-9a-f-]+$/, { timeout: 10000 })
  const courseId = page.url().match(/\/admin\/courses\/([0-9a-f-]+)$/)![1]

  await clickCourseAction(page, 'Publish')
  return courseId
}

test.describe('ASA enrollment requires a mailing address (#129)', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'desktop-only (course-creation flow)')
    test.skip(!stripeConfigured(), 'STRIPE_SECRET_KEY not set (or placeholder only)')
  })

  test('ASA course prompts for an address, then proceeds to checkout once saved', async ({ page, request, browser }) => {
    test.setTimeout(60000)

    // Create the course in its own context — createAsaCourse logs in as admin,
    // and loginAs isn't idempotent on an already-authed page.
    const title = `ASA-Addr-${runId()}`
    const adminCtx = await browser.newContext()
    const courseId = await createAsaCourse(await adminCtx.newPage(), title)
    await adminCtx.close()

    // Start from a known state: student has no address on file.
    const clr = await request.post('/api/test/set-address', { data: { email: STUDENT, address: null } })
    expect(clr.ok()).toBeTruthy()

    await loginAs(page, STUDENT, '/student/dashboard')
    await page.goto(`/student/courses/${courseId}`)
    await page.getByRole('button', { name: 'Register & Pay' }).click()

    // Gate fires: the address dialog appears instead of a Stripe redirect.
    await expect(page.getByRole('heading', { name: 'Mailing address' })).toBeVisible()

    await page.getByLabel('Street address').fill('123 Harbor Rd')
    await page.getByLabel('City').fill('Cleveland')
    await page.getByLabel('State').fill('OH')
    await page.getByLabel('ZIP').fill('44113')

    // After saving, the retry passes the gate and heads to Stripe. Abort the
    // real navigation but assert the checkout request was made.
    const stripeRequest = page.waitForRequest(
      (req) => req.url().includes('checkout.stripe.com'),
      { timeout: 20000 },
    )
    await page.route(/checkout\.stripe\.com/, (route) => route.abort())

    await page.getByRole('button', { name: 'Save & continue' }).click()

    const req = await stripeRequest
    expect(req.url()).toMatch(/cs_test_/)
  })

  test('non-ASA course goes straight to checkout, no address prompt', async ({ page, request, browser }) => {
    test.setTimeout(60000)

    // Dinghy course (createTestCourse) has no certification_body — not gated.
    const adminCtx = await browser.newContext()
    const courseId = await createTestCourse(await adminCtx.newPage(), { capacity: 5, title: `NonAsa-${runId()}` })
    await adminCtx.close()
    await request.post('/api/test/set-address', { data: { email: STUDENT, address: null } })

    await loginAs(page, STUDENT, '/student/dashboard')
    await page.goto(`/student/courses/${courseId}`)

    const stripeRequest = page.waitForRequest(
      (req) => req.url().includes('checkout.stripe.com'),
      { timeout: 20000 },
    )
    await page.route(/checkout\.stripe\.com/, (route) => route.abort())

    await page.getByRole('button', { name: 'Register & Pay' }).click()

    // No dialog — proceeds directly to Stripe.
    await expect(page.getByRole('heading', { name: 'Mailing address' })).toHaveCount(0)
    const req = await stripeRequest
    expect(req.url()).toMatch(/cs_test_/)
  })
})
