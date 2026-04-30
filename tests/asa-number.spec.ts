import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

// Seed UUIDs
const SAM_ID = 'a1000000-0000-0000-0000-000000000005';
// Sam's seed ASA number — see supabase/seed.sql
const SAM_ASA = '101234';

test.describe('ASA number — admin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'andy@ltsc.test', '/admin/dashboard');
  });

  test('admin can edit ASA number on student edit form', async ({ page }) => {
    await page.goto(`/admin/students/${SAM_ID}/edit`);
    const input = page.getByLabel('ASA Number');
    await expect(input).toBeVisible();
    await expect(input).toHaveValue(SAM_ASA);
  });

  test('ASA number appears on student detail view', async ({ page }) => {
    await page.goto(`/admin/students/${SAM_ID}`);
    await expect(page.getByText(`ASA #: ${SAM_ASA}`)).toBeVisible();
  });
});

test.describe('ASA number — student view', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'sam@ltsc.test', '/student/dashboard');
  });

  test('Experience page shows ASA number', async ({ page }) => {
    await page.goto('/student/history');
    await expect(page.getByText(`ASA #: ${SAM_ASA}`)).toBeVisible();
  });
});
