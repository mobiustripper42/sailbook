import { test, expect } from '@playwright/test';
import { loginAs, createTestCourse, runId } from './helpers';

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

    // Filters render in both mobile and desktop containers — scope to desktop to avoid strict mode
    const desktopFilters = page.getByTestId('calendar-filters-desktop');
    await expect(desktopFilters.getByTestId('filter-course-type')).toBeVisible();
    await expect(desktopFilters.getByTestId('filter-instructor')).toBeVisible();
    await expect(desktopFilters.getByTestId('filter-student')).toBeVisible();

    await page.getByTestId('view-toggle-list').click();
    await expect(page.getByTestId('sessions-view-content')).toHaveAttribute('data-active-view', 'list');
    await expect(page.getByTestId('sessions-list')).toBeVisible();
  });
});

test.describe('Admin calendar — student filter', () => {
  // createTestCourse manages its own admin login, so no loginAs beforeEach here.
  test.beforeEach(() => {
    test.skip(test.info().project.name !== 'desktop');
  });

  test('student filter narrows the calendar to that student’s sessions', async ({ browser }) => {
    // Two fresh courses, one student each, so the filter’s effect is deterministic:
    // course A has only PW Student, course B has only PW Student2. Each course is
    // created in its own context because createTestCourse's loginAs isn't
    // idempotent (a second /login on an authed page just redirects away).
    const titleA = `StudentFilterA-${runId()}`;
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    const courseA = await createTestCourse(pageA, { capacity: 5, title: titleA });
    const resA = await pageA.request.post('/api/test/enroll', {
      data: { courseId: courseA, studentEmail: 'pw_student@ltsc.test' },
    });
    expect(resA.ok()).toBeTruthy();
    await ctxA.close();

    const titleB = `StudentFilterB-${runId()}`;
    const ctxB = await browser.newContext();
    const page = await ctxB.newPage();
    const courseB = await createTestCourse(page, { capacity: 5, title: titleB });
    const resB = await page.request.post('/api/test/enroll', {
      data: { courseId: courseB, studentEmail: 'pw_student2@ltsc.test' },
    });
    expect(resB.ok()).toBeTruthy();

    // page is already admin-authed from createTestCourse — run assertions here
    await page.goto('/admin/calendar');
    await page.waitForLoadState('networkidle');

    // List view avoids month navigation to reach the far-future session date
    await page.getByTestId('view-toggle-list').click();
    const list = page.getByTestId('sessions-list');
    await expect(list).toBeVisible();

    const studentFilter = page
      .getByTestId('calendar-filters-desktop')
      .getByTestId('filter-student');

    // Filter to PW Student → course A shows, course B hidden
    await studentFilter.click();
    await page.getByRole('option', { name: 'PW Student', exact: true }).click();
    await expect(list.getByText(titleA)).toBeVisible();
    await expect(list.getByText(titleB)).toHaveCount(0);

    // Filter to PW Student2 → course B shows, course A hidden
    await studentFilter.click();
    await page.getByRole('option', { name: 'PW Student2', exact: true }).click();
    await expect(list.getByText(titleB)).toBeVisible();
    await expect(list.getByText(titleA)).toHaveCount(0);

    await ctxB.close();
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
