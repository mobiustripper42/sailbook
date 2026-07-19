import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

// #153 — admin records the book-mailed date per ASA enrollment.
// Mutates an enrollment row, so desktop-only. Resets itself at the end.

const ASA_COURSE = 'c1000000-0000-0000-0000-000000000001'; // ASA 101 Weekend May (Sam + Alex)
const NON_ASA_COURSE = 'c1000000-0000-0000-0000-000000000006'; // Open Sailing (non-ASA, Chris enrolled)

test.describe('Admin — book mailed (ASA)', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'enrollment mutation — desktop only');
  });

  test('admin can mark a book mailed and it persists', async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
    await page.goto(`/admin/courses/${ASA_COURSE}`);

    // ASA course → the roster exposes the Book mailed column.
    await expect(page.getByRole('columnheader', { name: 'Book mailed' })).toBeVisible();

    const samRow = page.getByRole('row').filter({ hasText: 'Davies' }).first();

    // Reset to a known "not mailed" state first (idempotent re-runs).
    if (await samRow.getByRole('button', { name: 'clear' }).count()) {
      await samRow.getByRole('button', { name: 'clear' }).click();
      await expect(samRow.getByRole('button', { name: 'Mark mailed' })).toBeVisible();
    }

    await samRow.getByRole('button', { name: 'Mark mailed' }).click();

    // Now shows a mailed date + edit/clear affordances; the button is gone.
    await expect(samRow.getByText(/Mailed \w{3} \d+/)).toBeVisible();
    await expect(samRow.getByRole('button', { name: 'Mark mailed' })).toHaveCount(0);

    // Persists across reload.
    await page.reload();
    const samRowAfter = page.getByRole('row').filter({ hasText: 'Davies' }).first();
    await expect(samRowAfter.getByText(/Mailed \w{3} \d+/)).toBeVisible();

    // Cleanup — clear so the seed row returns to not-mailed.
    await samRowAfter.getByRole('button', { name: 'clear' }).click();
    await expect(samRowAfter.getByRole('button', { name: 'Mark mailed' })).toBeVisible();
  });

  test('non-ASA course roster has no Book mailed column', async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
    await page.goto(`/admin/courses/${NON_ASA_COURSE}`);

    // Roster is present (Chris is enrolled) but there's no Book mailed column.
    await expect(page.getByRole('columnheader', { name: 'Student' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Book mailed' })).toHaveCount(0);
  });
});
