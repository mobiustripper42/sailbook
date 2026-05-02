import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

// Seed UUIDs
const SAM_ID = 'a1000000-0000-0000-0000-000000000005';
const SESSION_WEEKEND_MAY_1 = 'd1000000-0000-0000-0000-000000000001';

// ─── Student — Experience page ───────────────────────────────────────────────

test.describe('Student — Experience page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'sam@ltsc.test', '/student/dashboard');
  });

  test('Experience link appears in sidebar nav', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Experience' })).toBeVisible();
  });

  test('Experience page loads with course history', async ({ page }) => {
    await page.goto('/student/history');
    await expect(page.getByRole('heading', { name: 'Experience' })).toBeVisible();
    // Sam has 3 seed enrollments — expect at least one course card
    await expect(page.getByText('ASA 101 - Weekend Intensive (May)')).toBeVisible();
    await expect(page.getByText('ASA 101 - Weekend (April)')).toBeVisible();
  });

  test('Experience page shows enrollment status badges', async ({ page }) => {
    await page.goto('/student/history');
    // Sam completed April course
    await expect(page.getByText('Completed')).toBeVisible();
  });
});

test.describe('Student — Experience page (mobile)', () => {
  test('Experience link appears in mobile drawer', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 768) >= 768, 'mobile-only test');
    await loginAs(page, 'sam@ltsc.test', '/student/dashboard');
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await expect(page.getByRole('link', { name: 'Experience' })).toBeVisible();
  });
});

// ─── Admin — Student view page ────────────────────────────────────────────────

test.describe('Admin — Student view', () => {
  test.beforeEach(async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 768, 'desktop-only test');
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
  });

  test('users list exposes Experience action for student rows', async ({ page }) => {
    await page.goto('/admin/users');
    // Open the first user-actions menu and verify Experience is offered (only student rows expose it)
    const samRow = page.getByRole('row').filter({ hasText: 'Sam' }).first();
    await samRow.getByRole('button', { name: 'User actions' }).click();
    await expect(page.getByRole('menuitem', { name: 'Experience' })).toBeVisible();
  });

  test('View link navigates to admin student view page', async ({ page }) => {
    await page.goto(`/admin/students/${SAM_ID}`);
    await expect(page.getByRole('heading', { name: 'Sam' })).toBeVisible();
    await expect(page.getByText('sam@ltsc.test')).toBeVisible();
  });

  test('admin student view shows course history', async ({ page }) => {
    await page.goto(`/admin/students/${SAM_ID}`);
    await expect(page.getByText('Course History')).toBeVisible();
    await expect(page.getByText('ASA 101 - Weekend Intensive (May)')).toBeVisible();
    await expect(page.getByText('ASA 101 - Weekend (April)')).toBeVisible();
  });

  test('admin student view has Edit link', async ({ page }) => {
    await page.goto(`/admin/students/${SAM_ID}`);
    const editLink = page.getByRole('link', { name: 'Edit' });
    await expect(editLink).toBeVisible();
    await expect(editLink).toHaveAttribute('href', `/admin/students/${SAM_ID}/edit`);
  });

  test('admin student view breadcrumb links back to Users', async ({ page }) => {
    await page.goto(`/admin/students/${SAM_ID}`);
    await page.getByRole('main').getByRole('link', { name: 'Users' }).click();
    await page.waitForURL('/admin/users');
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
  });
});

// ─── Instructor — student history link from roster ────────────────────────────

test.describe('Instructor — student link from roster', () => {
  test.beforeEach(async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 768, 'desktop-only test');
  });

  test('student name in roster links to instructor student view', async ({ page }) => {
    await loginAs(page, 'mike@ltsc.test', '/instructor/dashboard');
    await page.goto(`/instructor/sessions/${SESSION_WEEKEND_MAY_1}`);
    // Sam is enrolled — name should be a link
    const samLink = page.getByRole('link', { name: /Davies, Sam/i });
    await expect(samLink).toBeVisible();
    await expect(samLink).toHaveAttribute('href', `/instructor/students/${SAM_ID}`);
  });

  test('instructor student view shows student profile and course history', async ({ page }) => {
    await loginAs(page, 'mike@ltsc.test', '/instructor/dashboard');
    await page.goto(`/instructor/students/${SAM_ID}`);
    await expect(page.getByRole('heading', { name: 'Sam Davies' })).toBeVisible();
    await expect(page.getByText('Course History')).toBeVisible();
    // Sam has enrollments across multiple courses — all visible to instructor
    await expect(page.getByText('ASA 101 - Weekend Intensive (May)')).toBeVisible();
    await expect(page.getByText('ASA 101 - Weekend (April)')).toBeVisible();
  });

  test('instructor student view back link returns to dashboard', async ({ page }) => {
    await loginAs(page, 'mike@ltsc.test', '/instructor/dashboard');
    await page.goto(`/instructor/students/${SAM_ID}`);
    await page.getByRole('link', { name: '← Back to dashboard' }).click();
    await page.waitForURL('/instructor/dashboard');
  });
});
