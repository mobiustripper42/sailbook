import { test, expect, type Page } from '@playwright/test';
import { loginAs, runId, selectTime } from './helpers';

// Task 10.4 (DEC-036): section_label as a first-class field + a recurrence
// generator (weekday+time+range → sessions) + a derived-schedule formatter.

async function loginAsAdmin(page: Page) {
  await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
}

test.describe('Admin — course schedule/section model (10.4)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('recurrence generator creates one session per weekday, and section + derived schedule render', async ({
    page,
  }) => {
    const id = runId();
    const sectionLabel = `Boat ${id}`;

    await page.goto('/admin/courses/new');
    await expect(page.getByRole('heading', { name: 'New Course' })).toBeVisible();

    await page.getByLabel('Course Type').click();
    await page.getByRole('option', { name: /ASA 101.*Basic Keelboat/ }).click();
    await page.getByLabel('Capacity').fill('6');
    await page.getByLabel(/Section Label/).fill(sectionLabel);

    // Open the recurrence generator and describe a Tuesday-evening series.
    await page.getByRole('button', { name: 'Generate recurring…' }).click();
    await page.getByLabel('Weekday').click();
    await page.getByRole('option', { name: 'Tuesday', exact: true }).click();
    await selectTime(page, 'gen_start_time', '18:00');
    await selectTime(page, 'gen_end_time', '20:00');
    await page.getByLabel('First date').fill('2027-09-07'); // Tuesday
    await page.getByLabel('Last date').fill('2027-09-28'); // Tuesday, 4 weeks inclusive
    await page.getByRole('button', { name: 'Generate sessions' }).click();

    // Four Tuesdays in the range → exactly four session blocks, no fifth.
    await expect(page.getByText('Session 4', { exact: true })).toBeVisible();
    await expect(page.getByText('Session 5', { exact: true })).toHaveCount(0);
    // The generated rows carry the range's first date.
    await expect(page.locator('input[type="date"]').first()).toHaveValue('2027-09-07');

    const createBtn = page.getByRole('button', { name: 'Create Course' });
    await createBtn.scrollIntoViewIfNeeded();
    await createBtn.click({ force: true });

    await expect(page).toHaveURL(/\/admin\/courses\/[0-9a-f-]+$/);

    // Detail header shows the section chip and the derived recurrence schedule.
    await expect(page.getByText(sectionLabel, { exact: true })).toBeVisible();
    await expect(page.getByText(/Tuesdays.*6.*8pm.*Sep 7.*28/)).toBeVisible();
  });

  test('section_label is searchable in the admin course list', async ({ page }) => {
    const id = runId();
    const sectionLabel = `Slip ${id}`;

    // Create a course with a distinctive section label via the generator.
    await page.goto('/admin/courses/new');
    await page.getByLabel('Course Type').click();
    await page.getByRole('option', { name: /ASA 101.*Basic Keelboat/ }).click();
    await page.getByLabel('Capacity').fill('4');
    await page.getByLabel(/Section Label/).fill(sectionLabel);
    await page.locator('input[type="date"]').first().fill('2027-10-05');
    await selectTime(page, 'session_start_0', '09:00');
    await selectTime(page, 'session_end_0', '17:00');
    const createBtn = page.getByRole('button', { name: 'Create Course' });
    await createBtn.scrollIntoViewIfNeeded();
    await createBtn.click({ force: true });
    await expect(page).toHaveURL(/\/admin\/courses\/[0-9a-f-]+$/);

    // Searching by the section label surfaces the course in the list.
    await page.goto('/admin/courses');
    await page.getByPlaceholder(/Search by title, section/).fill(sectionLabel);
    await expect(page.getByText(sectionLabel, { exact: true })).toBeVisible();
  });
});
