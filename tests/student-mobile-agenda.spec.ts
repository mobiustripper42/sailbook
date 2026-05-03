import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

// 6.30 — agenda list view on /student/courses (all viewports).
// Toggle visible everywhere. List view renders CoursesAgendaList:
// sessions grouped by date with sticky day headers, compact rows.

test.describe('Student courses — agenda list view', () => {
  test('mobile: toggle to list shows agenda with day headers', async ({ page }) => {
    test.skip(test.info().project.name !== 'mobile');
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard');
    await page.goto('/student/courses');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('view-toggle-list').click();

    await expect(page.getByTestId('courses-agenda')).toBeVisible();
    await expect(page.getByTestId('agenda-day-header').first()).toBeVisible();
    await expect(page.getByTestId('agenda-session-row').first()).toBeVisible();
  });

  test('mobile: session row shows time range and links to course detail', async ({ page }) => {
    test.skip(test.info().project.name !== 'mobile');
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard');
    await page.goto('/student/courses');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('view-toggle-list').click();

    const firstRow = page.getByTestId('agenda-session-row').first();
    await expect(firstRow).toContainText('–');
    await firstRow.click();
    await expect(page).toHaveURL(/\/student\/courses\/.+/);
  });

  test('desktop: list view also shows agenda (no card grid)', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop');
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard');
    await page.goto('/student/courses');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('view-toggle-list').click();

    await expect(page.getByTestId('courses-agenda')).toBeVisible();
    await expect(page.getByTestId('agenda-day-header').first()).toBeVisible();
  });
});
