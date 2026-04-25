import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

// 5.10 — student `/student/courses` calendar view.
// Calendar is the default on tablet+desktop; mobile is forced to list.
// User preference (calendar/list) persists in localStorage.

test.describe('Student courses — view switcher', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard');
  });

  test('mobile: list view forced, toggle hidden, calendar not rendered', async ({ page }) => {
    test.skip(test.info().project.name !== 'mobile');

    await page.goto('/student/courses');

    // Wait for hydration so the client component has decided isMobile.
    // The toggle is conditionally rendered after hydration AND only on non-mobile.
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('courses-view-toggle')).toBeHidden();
    await expect(page.getByTestId('courses-calendar')).toBeHidden();
    await expect(page.getByTestId('courses-view-content')).toHaveAttribute('data-active-view', 'list');

    // List view: at least one card from seed data
    await expect(page.getByText('ASA 101 — Weekend Intensive (May)')).toBeVisible();
  });

  test('desktop: calendar shown by default, toggle visible', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop');

    await page.goto('/student/courses');

    await expect(page.getByTestId('courses-view-toggle')).toBeVisible();
    await expect(page.getByTestId('courses-calendar')).toBeVisible();
    await expect(page.getByTestId('courses-view-content')).toHaveAttribute('data-active-view', 'calendar');
  });

  test('desktop: toggle to list view persists across reload', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop');

    await page.goto('/student/courses');
    await expect(page.getByTestId('courses-view-toggle')).toBeVisible();

    await page.getByTestId('view-toggle-list').click();
    await expect(page.getByTestId('courses-view-content')).toHaveAttribute('data-active-view', 'list');
    await expect(page.getByTestId('courses-calendar')).toBeHidden();

    await page.reload();
    await expect(page.getByTestId('courses-view-content')).toHaveAttribute('data-active-view', 'list');

    // Toggle back to calendar
    await page.getByTestId('view-toggle-calendar').click();
    await expect(page.getByTestId('courses-view-content')).toHaveAttribute('data-active-view', 'calendar');
    await expect(page.getByTestId('courses-calendar')).toBeVisible();
  });

  test('desktop: prev/next month navigation updates label', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop');

    await page.goto('/student/courses');
    await expect(page.getByTestId('courses-calendar')).toBeVisible();

    const label = page.getByTestId('calendar-month-label');
    const initial = await label.textContent();
    expect(initial).toBeTruthy();

    await page.getByTestId('calendar-next').click();
    await expect(label).not.toHaveText(initial!);

    await page.getByTestId('calendar-prev').click();
    await expect(label).toHaveText(initial!);

    // Today button works when away from current month
    await page.getByTestId('calendar-next').click();
    await page.getByTestId('calendar-next').click();
    await page.getByRole('button', { name: 'Today' }).click();
    await expect(label).toHaveText(initial!);
  });

  test('desktop: clicking a course pill navigates to course detail', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop');

    await page.goto('/student/courses');
    await expect(page.getByTestId('courses-calendar')).toBeVisible();

    // Navigate forward up to 24 months to find any course pill. Seed data has
    // courses in 2026-05 onward, so this should resolve in a couple of clicks
    // from "today" — the bound is for safety, not a real expectation.
    let pill = page.getByTestId('calendar-course-pill').first();
    let attempts = 0;
    while (!(await pill.isVisible()) && attempts < 24) {
      await page.getByTestId('calendar-next').click();
      attempts++;
      pill = page.getByTestId('calendar-course-pill').first();
    }

    await expect(pill).toBeVisible();
    const courseId = await pill.getAttribute('data-course-id');
    expect(courseId).toBeTruthy();

    await pill.click();
    await page.waitForURL(`**/student/courses/${courseId}`, { timeout: 10000 });
  });
});
