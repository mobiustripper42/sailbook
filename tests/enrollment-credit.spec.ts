import { test, expect } from '@playwright/test'
import { createTestCourse, loginAs, runId } from './helpers'

// #106 — admin can issue account credit instead of a cash refund. No Stripe
// call happens for this path (issueCredit never touches stripe.refunds), so
// unlike enrollment-refund.spec.ts's Stripe-dependent partial-refund test,
// this doesn't need real Stripe test keys — /api/test/set-cancel-requested's
// stripePaymentIntentId is just stored on the payment row for display, never
// validated against a live PaymentIntent by issueCredit.
test.describe('Admin issue-credit & cancel flow', () => {
  test.describe.configure({ mode: 'serial' })

  let courseId: string
  let enrollmentId: string
  const STUDENT_ID = 'f1000000-0000-0000-0000-000000000004' // pw_student2 fixture

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(60000)
    const adminCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    try {
      courseId = await createTestCourse(adminPage, {
        capacity: 6,
        title: `Credit Test ${runId()}`,
        price: 250,
      })
    } finally {
      await adminCtx.close()
    }

    const apiCtx = await browser.newContext()
    const apiPage = await apiCtx.newPage()
    try {
      const r = await apiPage.request.post('http://localhost:3000/api/test/enroll', {
        data: { courseId, studentEmail: 'pw_student2@ltsc.test' },
      })
      expect(r.ok()).toBeTruthy()
      enrollmentId = ((await r.json()) as { enrollmentId: string }).enrollmentId

      const cr = await apiPage.request.post('http://localhost:3000/api/test/set-cancel-requested', {
        data: {
          enrollmentId,
          stripePaymentIntentId: `pi_test_credit_${runId()}`,
          amountCents: 25000,
        },
      })
      expect(cr.ok()).toBeTruthy()
    } finally {
      await apiCtx.close()
    }
  })

  test('admin issues partial credit instead of a refund', async ({ page }) => {
    test.skip(test.info().project.name === 'mobile', 'Status/payment columns use nth() locators that shift on mobile')
    test.setTimeout(60000)

    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')

    // Baseline balance — pw_student2 is a shared fixture, other test runs may
    // have already credited them, so assert the DELTA, not an absolute total.
    // The balance paragraph doesn't render at all when the balance is $0
    // (creditBalanceCents > 0 gate on the page), so give the lookup a short
    // explicit timeout — without one, a not-present locator polls up to the
    // test's ambient timeout before the .catch rescues it.
    await page.goto(`/admin/students/${STUDENT_ID}`)
    const beforeText = await page.getByText(/Account credit: \$/).textContent({ timeout: 2000 }).catch(() => null)
    const beforeCents = beforeText ? Math.round(parseFloat(beforeText.replace(/[^0-9.]/g, '')) * 100) : 0

    await page.goto(`/admin/courses/${courseId}`)
    const row = page.getByRole('row').filter({ hasText: 'pw_student2@ltsc.test' })
    await expect(row).toBeVisible()
    await expect(row.getByRole('cell').nth(3)).toContainText('$250.00')

    // Both actions are offered — refund and credit
    await expect(row.getByRole('button', { name: 'Process Refund' })).toBeVisible()
    await expect(row.getByRole('button', { name: 'Issue Credit' })).toBeVisible()

    await row.getByRole('button', { name: 'Issue Credit' }).click({ force: true })
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await expect(page.getByText('Original charge: $250.00')).toBeVisible()

    await page.getByLabel('Credit amount (USD)').fill('50.00')
    await page.getByRole('button', { name: 'Issue Credit & Cancel' }).click({ force: true })

    // Enrollment flips to cancelled
    await expect(row.getByRole('cell').nth(2)).toContainText('cancelled', { timeout: 15000 })
    // Payment cell shows strikethrough original + credited amount — no refund minus-sign
    await expect(row.getByRole('cell').nth(3)).toContainText('$250.00')
    await expect(row.getByRole('cell').nth(3)).toContainText('$50.00 credit')

    // Student profile shows the balance increased by exactly the credited amount
    await page.goto(`/admin/students/${STUDENT_ID}`)
    const afterDollars = ((beforeCents + 5000) / 100).toFixed(2)
    await expect(page.getByText(`Account credit: $${afterDollars}`)).toBeVisible({ timeout: 15000 })
  })

  test('admin can issue credit directly from a confirmed enrollment (no student request needed)', async ({ page, request, browser }) => {
    test.skip(test.info().project.name === 'mobile', 'Status/payment columns use nth() locators that shift on mobile')
    test.setTimeout(60000)

    // Admin-initiated cancellation (weather, capacity, etc.) never goes
    // through cancel_requested — the student never asked. #106's whole point
    // was an admin judgment call, so this path must work from 'confirmed' too.
    const adminCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    let confirmedCourseId: string
    try {
      confirmedCourseId = await createTestCourse(adminPage, {
        capacity: 6,
        title: `Confirmed Credit Test ${runId()}`,
        price: 250,
      })
    } finally {
      await adminCtx.close()
    }

    const r = await request.post('http://localhost:3000/api/test/enroll', {
      data: { courseId: confirmedCourseId, studentEmail: 'pw_student2@ltsc.test' },
    })
    expect(r.ok()).toBeTruthy()
    const confirmedEnrollmentId = ((await r.json()) as { enrollmentId: string }).enrollmentId

    const seed = await request.post('http://localhost:3000/api/test/set-cancel-requested', {
      data: {
        enrollmentId: confirmedEnrollmentId,
        stripePaymentIntentId: `pi_test_confirmed_credit_${runId()}`,
        amountCents: 25000,
        status: 'confirmed',
      },
    })
    expect(seed.ok()).toBeTruthy()

    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
    await page.goto(`/admin/courses/${confirmedCourseId}`)
    const row = page.getByRole('row').filter({ hasText: 'pw_student2@ltsc.test' })
    await expect(row).toBeVisible()
    await expect(row.getByRole('cell').nth(2)).toContainText('Enrolled')

    // Both actions are already offered — no "Request Cancellation" needed
    await expect(row.getByRole('button', { name: 'Process Refund' })).toBeVisible()
    await expect(row.getByRole('button', { name: 'Issue Credit' })).toBeVisible()
    // The old silent no-refund shortcut is NOT offered when a payment exists
    await expect(row.getByRole('button', { name: 'Cancel', exact: true })).toHaveCount(0)

    await row.getByRole('button', { name: 'Issue Credit' }).click({ force: true })
    await page.getByLabel('Credit amount (USD)').fill('25.00')
    await page.getByRole('button', { name: 'Issue Credit & Cancel' }).click({ force: true })

    await expect(row.getByRole('cell').nth(2)).toContainText('cancelled', { timeout: 15000 })
    await expect(row.getByRole('cell').nth(3)).toContainText('$25.00 credit')
  })

  test('no student-facing credit request UI exists', async ({ page }) => {
    // Student can request cancellation, but never chooses refund vs. credit —
    // that's an admin-only decision (#106).
    await loginAs(page, 'pw_student2@ltsc.test', '/student/dashboard')
    await page.goto(`/student/courses/${courseId}`)
    await expect(page.getByRole('button', { name: /credit/i })).toHaveCount(0)
  })
})
