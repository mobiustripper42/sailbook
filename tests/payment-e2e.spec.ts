/**
 * Phase 2.10 — Full payment chain E2E
 *
 * Strategy: intercept the Stripe Checkout redirect before the browser leaves
 * the app (captures the checkout session ID), then fire a signed
 * checkout.session.completed webhook directly to the local server.
 * No Stripe CLI or Stripe-hosted UI required — the real webhook handler and
 * processRefund server action are exercised end-to-end.
 *
 * Requires: STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET in .env.local.
 */

import { test, expect } from '@playwright/test'
import Stripe from 'stripe'
import { createTestCourse, loginAs, runId } from './helpers'

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY missing — beforeAll skip guard should have prevented this')
  return new Stripe(key, { apiVersion: '2026-03-25.dahlia', typescript: true })
}

test.describe('Full payment chain E2E', () => {
  test.describe.configure({ mode: 'serial' })

  let courseId: string
  let checkoutSessionId: string
  let paymentIntentId: string

  const PRICE = 150

  test.beforeAll(async ({ browser }) => {
    test.skip(
      !process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET,
      'STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET not set'
    )
    test.setTimeout(60000)
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    try {
      courseId = await createTestCourse(page, {
        capacity: 4,
        title: `Payment E2E ${runId()}`,
        price: PRICE,
      })
    } finally {
      await ctx.close()
    }
  })

  // ---------------------------------------------------------------------------
  // Test 1: checkout initiation + webhook confirmation
  // ---------------------------------------------------------------------------
  test('student initiates checkout; enrollment confirmed via simulated webhook', async ({ page }) => {
    test.setTimeout(60000)
    const stripe = stripeClient()

    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard')
    await page.goto(`/student/courses/${courseId}`)
    await expect(page.getByRole('button', { name: 'Register & Pay' })).toBeVisible()

    // Intercept the Stripe redirect — abort navigation but capture the URL first.
    const stripeRequestPromise = page.waitForRequest(
      (req) => req.url().includes('checkout.stripe.com'),
      { timeout: 20000 }
    )
    await page.route(/checkout\.stripe\.com/, (route) => route.abort())

    await page.getByRole('button', { name: 'Register & Pay' }).click()

    const stripeReq = await stripeRequestPromise
    const sessionIdMatch = stripeReq.url().match(/(cs_test_[^?&#/]+)/)
    expect(sessionIdMatch, 'Stripe checkout session ID not found in redirect URL').toBeTruthy()
    checkoutSessionId = sessionIdMatch![1]

    // Create a real Stripe test charge — pm_card_visa is auto-confirmed in test mode.
    // Test 3 refunds this PI; cleanup is handled by Stripe test mode, not us.
    const pi = await stripe.paymentIntents.create({
      amount: PRICE * 100,
      currency: 'usd',
      payment_method: 'pm_card_visa',
      payment_method_types: ['card'],
      confirm: true,
      off_session: true,
    })
    paymentIntentId = pi.id

    // Build and sign a checkout.session.completed webhook event.
    const webhookPayload = JSON.stringify({
      id: `evt_test_${Date.now()}`,
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: checkoutSessionId,
          object: 'checkout.session',
          payment_intent: paymentIntentId,
          amount_total: PRICE * 100,
          currency: 'usd',
          status: 'complete',
        },
      },
    })
    const timestamp = Math.floor(Date.now() / 1000)
    // Stripe SDK types mark scheme/signature/cryptoProvider as required, but
    // runtime fills sane defaults — see stripe-node README example.
    const signature = stripe.webhooks.generateTestHeaderString({
      payload: webhookPayload,
      secret: process.env.STRIPE_WEBHOOK_SECRET!,
      timestamp,
    } as Parameters<typeof stripe.webhooks.generateTestHeaderString>[0])

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const webhookRes = await fetch(`${baseUrl}/api/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'stripe-signature': signature,
        'content-type': 'application/json',
      },
      body: webhookPayload,
    })
    expect(webhookRes.ok, `Webhook POST failed: ${webhookRes.status}`).toBeTruthy()

    // Reload course page — enrollment should now be confirmed.
    await page.goto(`/student/courses/${courseId}`)
    await expect(page.getByText('Enrolled')).toBeVisible({ timeout: 10000 })
    // Cancel button only appears for confirmed enrollments.
    await expect(page.getByRole('button', { name: 'Request Cancellation' })).toBeVisible()
  })

  // ---------------------------------------------------------------------------
  // Test 2: student requests cancellation
  // ---------------------------------------------------------------------------
  test('student requests cancellation', async ({ page }) => {
    test.setTimeout(30000)
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard')
    await page.goto(`/student/courses/${courseId}`)

    await page.getByRole('button', { name: 'Request Cancellation' }).click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await page.getByRole('button', { name: 'Yes, request cancellation' }).click()

    await expect(page.getByText('Cancellation Requested')).toBeVisible({ timeout: 10000 })
    // Cancel button must be gone once request is submitted.
    await expect(page.getByRole('button', { name: 'Request Cancellation' })).not.toBeVisible()
  })

  // ---------------------------------------------------------------------------
  // Test 3: admin processes a full refund
  // ---------------------------------------------------------------------------
  test('admin sees payment and processes full refund', async ({ page }) => {
    test.setTimeout(30000)
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
    await page.goto(`/admin/courses/${courseId}`)

    const row = page.getByRole('row').filter({ hasText: 'pw_student@ltsc.test' })
    await expect(row).toBeVisible()

    // Status column shows cancel_requested.
    await expect(row.getByRole('cell').nth(2)).toContainText('cancel_requested')
    // Payment column shows amount.
    await expect(row.getByRole('cell').nth(3)).toContainText(`$${PRICE}.00`)
    // Stripe dashboard link.
    await expect(row.getByRole('link', { name: 'Stripe ↗' })).toBeVisible()

    await row.getByRole('button', { name: 'Process Refund' }).click({ force: true })
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await expect(page.getByText(`Original charge: $${PRICE}.00`)).toBeVisible()

    // Full refund — leave the amount field at max and confirm.
    await page.getByRole('button', { name: 'Refund & Cancel' }).click({ force: true })

    await expect(row.getByRole('cell').nth(2)).toContainText('cancelled', { timeout: 15000 })
    await expect(row.getByRole('cell').nth(3)).toContainText(`$${PRICE}.00`)
  })

  // ---------------------------------------------------------------------------
  // Test 4: student sees enrollment is gone after refund
  // ---------------------------------------------------------------------------
  test('student course page no longer shows active enrollment after refund', async ({ page }) => {
    test.setTimeout(30000)
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard')
    await page.goto(`/student/courses/${courseId}`)

    // Enrollment is cancelled — Register & Pay button should reappear.
    await expect(page.getByRole('button', { name: 'Register & Pay' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Enrolled')).not.toBeVisible()
    await expect(page.getByText('Cancellation Requested')).not.toBeVisible()
  })
})
