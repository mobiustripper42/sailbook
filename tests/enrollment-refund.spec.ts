import { test, expect } from '@playwright/test'
import Stripe from 'stripe'
import { createTestCourse, loginAs, runId } from './helpers'

// Stripe test client — creates real test-mode PIs so processRefund can call
// stripe.refunds.create against an actual payment_intent.
function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY not set in test env')
  return new Stripe(key, { apiVersion: '2026-03-25.dahlia', typescript: true })
}

test.describe('Admin refund & cancel flow', () => {
  test.describe.configure({ mode: 'serial' })

  let courseId: string
  let enrollmentId: string   // pw_student — no-payment path
  let enrollment2Id: string  // pw_student2 — with-payment path

  test.beforeAll(async ({ browser }) => {
    // Create course
    const adminCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    try {
      courseId = await createTestCourse(adminPage, {
        capacity: 6,
        title: `Refund Test ${runId()}`,
        price: 250,
      })
    } finally {
      await adminCtx.close()
    }

    // Enroll both students
    const apiCtx = await browser.newContext()
    const apiPage = await apiCtx.newPage()
    try {
      const r1 = await apiPage.request.post('http://localhost:3000/api/test/enroll', {
        data: { courseId, studentEmail: 'pw_student@ltsc.test' },
      })
      expect(r1.ok()).toBeTruthy()
      enrollmentId = ((await r1.json()) as { enrollmentId: string }).enrollmentId

      const r2 = await apiPage.request.post('http://localhost:3000/api/test/enroll', {
        data: { courseId, studentEmail: 'pw_student2@ltsc.test' },
      })
      expect(r2.ok()).toBeTruthy()
      enrollment2Id = ((await r2.json()) as { enrollmentId: string }).enrollmentId
    } finally {
      await apiCtx.close()
    }
  })

  test('payment column shows dash when no payment exists', async ({ page }) => {
    test.skip(test.info().project.name === 'mobile', 'Payment column hidden at 375px')
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
    await page.goto(`/admin/courses/${courseId}`)
    const row = page.getByRole('row').filter({ hasText: 'pw_student@ltsc.test' })
    await expect(row).toBeVisible()
    await expect(row.getByRole('cell').nth(3)).toHaveText('—')
  })

  test('cancel_requested without payment shows Cancel (no refund) button', async ({ page }) => {
    test.skip(test.info().project.name === 'mobile', 'Status/payment columns use nth() locators that shift on mobile')
    const apiCtx = await page.context().browser()!.newContext()
    const apiPage = await apiCtx.newPage()
    try {
      const res = await apiPage.request.post('http://localhost:3000/api/test/set-cancel-requested', {
        data: { enrollmentId },
      })
      expect(res.ok()).toBeTruthy()
    } finally {
      await apiCtx.close()
    }

    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
    await page.goto(`/admin/courses/${courseId}`)
    const row = page.getByRole('row').filter({ hasText: 'pw_student@ltsc.test' })
    await expect(row.getByRole('cell').nth(2)).toContainText('cancel_requested')
    await expect(row.getByRole('button', { name: 'Cancel (no refund)' })).toBeVisible()
  })

  test('no-refund cancel transitions enrollment to cancelled', async ({ page }) => {
    test.skip(test.info().project.name === 'mobile', 'Status/payment columns use nth() locators that shift on mobile')
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
    await page.goto(`/admin/courses/${courseId}`)
    // Only one "Cancel (no refund)" button exists at this point in the serial flow
    const cancelBtn = page.getByRole('button', { name: 'Cancel (no refund)' })
    await cancelBtn.scrollIntoViewIfNeeded()
    await cancelBtn.click({ force: true })
    const row = page.getByRole('row').filter({ hasText: 'pw_student@ltsc.test' })
    await expect(row.getByRole('cell').nth(2)).toContainText('cancelled', { timeout: 10000 })
    // After cancel, only the Restore button remains (no Cancel/Refund buttons)
    await expect(row.getByRole('button', { name: 'Restore' })).toBeVisible()
  })

  test('payment column shows amount + Stripe link and partial refund works', async ({ page }) => {
    test.skip(test.info().project.name === 'mobile', 'Payment/status columns use nth() locators that shift on mobile')
    test.skip(
      !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder'),
      'Real Stripe keys not configured (or placeholder only)'
    )
    // Create a real Stripe test PI outside Next.js so processRefund can refund it
    const stripe = stripeClient()
    const pi = await stripe.paymentIntents.create({
      amount: 25000,
      currency: 'usd',
      payment_method: 'pm_card_visa',
      payment_method_types: ['card'],
      confirm: true,
      off_session: true,
    })

    // Seed payment row + set cancel_requested
    const apiCtx = await page.context().browser()!.newContext()
    const apiPage = await apiCtx.newPage()
    try {
      const res = await apiPage.request.post('http://localhost:3000/api/test/set-cancel-requested', {
        data: {
          enrollmentId: enrollment2Id,
          stripePaymentIntentId: pi.id,
          amountCents: 25000,
        },
      })
      expect(res.ok()).toBeTruthy()
    } finally {
      await apiCtx.close()
    }

    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
    await page.goto(`/admin/courses/${courseId}`)
    const row = page.getByRole('row').filter({ hasText: 'pw_student2@ltsc.test' })
    await expect(row).toBeVisible()

    // Payment cell shows original amount and Stripe link
    await expect(row.getByRole('cell').nth(3)).toContainText('$250.00')
    await expect(row.getByRole('link', { name: 'Stripe ↗' })).toBeVisible()
    await expect(row.getByRole('button', { name: 'Process Refund' })).toBeVisible()

    // Open dialog and issue partial refund
    await row.getByRole('button', { name: 'Process Refund' }).click({ force: true })
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await expect(page.getByText('Original charge: $250.00')).toBeVisible()

    await page.getByLabel('Refund amount (USD)').fill('50.00')
    await page.getByRole('button', { name: 'Refund & Cancel' }).click({ force: true })

    // Enrollment flips to cancelled
    await expect(row.getByRole('cell').nth(2)).toContainText('cancelled', { timeout: 15000 })
    // Payment cell shows strikethrough original + refund amount
    await expect(row.getByRole('cell').nth(3)).toContainText('$250.00')
    await expect(row.getByRole('cell').nth(3)).toContainText('$50.00')
  })

  // Admin-initiated cancellations (weather, capacity, etc.) never go through
  // cancel_requested — the student never asked. Refund must be resolvable
  // directly from a confirmed enrollment too, not gated on a student request.
  test('admin can process a refund directly from a confirmed enrollment (no student request needed)', async ({ page, request, browser }) => {
    test.skip(test.info().project.name === 'mobile', 'Status/payment columns use nth() locators that shift on mobile')
    test.skip(
      !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder'),
      'Real Stripe keys not configured (or placeholder only) — processRefund calls stripe.refunds.create against a real PI'
    )
    test.setTimeout(60000)

    const adminCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    let confirmedCourseId: string
    try {
      confirmedCourseId = await createTestCourse(adminPage, {
        capacity: 6,
        title: `Confirmed Refund Test ${runId()}`,
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

    // Real Stripe test PI — processRefund calls stripe.refunds.create against it,
    // unlike issueCredit (which never touches Stripe).
    const stripe = stripeClient()
    const pi = await stripe.paymentIntents.create({
      amount: 25000,
      currency: 'usd',
      payment_method: 'pm_card_visa',
      payment_method_types: ['card'],
      confirm: true,
      off_session: true,
    })

    const seed = await request.post('http://localhost:3000/api/test/set-cancel-requested', {
      data: {
        enrollmentId: confirmedEnrollmentId,
        stripePaymentIntentId: pi.id,
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

    // Offered directly — no "Request Cancellation" needed
    await expect(row.getByRole('button', { name: 'Process Refund' })).toBeVisible()
    // The old silent no-refund shortcut is NOT offered when a payment exists
    await expect(row.getByRole('button', { name: 'Cancel', exact: true })).toHaveCount(0)

    await row.getByRole('button', { name: 'Process Refund' }).click({ force: true })
    await page.getByRole('button', { name: 'Refund & Cancel' }).click({ force: true })

    await expect(row.getByRole('cell').nth(2)).toContainText('cancelled', { timeout: 15000 })
    await expect(row.getByRole('cell').nth(3)).toContainText('$250.00')
  })
})
