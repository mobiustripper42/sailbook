import { test, expect, type Page } from '@playwright/test';
import { loginAs, createTestCourse, runId } from './helpers';

// 6.20 / 10.3 — admin Schedule (sessions: Month=calendar, List=agenda) + instructor calendar

// Month + List share one month; click "next month" until the label matches.
async function gotoMonth(page: Page, label: string) {
  for (let i = 0; i < 24; i++) {
    const current = (await page.getByTestId('calendar-month-label').textContent())?.trim();
    if (current === label) return;
    await page.getByTestId('calendar-next').click();
  }
  throw new Error(`schedule never reached ${label}`);
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

  test('/admin/calendar redirects to /admin/schedule', async ({ page }) => {
    await page.goto('/admin/calendar');
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

  test('filters render; List view shows the session agenda', async ({ page }) => {
    await page.goto('/admin/schedule');
    await page.waitForLoadState('networkidle');

    const filters = page.getByTestId('calendar-filters');
    await expect(filters.getByTestId('filter-course-type')).toBeVisible();
    await expect(filters.getByTestId('filter-instructor')).toBeVisible();
    await expect(filters.getByTestId('filter-student')).toBeVisible();

    // List = the session agenda (mobile-friendly), not the courses table.
    await page.getByTestId('view-toggle-list').click();
    await expect(page.getByTestId('sessions-view-content')).toHaveAttribute('data-active-view', 'list');
    await expect(page.getByTestId('sessions-list')).toBeVisible();
  });
});

test.describe('Admin schedule — student filter', () => {
  test.beforeEach(() => {
    test.skip(test.info().project.name !== 'desktop');
  });

  test('student filter narrows the agenda to that student’s sessions', async ({ browser }) => {
    // Two fresh courses, one student each, so the filter’s effect is
    // deterministic. Each in its own context (createTestCourse's login isn't
    // idempotent). The List agenda shows every filtered session (no pill cap).
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

    await page.goto('/admin/schedule');
    await page.waitForLoadState('networkidle');

    // List agenda is month-scoped; navigate to the courses' month (Sep 2027).
    // The list has no pill cap, so filtering is unambiguous there.
    await page.getByTestId('view-toggle-list').click();
    await gotoMonth(page, 'September 2027');
    const list = page.getByTestId('sessions-list');
    await expect(list).toBeVisible();

    const studentFilter = page.getByTestId('calendar-filters').getByTestId('filter-student');

    // Filter to PW Student → course A shows, course B hidden.
    await studentFilter.click();
    await page.getByRole('option', { name: 'PW Student', exact: true }).click();
    await expect(list.getByText(titleA)).toBeVisible();
    await expect(list.getByText(titleB)).toHaveCount(0);

    // Filter to PW Student2 → course B shows, course A hidden.
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
