/**
 * Phase 2.3 — Stripe Checkout Session creation
 *
 * Tests the checkout initiation flow:
 * - Register & Pay button redirects to Stripe
 * - Full course disables the button
 * - Success and cancel pages render correctly
 *
 * Full end-to-end payment (redirect → Stripe → webhook → confirm) is covered in 2.10.
 */
import { test, expect } from '@playwright/test';
import { loginAs, runId, createTestCourse } from './helpers';

// Desktop only — writes enrollment records
test.describe('Stripe Checkout — initiation', () => {
  test('Register & Pay redirects to Stripe checkout', async ({ page, browser }) => {
    test.skip(test.info().project.name !== 'desktop');
    test.setTimeout(60000);

    const title = `PW Checkout ${runId()}`;

    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    const courseId = await createTestCourse(adminPage, { capacity: 4, title });
    await adminCtx.close();

    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard');
    await page.goto(`/student/courses/${courseId}`);

    const btn = page.getByRole('button', { name: 'Register & Pay' });
    await expect(btn).toBeEnabled();

    // Click and wait for redirect to Stripe
    const navigationPromise = page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 });
    await btn.click();

    // Loading state visible while server action runs
    await expect(page.getByRole('button', { name: 'Preparing checkout…' })).toBeVisible({ timeout: 5000 });

    await navigationPromise;
    expect(page.url()).toMatch(/checkout\.stripe\.com/);
  });

  test('full course shows disabled Course Full button', async ({ browser }) => {
    test.skip(test.info().project.name !== 'desktop');
    test.setTimeout(60000);

    const title = `PW Full Co ${runId()}`;

    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    const courseId = await createTestCourse(adminPage, { capacity: 1, title });
    await adminCtx.close();

    // Fill the one spot via test API (confirmed = counts against capacity)
    const apiCtx = await browser.newContext();
    const apiPage = await apiCtx.newPage();
    const apiResp = await apiPage.request.post('http://localhost:3000/api/test/enroll', {
      data: { courseId, studentEmail: 'pw_student@ltsc.test' },
    });
    expect(apiResp.ok(), `Test enrollment failed: ${await apiResp.text()}`).toBeTruthy();
    await apiCtx.close();

    // jordan visits the full course
    const jordanCtx = await browser.newContext();
    try {
      const jordanPage = await jordanCtx.newPage();
      await loginAs(jordanPage, 'jordan@ltsc.test', '/student/dashboard');
      await jordanPage.goto(`/student/courses/${courseId}`);

      // Per 5.7: full course replaces "Course Full" disabled button with "Join waitlist" CTA.
      await expect(jordanPage.getByRole('button', { name: 'Join waitlist' })).toBeVisible();
      await expect(jordanPage.getByRole('button', { name: 'Register & Pay' })).not.toBeVisible();
    } finally {
      await jordanCtx.close();
    }
  });
});

// ─── Checkout result pages ────────────────────────────────────────────────────
// These pages are static/simple — run at all viewports.

test.describe('Stripe Checkout — success page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard');
  });

  test('renders confirmation message and navigation links', async ({ page }) => {
    await page.goto('/student/checkout/success');
    await expect(page.getByText("You're registered!")).toBeVisible();
    await expect(page.getByText('Check your email for a confirmation receipt')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Go to dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse courses', exact: true })).toBeVisible();
  });

  test('dashboard link points to student dashboard', async ({ page }) => {
    await page.goto('/student/checkout/success');
    const link = page.getByRole('link', { name: 'Go to dashboard' });
    await expect(link).toHaveAttribute('href', '/student/dashboard');
  });
});

test.describe('Stripe Checkout — cancel page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard');
  });

  test('renders cancellation message with hold duration', async ({ page }) => {
    await page.goto('/student/checkout/cancel');
    await expect(page.getByText('Payment cancelled')).toBeVisible();
    // ENROLLMENT_HOLD_MINUTES=1 in test env → "1 minute"
    await expect(page.getByText(/1 minute/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse courses', exact: true })).toBeVisible();
  });

  test('shows return-to-course link when course_id is in query string', async ({ page, browser }) => {
    test.skip(test.info().project.name !== 'desktop');
    test.setTimeout(90000);

    const title = `PW Cancel ${runId()}`;
    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    const courseId = await createTestCourse(adminPage, { capacity: 4, title });
    await adminCtx.close();

    await page.goto(`/student/checkout/cancel?course_id=${courseId}`);
    const returnLink = page.getByRole('link', { name: 'Return to course' });
    await expect(returnLink).toBeVisible();
    await expect(returnLink).toHaveAttribute('href', `/student/courses/${courseId}`);
  });

  test('omits return-to-course link when no course_id', async ({ page }) => {
    await page.goto('/student/checkout/cancel');
    await expect(page.getByRole('link', { name: 'Return to course' })).not.toBeVisible();
  });
});
