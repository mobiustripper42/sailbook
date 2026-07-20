import { test, expect, type Page } from '@playwright/test';
import { loginAs, createTestCourse, runId } from './helpers';

// 6.20 / 10.3 — admin Schedule (Month=calendar, List=courses table) + instructor calendar

// Click "next month" until the calendar shows the target month label.
async function gotoMonth(page: Page, label: string) {
  for (let i = 0; i < 60; i++) {
    const current = (await page.getByTestId('calendar-month-label').textContent())?.trim();
    if (current === label) return;
    await page.getByTestId('calendar-next').click();
  }
  throw new Error(`calendar never reached ${label}`);
}

test.describe('Admin schedule', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop');
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
  });

  test('Schedule nav link navigates to /admin/schedule', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Schedule' }).first()).toBeVisible();
    await page.getByRole('link', { name: 'Schedule' }).first().click();
    await expect(page).toHaveURL('/admin/schedule');
    await expect(page.getByRole('heading', { name: 'Schedule' })).toBeVisible();
  });

  test('/admin/calendar and /admin/courses redirect to /admin/schedule', async ({ page }) => {
    await page.goto('/admin/calendar');
    await expect(page).toHaveURL('/admin/schedule');
    await page.goto('/admin/courses');
    await expect(page).toHaveURL('/admin/schedule');
  });

  test('Month view shows the calendar + Month/List toggle', async ({ page }) => {
    await page.goto('/admin/schedule');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('sessions-view-toggle')).toBeVisible();
    await expect(page.getByTestId('view-toggle-calendar')).toHaveText('Month');
    await expect(page.getByTestId('sessions-calendar')).toBeVisible();
    await expect(page.getByTestId('calendar-month-label')).toBeVisible();
  });

  test('filters render on Month; List view shows the courses table', async ({ page }) => {
    await page.goto('/admin/schedule');
    await page.waitForLoadState('networkidle');

    const filters = page.getByTestId('calendar-filters');
    await expect(filters.getByTestId('filter-course-type')).toBeVisible();
    await expect(filters.getByTestId('filter-instructor')).toBeVisible();
    await expect(filters.getByTestId('filter-student')).toBeVisible();

    // List = the courses table (its own search), not the per-session agenda.
    await page.getByTestId('view-toggle-list').click();
    await expect(page.getByTestId('sessions-view-content')).toHaveAttribute('data-active-view', 'list');
    await expect(page.getByPlaceholder('Search by title, type, or instructor…')).toBeVisible();
  });
});

test.describe('Admin schedule — calendar student filter', () => {
  test.beforeEach(() => {
    test.skip(test.info().project.name !== 'desktop');
  });

  test('student filter narrows the calendar to that student’s sessions', async ({ browser }) => {
    // Put both courses on a unique day (hashed from runId) so the calendar cell
    // stays clean — the shared far-future date otherwise accumulates sessions
    // across runs and pushes our pill into the "+N more" overflow.
    const id = runId();
    let h = 0;
    for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    // 2028 window (no other test uses it) → clean cell, reachable by month-nav.
    const day = new Date(2028, 0, 1);
    day.setDate(day.getDate() + (h % 400)); // ~13-month spread, negligible collision
    const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    const monthLabel = day.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const titleA = `StudentFilterA-${id}`;
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    const courseA = await createTestCourse(pageA, { capacity: 5, title: titleA, sessionDate: iso });
    const resA = await pageA.request.post('/api/test/enroll', {
      data: { courseId: courseA, studentEmail: 'pw_student@ltsc.test' },
    });
    expect(resA.ok()).toBeTruthy();
    await ctxA.close();

    const titleB = `StudentFilterB-${id}`;
    const ctxB = await browser.newContext();
    const page = await ctxB.newPage();
    const courseB = await createTestCourse(page, { capacity: 5, title: titleB, sessionDate: iso });
    const resB = await page.request.post('/api/test/enroll', {
      data: { courseId: courseB, studentEmail: 'pw_student2@ltsc.test' },
    });
    expect(resB.ok()).toBeTruthy();

    await page.goto('/admin/schedule');
    await page.waitForLoadState('networkidle');

    const studentFilter = page.getByTestId('calendar-filters').getByTestId('filter-student');

    // Filter to PW Student → navigate to the session month → A visible, B hidden.
    await studentFilter.click();
    await page.getByRole('option', { name: 'PW Student', exact: true }).click();
    await gotoMonth(page, monthLabel);
    const cell = page.locator(`[data-date="${iso}"]`);
    await expect(cell.getByText(titleA)).toBeVisible();
    await expect(cell.getByText(titleB)).toHaveCount(0);

    // Filter to PW Student2 → B visible, A hidden.
    await studentFilter.click();
    await page.getByRole('option', { name: 'PW Student2', exact: true }).click();
    await expect(cell.getByText(titleB)).toBeVisible();
    await expect(cell.getByText(titleA)).toHaveCount(0);

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
