import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

// 6.20 — admin + instructor calendar views

test.describe('Admin calendar', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop');
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
  });

  test('Calendar nav link is visible and navigates to /admin/calendar', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Calendar' }).first()).toBeVisible();
    await page.getByRole('link', { name: 'Calendar' }).first().click();
    await expect(page).toHaveURL('/admin/calendar');
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible();
  });

  test('shows sessions calendar with month grid and view toggle', async ({ page }) => {
    await page.goto('/admin/calendar');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('sessions-view-toggle')).toBeVisible();
    await expect(page.getByTestId('sessions-calendar')).toBeVisible();
    await expect(page.getByTestId('calendar-month-label')).toBeVisible();
  });

  test('filter selects are present; switching to list view shows sessions-list', async ({ page }) => {
    await page.goto('/admin/calendar');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('filter-course-type')).toBeVisible();
    await expect(page.getByTestId('filter-instructor')).toBeVisible();

    await page.getByTestId('view-toggle-list').click();
    await expect(page.getByTestId('sessions-view-content')).toHaveAttribute('data-active-view', 'list');
    await expect(page.getByTestId('sessions-list')).toBeVisible();
  });
});

test.describe('Instructor calendar', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop');
    await loginAs(page, 'pw_instructor@ltsc.test', '/instructor/dashboard');
  });

  test('Calendar nav link is visible and navigates to /instructor/calendar', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Calendar' }).first()).toBeVisible();
    await page.getByRole('link', { name: 'Calendar' }).first().click();
    await expect(page).toHaveURL('/instructor/calendar');
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible();
  });

  test('shows sessions calendar with month grid and view toggle', async ({ page }) => {
    await page.goto('/instructor/calendar');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('sessions-view-toggle')).toBeVisible();
    await expect(page.getByTestId('sessions-calendar')).toBeVisible();
    await expect(page.getByTestId('calendar-month-label')).toBeVisible();
  });

  test('switching to list view shows sessions-list', async ({ page }) => {
    await page.goto('/instructor/calendar');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('view-toggle-list').click();
    await expect(page.getByTestId('sessions-view-content')).toHaveAttribute('data-active-view', 'list');
    await expect(page.getByTestId('sessions-list')).toBeVisible();
  });
});
