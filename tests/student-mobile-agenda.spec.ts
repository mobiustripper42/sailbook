import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

// 6.30 — mobile agenda view on /student/courses.
// On mobile (<640px) the list view renders CoursesAgendaList instead of
// CoursesCardList: sessions grouped by day with compact rows.

test.describe('Student courses — mobile agenda view', () => {
  test('agenda renders on mobile instead of card grid', async ({ page }) => {
    test.skip(test.info().project.name !== 'mobile');
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard');
    await page.goto('/student/courses');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('courses-agenda')).toBeVisible();
    await expect(page.getByTestId('agenda-day-header').first()).toBeVisible();
    await expect(page.getByTestId('agenda-session-row').first()).toBeVisible();
  });

  test('session rows show time and link to course detail', async ({ page }) => {
    test.skip(test.info().project.name !== 'mobile');
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard');
    await page.goto('/student/courses');
    await page.waitForLoadState('networkidle');

    const firstRow = page.getByTestId('agenda-session-row').first();
    await expect(firstRow).toBeVisible();

    // Row contains a time range separator
    await expect(firstRow).toContainText('–');

    await firstRow.click();
    await expect(page).toHaveURL(/\/student\/courses\/.+/);
  });

  test('desktop: agenda absent, calendar toggle visible', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop');
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard');
    await page.goto('/student/courses');
    await page.waitForLoadState('networkidle');

    // Agenda must not appear on desktop
    await expect(page.getByTestId('courses-agenda')).toBeHidden();
    // Calendar/List toggle is visible (desktop-only control)
    await expect(page.getByTestId('courses-view-toggle')).toBeVisible();
  });
});
