import { test, expect } from '@playwright/test'
import Stripe from 'stripe'
import { createTestCourse, loginAs, runId } from './helpers'

const BASE = 'http://localhost:3000'

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY missing — beforeAll skip guard should have prevented this')
  return new Stripe(key, { apiVersion: '2026-03-25.dahlia', typescript: true })
}

// #107 — spend account credit at checkout. Deliberately uses pw_student, NOT
// pw_student2 — enrollment-credit.spec.ts (#106) issues credit to
// pw_student2 concurrently under fullyParallel, and credit_ledger balance is
// a per-student aggregate (not scoped to a single course), so sharing a
// fixture there produced a real cross-file race (code-review-style catch,
// found by running suites together, not in isolation). Every seed-credit
// call uses `absolute: true` so each test starts from a known balance
// regardless of leftover credit from other runs on this fixture.
test.describe('#107 — credit applied at checkout', () => {
  test.describe.configure({ mode: 'serial' })

  test('credit fully covers the price — no Stripe charge, enrollment confirms directly', async ({ page, request }) => {
    // desktop and mobile projects both run this whole file independently and
    // concurrently (mode: 'serial' only orders tests *within* one project's
    // run) — two projects redeeming the same pw_student credit balance at
    // the same time is a self-inflicted race, not a real bug. Desktop-only,
    // matching the next test's existing convention.
    test.skip(test.info().project.name === 'mobile', 'Shared credit-balance fixture races against the desktop project run — desktop only')
    test.setTimeout(60000)

    const price = 100
    const courseId = await createTestCourse(page, {
      capacity: 4,
      title: `Full Credit Test ${runId()}`,
      price,
    })

    // More than enough credit — remainder should be $0
    const seed = await request.post(`${BASE}/api/test/seed-credit`, {
      data: { studentEmail: 'pw_student@ltsc.test', amountCents: 15000, absolute: true },
    })
    expect(seed.ok()).toBeTruthy()

    const studentCtx = await page.context().browser()!.newContext()
    const studentPage = await studentCtx.newPage()
    try {
      await loginAs(studentPage, 'pw_student@ltsc.test', '/student/dashboard')
      await studentPage.goto(`/student/courses/${courseId}`)
      await expect(studentPage.getByText(/\$150\.00.{0,2}account credit/)).toBeVisible({ timeout: 15000 })

      // No Stripe redirect — window.location.href goes straight to the
      // in-app success page since createCheckoutSession skips Stripe entirely.
      await studentPage.getByRole('button', { name: 'Register & Pay' }).click()
      await studentPage.waitForURL('**/student/checkout/success', { timeout: 15000 })

      await studentPage.goto(`/student/courses/${courseId}`)
      await expect(studentPage.getByText('Enrolled')).toBeVisible({ timeout: 10000 })

      // Balance decremented by exactly the price ($150 - $100 = $50 remaining)
      await studentPage.goto('/student/account')
      await expect(studentPage.getByText('Account credit: $50.00')).toBeVisible({ timeout: 10000 })
    } finally {
      await studentCtx.close()
    }
  })

  test('partial credit — Stripe charges the remainder, credit fully redeemed on webhook', async ({ page, request }) => {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    const isPlaceholder = (v: string | undefined) => !v || v.includes('placeholder')
    test.skip(
      isPlaceholder(stripeKey) || isPlaceholder(webhookSecret),
      'STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET not set (or placeholder only)'
    )
    test.skip(test.info().project.name === 'mobile', 'Reuses the desktop-only Stripe redirect interception pattern')
    test.setTimeout(60000)
    const stripe = stripeClient()

    const price = 150
    const courseId = await createTestCourse(page, {
      capacity: 4,
      title: `Partial Credit Test ${runId()}`,
      price,
    })

    // Exactly $100 — leaves a $50 remainder on a $150 course
    const seed = await request.post(`${BASE}/api/test/seed-credit`, {
      data: { studentEmail: 'pw_student@ltsc.test', amountCents: 10000, absolute: true },
    })
    expect(seed.ok()).toBeTruthy()

    const studentCtx = await page.context().browser()!.newContext()
    const studentPage = await studentCtx.newPage()
    let checkoutSessionId: string
    try {
      await loginAs(studentPage, 'pw_student@ltsc.test', '/student/dashboard')
      await studentPage.goto(`/student/courses/${courseId}`)

      const stripeRequestPromise = studentPage.waitForRequest(
        (req) => req.url().includes('checkout.stripe.com'),
        { timeout: 20000 }
      )
      await studentPage.route(/checkout\.stripe\.com/, (route) => route.abort())
      await studentPage.getByRole('button', { name: 'Register & Pay' }).click()

      const stripeReq = await stripeRequestPromise
      const sessionIdMatch = stripeReq.url().match(/(cs_test_[^?&#/]+)/)
      expect(sessionIdMatch, 'Stripe checkout session ID not found in redirect URL').toBeTruthy()
      checkoutSessionId = sessionIdMatch![1]
    } finally {
      await studentCtx.close()
    }

    // Verify createCheckoutSession actually reduced the charge and recorded
    // the applied amount — not just that the webhook trusts what we send it.
    const realSession = await stripe.checkout.sessions.retrieve(checkoutSessionId, {
      expand: ['line_items'],
    })
    expect(realSession.metadata?.credit_applied_cents).toBe('10000')
    expect(realSession.line_items?.data[0]?.amount_total).toBe(5000)

    const pi = await stripe.paymentIntents.create({
      amount: 5000,
      currency: 'usd',
      payment_method: 'pm_card_visa',
      payment_method_types: ['card'],
      confirm: true,
      off_session: true,
    })

    const webhookPayload = JSON.stringify({
      id: `evt_test_${Date.now()}`,
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: checkoutSessionId,
          object: 'checkout.session',
          payment_intent: pi.id,
          amount_total: 5000,
          currency: 'usd',
          status: 'complete',
          metadata: { credit_applied_cents: '10000', course_id: courseId },
        },
      },
    })
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = stripe.webhooks.generateTestHeaderString({
      payload: webhookPayload,
      secret: webhookSecret!,
      timestamp,
    } as Parameters<typeof stripe.webhooks.generateTestHeaderString>[0])

    const webhookRes = await fetch(`${BASE}/api/webhooks/stripe`, {
      method: 'POST',
      headers: { 'stripe-signature': signature, 'content-type': 'application/json' },
      body: webhookPayload,
    })
    expect(webhookRes.ok, `Webhook POST failed: ${webhookRes.status}`).toBeTruthy()

    const verifyCtx = await page.context().browser()!.newContext()
    const verifyPage = await verifyCtx.newPage()
    try {
      await loginAs(verifyPage, 'pw_student@ltsc.test', '/student/dashboard')
      await verifyPage.goto(`/student/courses/${courseId}`)
      await expect(verifyPage.getByText('Enrolled')).toBeVisible({ timeout: 10000 })

      // $100 balance fully spent on the credit portion of this $150 charge
      await verifyPage.goto('/student/account')
      await expect(verifyPage.getByText(/Account credit:/)).toHaveCount(0, { timeout: 10000 })
    } finally {
      await verifyCtx.close()
    }
  })
})
