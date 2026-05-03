import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

// 6.30 — mobile agenda view on /student/courses.
// On mobile (<640px) the list view renders CoursesAgendaList instead of
// CoursesCardList: sessions grouped by day with compact rows.

test.describe('Student courses — mobile agenda view', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(test.info().project.name !== 'mobile');
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard');
  });

  test('agenda renders on mobile instead of card grid', async ({ page }) => {
    await page.goto('/student/courses');
    await page.waitForLoadState('networkidle');

    // Agenda container is present
    await expect(page.getByTestId('courses-agenda')).toBeVisible();

    // At least one day header
    await expect(page.getByTestId('agenda-day-header').first()).toBeVisible();

    // At least one session row
    await expect(page.getByTestId('agenda-session-row').first()).toBeVisible();
  });

  test('session rows show time and link to course detail', async ({ page }) => {
    await page.goto('/student/courses');
    await page.waitForLoadState('networkidle');

    const firstRow = page.getByTestId('agenda-session-row').first();
    await expect(firstRow).toBeVisible();

    // Row contains a time range (e.g. "9:00 AM – 5:00 PM")
    await expect(firstRow).toContainText('–');

    // Clicking navigates to course detail
    await firstRow.click();
    await expect(page).toHaveURL(/\/student\/courses\/.+/);
  });

  test('desktop: card grid still renders, no agenda', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop');
    await page.goto('/student/courses');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('courses-agenda')).toBeHidden();
    await expect(page.getByTestId('course-card').first()).toBeVisible();
  });
});
