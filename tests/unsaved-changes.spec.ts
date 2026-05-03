import { test, expect, type Browser } from '@playwright/test';
import { loginAs, runId, createTestCourse } from './helpers';

// ─── Setup ───────────────────────────────────────────────────────────────────

// One course shared across all tests in this suite.
// Created once per worker — each viewport project gets its own worker,
// so multiple courses may exist after a full run. That's fine for local dev.
let courseId: string;

test.beforeAll(async ({ browser }: { browser: Browser }) => {
  const page = await browser.newPage();
  courseId = await createTestCourse(page, {
    capacity: 2,
    title: `UnsavedTest ${runId()}`,
  });
  await page.close();
});

// ─── Course edit — full-page form ─────────────────────────────────────────────

test.describe('Unsaved changes guard — course edit form', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
  });

  test('cancel with no changes navigates away without dialog', async ({ page }) => {
    await page.goto(`/admin/courses/${courseId}/edit`);
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();

    // No dialog should appear — if one did, this test would hang/fail
    let dialogTriggered = false;
    page.on('dialog', () => { dialogTriggered = true; });

    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.waitForURL(`/admin/courses/${courseId}`, { timeout: 5000 });

    expect(dialogTriggered).toBe(false);
  });

  test('cancel after changes shows confirm dialog; dismiss keeps user on edit page', async ({ page }) => {
    await page.goto(`/admin/courses/${courseId}/edit`);
    await page.getByLabel('Title Override').fill('Changed Title');

    // Dismiss the dialog → should stay on edit page
    page.once('dialog', dialog => dialog.dismiss());
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page).toHaveURL(new RegExp(`/admin/courses/${courseId}/edit`));
  });

  test('cancel after changes shows confirm dialog; accept navigates away', async ({ page }) => {
    await page.goto(`/admin/courses/${courseId}/edit`);
    await page.getByLabel('Title Override').fill('Changed Title');

    // Accept the dialog → should navigate to course detail
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Cancel' }).click();

    await page.waitForURL(`/admin/courses/${courseId}`, { timeout: 5000 });
    await expect(page).toHaveURL(`/admin/courses/${courseId}`);
  });
});

// ─── Session inline edit ──────────────────────────────────────────────────────

test.describe('Unsaved changes guard — session inline edit', () => {
  // The inline edit form lives inside an overflow-x-auto table container.
  // Playwright's scroll-into-view moves the thead to the same viewport Y as the
  // Cancel button on narrow screens, causing a false intercept. Desktop-only UI.
  test.skip(({ viewport }) => (viewport?.width ?? 1440) < 640, 'Inline edit is table-based — desktop/tablet only')

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
  });

  test('cancel inline edit with no changes closes without dialog', async ({ page }) => {
    await page.goto(`/admin/courses/${courseId}`);

    // Open inline edit
    await page.getByRole('button', { name: 'Session actions' }).first().click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();

    let dialogTriggered = false;
    page.on('dialog', () => { dialogTriggered = true; });

    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible();

    expect(dialogTriggered).toBe(false);
  });

  test('cancel inline edit after changes shows confirm dialog; dismiss keeps form open', async ({ page }) => {
    await page.goto(`/admin/courses/${courseId}`);

    await page.getByRole('button', { name: 'Session actions' }).first().click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();

    // The Location label has no htmlFor, so use name selector
    await page.locator('input[name="location"]').fill('Test Location');

    page.once('dialog', dialog => dialog.dismiss());
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();

    // Form should still be visible
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
  });

  test('cancel inline edit after changes shows confirm dialog; accept closes form', async ({ page }) => {
    await page.goto(`/admin/courses/${courseId}`);

    await page.getByRole('button', { name: 'Session actions' }).first().click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();

    await page.locator('input[name="location"]').fill('Test Location');

    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();

    await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible();
  });
});

// ─── Sidebar nav link interception ───────────────────────────────────────────
// The admin sidebar is only visible at md+ (desktop). Skip on mobile/tablet.

