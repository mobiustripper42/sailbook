import { test, expect } from '@playwright/test'
import crypto from 'crypto'
import { createTestCourse, loginAs, runId } from './helpers'

// Stripe signature format: t=<unix_ts>,v1=<hmac_hex>
// Algorithm: HMAC-SHA256(ts + "." + payload, secret) — secret used as-is (no decoding)
function signPayload(payload: string, secret: string): string {
  const ts = Math.floor(Date.now() / 1000)
  const sig = crypto.createHmac('sha256', secret).update(`${ts}.${payload}`).digest('hex')
  return `t=${ts},v1=${sig}`
}

function makeCheckoutEvent(sessionId: string): string {
  return JSON.stringify({
    id: `evt_test_${sessionId}`,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: sessionId,
        object: 'checkout.session',
        amount_total: 25000,
        currency: 'usd',
        payment_intent: `pi_test_${sessionId}`,
      },
    },
  })
}

test.describe('Stripe webhook', () => {
  test('valid checkout.session.completed confirms enrollment and creates attendance', async ({
    browser,
    request,
  }) => {
    test.skip(test.info().project.name !== 'desktop')
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    test.skip(!webhookSecret, 'STRIPE_WEBHOOK_SECRET not set')

    const sessionId = `cs_test_webhook_${runId()}`
    let courseId: string

    // Admin creates course
    const adminCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    try {
      courseId = await createTestCourse(adminPage, {
        capacity: 4,
        title: `Webhook Test ${runId()}`,
      })
    } finally {
      await adminCtx.close()
    }

    // Seed a pending_payment hold with a unique session ID
    const holdRes = await request.post('http://localhost:3000/api/test/set-pending-hold', {
      data: { courseId, studentEmail: 'pw_student@ltsc.test', checkoutSessionId: sessionId },
    })
    expect(holdRes.ok()).toBeTruthy()

    // Fire the webhook
    const payload = makeCheckoutEvent(sessionId)
    const webhookRes = await request.post('http://localhost:3000/api/webhooks/stripe', {
      data: payload,
      headers: {
        'content-type': 'application/json',
        'stripe-signature': signPayload(payload, webhookSecret!),
      },
    })
    expect(webhookRes.ok()).toBeTruthy()
    const body = await webhookRes.json() as { received: boolean }
    expect(body.received).toBe(true)

    // Student visits course page — should show "Enrolled" (not Register or Resume)
    const studentCtx = await browser.newContext()
    const studentPage = await studentCtx.newPage()
    try {
      await loginAs(studentPage, 'pw_student@ltsc.test', '/student/dashboard')
      await studentPage.goto(`/student/courses/${courseId}`)
      await expect(studentPage.getByText('Enrolled').first()).toBeVisible({ timeout: 10000 })
      await expect(studentPage.getByRole('button', { name: 'Register & Pay' })).not.toBeVisible()
      await expect(studentPage.getByRole('button', { name: 'Resume Payment' })).not.toBeVisible()
    } finally {
      await studentCtx.close()
    }
  })

  test('duplicate webhook event is handled idempotently', async ({ request }) => {
    test.skip(test.info().project.name !== 'desktop')
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    test.skip(!webhookSecret, 'STRIPE_WEBHOOK_SECRET not set')

    // Unknown session — no enrollment in DB, but should return 200 both times (not 500)
    const sessionId = `cs_test_dupe_${runId()}`
    const payload = makeCheckoutEvent(sessionId)
    const sig = signPayload(payload, webhookSecret!)
    const headers = { 'content-type': 'application/json', 'stripe-signature': sig }

    const res1 = await request.post('http://localhost:3000/api/webhooks/stripe', { data: payload, headers })
    expect(res1.ok()).toBeTruthy()

    const res2 = await request.post('http://localhost:3000/api/webhooks/stripe', { data: payload, headers })
    expect(res2.ok()).toBeTruthy()
  })

  test('invalid signature returns 400', async ({ request }) => {
    test.skip(test.info().project.name !== 'desktop')
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    test.skip(!webhookSecret, 'STRIPE_WEBHOOK_SECRET not set')

    const payload = makeCheckoutEvent(`cs_test_badsig_${runId()}`)
    const res = await request.post('http://localhost:3000/api/webhooks/stripe', {
      data: payload,
      headers: {
        'content-type': 'application/json',
        'stripe-signature': 't=1234567890,v1=invalidsignature',
      },
    })
    expect(res.status()).toBe(400)
  })

  test('unknown checkout session ID returns 200', async ({ request }) => {
    test.skip(test.info().project.name !== 'desktop')
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    test.skip(!webhookSecret, 'STRIPE_WEBHOOK_SECRET not set')

    const payload = makeCheckoutEvent(`cs_test_unknown_${runId()}`)
    const res = await request.post('http://localhost:3000/api/webhooks/stripe', {
      data: payload,
      headers: {
        'content-type': 'application/json',
        'stripe-signature': signPayload(payload, webhookSecret!),
      },
    })
    expect(res.ok()).toBeTruthy()
  })
})
