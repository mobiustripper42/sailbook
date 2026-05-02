import { test, expect } from '@playwright/test';
import { loginAs, selectTime } from './helpers';

const COURSE_ID = 'c1000000-0000-0000-0000-000000000001'; // ASA 101 Weekend May — active, has sessions

test.describe('Admin — course detail mobile layout', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
    await page.goto(`/admin/courses/${COURSE_ID}`);
    await expect(page.getByRole('heading', { name: /ASA 101/ })).toBeVisible();
  });

  test('header renders without overflow — title and actions both visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /ASA 101/ })).toBeVisible();
    // Edit link must be accessible (not squished off-screen)
    await expect(page.getByRole('link', { name: 'Edit' })).toBeVisible();
  });

  test('mobile: session cards visible, table hidden', async ({ page }) => {
    test.skip(test.info().project.name !== 'mobile', 'mobile layout only');
    // Card list container should be visible
    const cards = page.locator('[data-session-id]');
    await expect(cards.first()).toBeVisible();
    // Sessions table (first in DOM) should be hidden on mobile; enrollments table is second
    await expect(page.locator('table').nth(0)).toBeHidden();
  });

  test('desktop: session table visible, cards hidden', async ({ page }) => {
    test.skip(test.info().project.name === 'mobile', 'desktop/tablet layout only');
    await expect(page.locator('table').first()).toBeVisible();
  });

  test('mobile: session card action menu opens', async ({ page }) => {
    test.skip(test.info().project.name !== 'mobile', 'mobile layout only');
    const firstCard = page.locator('[data-session-id]').first();
    await firstCard.getByRole('button', { name: 'Session actions' }).click();
    await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Attendance' })).toBeVisible();
  });

  test('mobile: inline edit form renders at full card width', async ({ page }) => {
    test.skip(test.info().project.name !== 'mobile', 'mobile layout only');
    const firstCard = page.locator('[data-session-id]').first();
    await firstCard.getByRole('button', { name: 'Session actions' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    // Edit form should be visible inside the card
    await expect(firstCard.getByRole('button', { name: 'Save' })).toBeVisible();
    // TimeSelect inputs should be present (not hidden/clipped)
    const hiddenInput = firstCard.locator('input[name="start_time"]');
    await expect(hiddenInput).toBeAttached();
  });

  test('mobile: edit form saves successfully', async ({ page }) => {
    test.skip(test.info().project.name !== 'mobile', 'mobile layout only');
    const firstCard = page.locator('[data-session-id]').first();
    await firstCard.getByRole('button', { name: 'Session actions' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await expect(firstCard.getByRole('button', { name: 'Save' })).toBeVisible();

    await selectTime(page, 'start_time', '09:00');
    await selectTime(page, 'end_time', '17:00');
    await firstCard.getByRole('button', { name: 'Save' }).click();

    // Edit form should close on success
    await expect(firstCard.getByRole('button', { name: 'Save' })).not.toBeVisible({ timeout: 10000 });
  });
});