test.describe('Unsaved changes guard — sidebar nav link', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
  });

  test('nav link with unsaved changes shows confirm; dismiss stays on edit page', async ({ page, viewport }) => {
    if (viewport && viewport.width < 1024) test.skip();

    await page.goto(`/admin/courses/${courseId}/edit`);
    await page.getByLabel('Title Override').fill('Changed Title');

    // Click sidebar "Users" link — should trigger the capture-phase guard
    page.once('dialog', dialog => dialog.dismiss());
    await page.getByRole('link', { name: 'Users' }).click();

    // Should still be on the edit page
    await expect(page).toHaveURL(new RegExp(`/admin/courses/${courseId}/edit`));
  });

  test('nav link with unsaved changes shows confirm; accept navigates away', async ({ page, viewport }) => {
    if (viewport && viewport.width < 1024) test.skip();

    await page.goto(`/admin/courses/${courseId}/edit`);
    await page.getByLabel('Title Override').fill('Changed Title');

    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('link', { name: 'Users' }).click();

    await page.waitForURL('/admin/users', { timeout: 5000 });
    await expect(page).toHaveURL('/admin/users');
  });
});

// ─── Browser back button interception ────────────────────────────────────────

test.describe('Unsaved changes guard — browser back button', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
  });

  test('back button with unsaved changes shows confirm; dismiss stays on edit page', async ({ page }) => {
    await page.goto(`/admin/courses/${courseId}/edit`);
    await page.getByLabel('Title Override').fill('Changed Title');

    // Wait for the guard history entry to be pushed (triggered by isDirty becoming true)
    await page.waitForFunction(() => window.history.length >= 2);

    const dialogPromise = page.waitForEvent('dialog');
    await page.evaluate(() => window.history.back());
    const dialog = await dialogPromise;
    await dialog.dismiss();

    await expect(page).toHaveURL(new RegExp(`/admin/courses/${courseId}/edit`));
  });

  test('back button with unsaved changes shows confirm; accept navigates away', async ({ page }) => {
    // Navigate via a real link so there's a valid previous page to go back to
    await page.goto('/admin/courses');
    await page.goto(`/admin/courses/${courseId}/edit`);
    await page.getByLabel('Title Override').fill('Changed Title');

    await page.waitForFunction(() => window.history.length >= 2);

    const dialogPromise = page.waitForEvent('dialog');
    await page.evaluate(() => window.history.back());
    const dialog = await dialogPromise;
    await dialog.accept();

    // After accept, history.go(-1) navigates back past the guard entry
    await page.waitForURL(/\/admin\/courses/, { timeout: 5000 });
    await expect(page).not.toHaveURL(new RegExp(`/admin/courses/${courseId}/edit`));
  });
});

// ─── User edit — full-page form ───────────────────────────────────────────────

test.describe('Unsaved changes guard — user edit form', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
  });

  // Target an instructor row — student rows route to /admin/students/[id]/edit
  // (ProfileEditForm), not the UserEditForm under test here.
  test('cancel after changes shows confirm dialog; dismiss keeps user on edit page', async ({ page }) => {
    await page.goto('/admin/users');
    const row = page.getByRole('row').filter({ hasText: 'PW Instructor' }).first();
    await row.getByRole('button', { name: 'User actions' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.waitForURL(/\/admin\/users\/[0-9a-f-]+\/edit/, { timeout: 5000 });

    await page.getByLabel('First Name').fill('Changed');

    page.once('dialog', dialog => dialog.dismiss());
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page).toHaveURL(/\/edit$/);
  });

  test('cancel after changes shows confirm dialog; accept navigates away', async ({ page }) => {
    await page.goto('/admin/users');
    const row = page.getByRole('row').filter({ hasText: 'PW Instructor' }).first();
    await row.getByRole('button', { name: 'User actions' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.waitForURL(/\/admin\/users\/[0-9a-f-]+\/edit/, { timeout: 5000 });

    await page.getByLabel('First Name').fill('Changed');

    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Cancel' }).click();

    await page.waitForURL('/admin/users', { timeout: 5000 });
    await expect(page).toHaveURL('/admin/users');
  });
});
