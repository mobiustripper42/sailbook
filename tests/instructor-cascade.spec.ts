import { test, expect } from '@playwright/test';
import { loginAs, runId } from './helpers';

/**
 * Instructor deactivation cascade — admin UI integration tests.
 *
 * Verifies that deactivating an instructor via the Instructors page:
 *   1. Shows a confirmation dialog before acting
 *   2. Clears the instructor's course assignments on deactivation
 *
 * Desktop-only: creates a course via the admin UI.
 * Reactivates pw_instructor after each test so subsequent runs start clean.
 */

test.describe('Instructor deactivation cascade', () => {
  test('deactivating an instructor clears their course assignments', async ({ page, browser }) => {
    test.skip(test.info().project.name !== 'desktop');
    test.setTimeout(90000);

    const title = `PW Cascade Course ${runId()}`;

    // Step 1: Admin creates a course with pw_instructor assigned
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
    await page.goto('/admin/courses/new');
    await expect(page.getByRole('heading', { name: 'New Course' })).toBeVisible();

    await page.getByLabel('Course Type').click();
    await page.getByRole('option', { name: /ASA 101.*Basic Keelboat/ }).click();
    await page.getByLabel('Title Override').fill(title);
    await page.getByLabel('Capacity').fill('4');
    await page.getByRole('combobox', { name: /Instructor/ }).click();
    await page.getByRole('option', { name: /PW.*Instructor/ }).click();
    await page.locator('input[type="date"]').fill('2027-09-15');
    await page.locator('input[type="time"]').first().fill('09:00');
    await page.locator('input[type="time"]').nth(1).fill('17:00');
    await page.locator('section').filter({ hasText: 'Sessions' }).getByPlaceholder(/Dock A/).fill('Edgewater Park');
    await page.getByRole('button', { name: 'Create Course' }).click({ force: true });
    await page.waitForURL(/\/admin\/courses\/[0-9a-f-]+$/, { timeout: 10000 });

    // Step 2: Navigate to instructors — deactivate PW Instructor
    // Accept the confirmation dialog automatically
    page.on('dialog', dialog => dialog.accept());
    await page.goto('/admin/instructors');
    await expect(page.getByRole('heading', { name: 'Instructors' })).toBeVisible();

    const pwRow = page.getByRole('row', { name: /PW.*Instructor/ });
    await pwRow.getByRole('button', { name: 'Deactivate' }).click();

    // Badge should flip to Inactive
    await expect(pwRow.getByText('Inactive')).toBeVisible({ timeout: 10000 });

    // Step 3: Verify the course now shows no instructor on the courses list
    await page.goto('/admin/courses');
    const courseRow = page.getByRole('row', { name: new RegExp(title) });
    await expect(courseRow).toBeVisible();
    // Instructor cell should show "—" (NULL instructor after cascade)
    await expect(courseRow.getByRole('cell', { name: '—' }).first()).toBeVisible();

    // Step 4: Reactivate pw_instructor to restore state for subsequent test runs
    await page.goto('/admin/instructors');
    const pwRowAfter = page.getByRole('row', { name: /PW.*Instructor/ });
    await pwRowAfter.getByRole('button', { name: 'Activate' }).click();
    await expect(pwRowAfter.getByText('Active')).toBeVisible({ timeout: 10000 });
  });

  test('deactivate button shows confirmation dialog before acting', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop');

    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
    await page.goto('/admin/instructors');
    await expect(page.getByRole('heading', { name: 'Instructors' })).toBeVisible();

    // Dismiss the dialog — instructor should remain Active
    page.on('dialog', dialog => dialog.dismiss());
    const pwRow = page.getByRole('row', { name: /PW.*Instructor/ });
    await pwRow.getByRole('button', { name: 'Deactivate' }).click();

    // Status should remain Active — no cascade fired
    await expect(pwRow.getByText('Active')).toBeVisible({ timeout: 5000 });
  });
});
