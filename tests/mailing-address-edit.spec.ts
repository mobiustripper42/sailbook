import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

// #150 — students and admins can view/edit a mailing address.
// These mutate profile rows, so run on desktop only to avoid cross-project races.

const SAM_ID = 'a1000000-0000-0000-0000-000000000005';

test.describe('Mailing address — student self-service', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'profile mutation — desktop only');
  });

  test('student can view and edit their mailing address on the account page', async ({ page }) => {
    await loginAs(page, 'pw_student2@ltsc.test', '/student/dashboard');
    await page.goto('/student/account');

    await expect(page.getByRole('heading', { name: 'Mailing address' })).toBeVisible();

    const street = `${Date.now().toString().slice(-5)} Lakeshore Blvd`;
    await page.getByLabel('Street address').fill(street);
    await page.getByLabel('City').fill('Cleveland');
    await page.getByLabel('State').fill('oh'); // lower-case → should coerce to OH
    await page.getByLabel('ZIP').fill('44113');
    await page.getByRole('button', { name: 'Save address' }).click();

    await expect(page.getByText('Address updated.')).toBeVisible();

    // Persists across reload, state normalized to 2-letter uppercase.
    await page.reload();
    await expect(page.getByLabel('Street address')).toHaveValue(street);
    await expect(page.getByLabel('City')).toHaveValue('Cleveland');
    await expect(page.getByLabel('State')).toHaveValue('OH');
    await expect(page.getByLabel('ZIP')).toHaveValue('44113');
  });

  test('incomplete address is rejected', async ({ page }) => {
    await loginAs(page, 'pw_student2@ltsc.test', '/student/dashboard');
    await page.goto('/student/account');

    // Street only — missing city/state/zip.
    await page.getByLabel('Street address').fill('1 Nowhere St');
    await page.getByLabel('City').fill('');
    await page.getByLabel('State').fill('');
    await page.getByLabel('ZIP').fill('');
    await page.getByRole('button', { name: 'Save address' }).click();

    await expect(page.getByText(/Street address, city, state, and ZIP are required/)).toBeVisible();
  });
});

test.describe('Mailing address — admin edit', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'profile mutation — desktop only');
  });

  test('admin can edit a student mailing address', async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
    await page.goto(`/admin/students/${SAM_ID}/edit`);

    const street = `${Date.now().toString().slice(-5)} Detroit Ave`;
    await page.getByLabel('Street address').fill(street);
    await page.getByLabel('City').fill('Lakewood');
    await page.getByLabel('State').fill('OH');
    await page.getByLabel('ZIP').fill('44107');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await page.waitForURL('/admin/users');

    // The read-only student view reflects the saved address.
    await page.goto(`/admin/students/${SAM_ID}`);
    await expect(page.getByText(street)).toBeVisible();
    await expect(page.getByText('Lakewood, OH 44107')).toBeVisible();
  });
});
