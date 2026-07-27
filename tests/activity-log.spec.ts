import { test, expect } from '@playwright/test';
import { loginAs, createEnrolledCourse } from './helpers';

// Task 10.8 — audit / activity log (#144, DEC-038).
// Foundation + the enrollment emitters. Reading is admin-only (RLS), writes
// arrive only through the log_event RPC, and the feed is append-only.

test.describe('Admin activity log', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'admin surface — desktop only');
  });

  test('an admin reaches the feed from the nav', async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
    await page.getByRole('link', { name: 'Activity', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/activity/);
    await expect(page.getByRole('heading', { name: 'Activity' })).toBeVisible();
    await expect(page.getByTestId('activity-filters')).toBeVisible();
  });

  test('a non-admin cannot open the feed', async ({ page }) => {
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard');
    await page.goto('/admin/activity');
    // Guarded explicitly rather than shown an empty feed, which would read as
    // "nothing happened" instead of "not yours". The redirect lands on /login,
    // which bounces an already-signed-in student to their own dashboard.
    await expect(page).toHaveURL(/\/student\/dashboard/);
    await expect(page.getByTestId('activity-feed')).toHaveCount(0);
  });

  test('the student nav does not offer Activity', async ({ page }) => {
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard');
    await expect(page.getByRole('link', { name: 'Activity', exact: true })).toHaveCount(0);
  });

  test('a cancellation is recorded with its actor and course', async ({ page, browser }) => {
    const title = `Activity log check ${Date.now().toString().slice(-6)}`;
    // The helper enrols via /api/test/enroll, which writes with the service
    // role and emits nothing — so anything in the feed came from the real
    // cancelEnrollment action, not from setup.
    const { courseId } = await createEnrolledCourse(browser, { title });

    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
    await page.goto(`/admin/courses/${courseId}`);
    page.once('dialog', (d) => d.accept()); // "Cancel this enrollment?"
    await page.getByRole('button', { name: 'Cancel', exact: true }).first().click();
    await page.waitForLoadState('networkidle');

    await page.goto('/admin/activity');
    await expect(page.getByTestId('activity-feed')).toBeVisible();

    const cancelled = page.locator('[data-event-type="enrollment.cancelled"]').first();
    await expect(cancelled).toBeVisible();
    await expect(cancelled).toContainText('Enrollment cancelled');
    // The acting admin, not the student who owns the enrollment.
    await expect(cancelled.getByTestId('activity-actor')).toHaveText('PW Admin');
    await expect(cancelled).toContainText(title);
  });

  test('the type filter narrows the feed and clears again', async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
    await page.goto('/admin/activity');

    const rows = page.getByTestId('activity-row');
    await expect(rows.first()).toBeVisible();

    await page.getByTestId('activity-type-enrollment.cancelled').click();
    await expect(page).toHaveURL(/type=enrollment.cancelled/);
    // Every surviving row is of the filtered type.
    await expect(rows.first()).toBeVisible();
    const types = await rows.evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-event-type')),
    );
    expect(new Set(types)).toEqual(new Set(['enrollment.cancelled']));

    await page.getByTestId('activity-clear').click();
    await expect(page).toHaveURL(/\/admin\/activity$/);
  });

  test('a future-only date range yields an empty feed', async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
    await page.goto('/admin/activity?from=2099-01-01');
    await expect(page.getByTestId('activity-feed')).toHaveCount(0);
    await expect(page.getByText('No activity matches these filters yet.')).toBeVisible();
  });
});
