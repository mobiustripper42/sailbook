import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

// Phase 10.7 — student flows. Covers the two structural changes: My Courses
// absorbing Attendance + Experience, and the Account page collapsing to a
// single save. Plus #137's admin-side enroll-from-the-student-page.

const SAM_ID = 'a1000000-0000-0000-0000-000000000005';

test.describe('My Courses — schedule and attendance together', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'jordan@ltsc.test', '/student/dashboard');
  });

  test('a course card lists its sessions with attendance status', async ({ page }) => {
    await page.goto('/student/my-courses');
    await page.getByRole('button', { name: 'all' }).click();

    const card = page.locator('[data-slot="card"]').filter({ hasText: 'ASA 101 - Weekend (April)' });
    await expect(card).toBeVisible();
    // Jordan attended Day 1 and missed Day 2 — both statuses on one card, which
    // previously required visiting /student/attendance separately.
    await expect(card.getByText('Attended')).toBeVisible();
    await expect(card.getByText('Missed')).toBeVisible();
  });

  test('the upcoming filter is the default view', async ({ page }) => {
    await page.goto('/student/my-courses');
    // The finished April course is hidden until the filter changes.
    await expect(
      page.locator('[data-slot="card"]').filter({ hasText: 'ASA 101 - Weekend (April)' }),
    ).toHaveCount(0);
  });
});

test.describe('Account — one save for the whole page', () => {
  // These mutate pw_student3's profile row, so they must not run against each
  // other in parallel workers.
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'profile mutation — desktop only');
  });

  test('the page has exactly one submit button', async ({ page }) => {
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard');
    await page.goto('/student/account');

    // The AC for 10.7: profile, address, and notifications are sections of one
    // form, not three forms with three Save buttons. Scoped to main — the app
    // shell's sign-out forms carry submit buttons of their own.
    await expect(page.getByRole('main').locator('form button[type="submit"]')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save address' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Save preferences' })).toHaveCount(0);
  });

  test('one submit persists profile, address, and notification preferences together', async ({ page }) => {
    await loginAs(page, 'pw_student3@ltsc.test', '/student/dashboard');
    await page.goto('/student/account');

    const stamp = Date.now().toString().slice(-5);
    const street = `${stamp} Edgewater Dr`;
    const notes = `Single-save check ${stamp}`;

    await page.getByLabel('Street address').fill(street);
    await page.getByLabel('City').fill('Cleveland');
    await page.getByLabel('State').fill('OH');
    await page.getByLabel('ZIP').fill('44102');
    await page.getByLabel(/Note for your instructor/).fill(notes);
    const emailPref = page.getByLabel('Receive email notifications');
    const emailWasChecked = await emailPref.isChecked();
    await emailPref.setChecked(!emailWasChecked);

    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Account updated.')).toBeVisible();

    // All three sections survive a reload from a single submit.
    await page.reload();
    await expect(page.getByLabel('Street address')).toHaveValue(street);
    await expect(page.getByLabel(/Note for your instructor/)).toHaveValue(notes);
    await expect(page.getByLabel('Receive email notifications')).toBeChecked({
      checked: !emailWasChecked,
    });
  });

  test('saving does not wipe a dual-role profile\'s admin preferences', async ({ page, request }) => {
    // The reason updateStudentAccount merges instead of overwriting: on a
    // profile that is both admin and student, the student save must leave the
    // admin block alone.
    const setRole = (value: boolean) =>
      request.post('http://localhost:3300/api/test/set-role-flag', {
        data: { email: 'pw_student3@ltsc.test', flag: 'is_admin', value },
      });

    await setRole(true);
    await request.post('http://localhost:3300/api/test/set-notification-prefs', {
      data: {
        email: 'pw_student3@ltsc.test',
        prefs: {
          admin_enrollment_alert: { sms: false, email: false },
          student_global: { sms: true, email: true },
        },
      },
    });

    try {
      await loginAs(page, 'pw_student3@ltsc.test', '/admin/dashboard');
      await page.goto('/student/account');
      await page.getByRole('button', { name: 'Save changes' }).click();
      await expect(page.getByText('Account updated.')).toBeVisible();

      // The admin block survived the student-side save.
      await page.goto('/admin/notification-preferences');
      await expect(page.locator('input[name="admin_enrollment_alert__email"]')).not.toBeChecked();
    } finally {
      await setRole(false);
    }
  });

  test('an invalid phone blocks the whole save', async ({ page }) => {
    await loginAs(page, 'pw_student3@ltsc.test', '/student/dashboard');
    await page.goto('/student/account');

    await page.getByLabel('Phone').fill('5551212');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByText('Enter a valid 10-digit US phone number.')).toBeVisible();
    await expect(page.getByText('Account updated.')).toHaveCount(0);
  });

  // Same useUnsavedChanges guard the admin course/course-type forms carry.
  test('leaving with unsaved edits prompts; leaving after a save does not', async ({ page }) => {
    await loginAs(page, 'pw_student3@ltsc.test', '/student/dashboard');
    await page.goto('/student/account');

    let prompts = 0;
    // Dismiss = Cancel, so the guard blocks the navigation and we stay put.
    page.on('dialog', async (d) => {
      prompts++;
      await d.dismiss();
    });

    await page.getByLabel(/Note for your instructor/).fill('Guard check');
    await page.getByRole('link', { name: 'My Courses' }).click();
    await expect.poll(() => prompts).toBe(1);
    await expect(page).toHaveURL(/\/student\/account/);

    // Saving clears the dirty flag — Account doesn't redirect away, so a stale
    // flag here would nag about changes already written.
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Account updated.')).toBeVisible();

    await page.getByRole('link', { name: 'My Courses' }).click();
    await expect(page).toHaveURL(/\/student\/my-courses/);
    expect(prompts).toBe(1);
  });
});

test.describe('Admin — enroll a student from their own page (#137)', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'enrollment mutation — desktop only');
  });

  test('the student page offers an enroll-in-course panel', async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
    await page.goto(`/admin/students/${SAM_ID}`);

    await page.getByRole('button', { name: 'Enroll in Course' }).click();
    // Same action as the course-side panel, driven from the other direction:
    // a course picker, a payment method, and an amount.
    await expect(page.getByText('Enroll in Course', { exact: true }).last()).toBeVisible();
    await expect(page.getByRole('combobox')).toHaveCount(2);
    await expect(page.getByLabel('Amount ($)')).toBeVisible();
  });

  test('courses the student already holds are not offered', async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
    await page.goto(`/admin/students/${SAM_ID}`);

    await page.getByRole('button', { name: 'Enroll in Course' }).click();
    await page.getByRole('combobox').first().click();
    // Sam already has a non-cancelled enrollment in the May intensive — the
    // picker must not offer a duplicate the action would only reject.
    await expect(
      page.getByRole('option', { name: 'ASA 101 - Weekend Intensive (May)' }),
    ).toHaveCount(0);
  });
});
