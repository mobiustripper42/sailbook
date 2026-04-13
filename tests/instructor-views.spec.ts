import { test, expect } from '@playwright/test';
import type { Browser } from '@playwright/test';
import { loginAs, runId, PASSWORD } from './helpers';

/**
 * Creates a test course via admin UI with pw_instructor assigned, then enrolls
 * pw_student. Desktop-only setup — pass the `browser` fixture.
 *
 * Session date: 2027-09-15 · Location: "Edgewater Park"
 * Returns courseId and the first sessionId.
 */
async function createInstructorCourse(
  browser: Browser,
  { title }: { title: string }
): Promise<{ courseId: string; sessionId: string }> {
  let courseId!: string;
  let sessionId!: string;

  const adminCtx = await browser.newContext();
  const adminPage = await adminCtx.newPage();
  try {
    await loginAs(adminPage, 'pw_admin@ltsc.test', '/admin/dashboard');
    await adminPage.goto('/admin/courses/new');
    await expect(adminPage.getByRole('heading', { name: 'New Course' })).toBeVisible();

    await adminPage.getByLabel('Course Type').click();
    await adminPage.getByRole('option', { name: /ASA 101.*Basic Keelboat/ }).click();

    await adminPage.getByLabel('Title Override').fill(title);
    await adminPage.getByLabel('Capacity').fill('4');

    // Assign pw_instructor as instructor
    await adminPage.getByRole('combobox', { name: /Instructor/ }).click();
    await adminPage.getByRole('option', { name: /PW.*Instructor/ }).click();

    await adminPage.locator('input[type="date"]').fill('2027-09-15');
    await adminPage.locator('input[type="time"]').first().fill('09:00');
    await adminPage.locator('input[type="time"]').nth(1).fill('17:00');
    await adminPage.locator('section').filter({ hasText: 'Sessions' }).getByPlaceholder(/Dock A/).fill('Edgewater Park');

    await adminPage.getByRole('button', { name: 'Create Course' }).click({ force: true });
    await adminPage.waitForURL(/\/admin\/courses\/[0-9a-f-]+$/, { timeout: 10000 });

    const match = adminPage.url().match(/\/admin\/courses\/([0-9a-f-]+)$/);
    if (!match) throw new Error('Could not extract course ID from URL');
    courseId = match[1];

    // Extract sessionId from the row data attribute
    const sessionIdAttr = await adminPage
      .locator('[data-session-id]')
      .first()
      .getAttribute('data-session-id');
    if (!sessionIdAttr) throw new Error('Could not extract session ID from data-session-id attribute');
    sessionId = sessionIdAttr;

    // Publish the course
    await adminPage.getByRole('button', { name: 'Publish' }).click();
    await expect(adminPage.getByRole('button', { name: 'Mark Completed' })).toBeVisible({ timeout: 10000 });
  } finally {
    await adminCtx.close();
  }

  // pw_student enrolls
  const studentCtx = await browser.newContext();
  const studentPage = await studentCtx.newPage();
  try {
    await loginAs(studentPage, 'pw_student@ltsc.test', '/student/dashboard');
    await studentPage.goto(`/student/courses/${courseId}`);
    await studentPage.getByRole('button', { name: 'Enroll in This Course' }).click();
    await expect(studentPage.getByText('Pending confirmation')).toBeVisible({ timeout: 10000 });
  } finally {
    await studentCtx.close();
  }

  return { courseId, sessionId };
}

// ─── Instructor Dashboard — empty state ──────────────────────────────────────

test.describe('Instructor dashboard — empty state', () => {
  // pw_instructor has no courses assigned in seed — empty state is always present
  // on a clean DB reset, so this runs at all viewports.

  test('shows welcome heading and stat cards', async ({ page }) => {
    await loginAs(page, 'pw_instructor@ltsc.test', '/instructor/dashboard');
    await expect(page.getByRole('heading', { name: /Welcome back, PW/ })).toBeVisible();
    await expect(page.getByText('Active Courses', { exact: true })).toBeVisible();
    // "Upcoming Sessions" collides with the section h2 on a dirty DB — omitted here.
    // Total Students proves the stat grid renders.
    await expect(page.getByText('Total Students', { exact: true })).toBeVisible();
  });

  test('shows empty-state message when no sessions are assigned', async ({ page }) => {
    // NOTE: requires a clean DB (supabase db reset) — prior test runs accumulate
    // pw_instructor course assignments that make this state unreachable.
    test.skip(true, 'Requires clean DB — run supabase db reset first');
    await loginAs(page, 'pw_instructor@ltsc.test', '/instructor/dashboard');
    await expect(
      page.getByText('No upcoming sessions assigned to you.')
    ).toBeVisible();
  });
});

// ─── Instructor Dashboard — with assigned course ──────────────────────────────

test.describe('Instructor dashboard — with sessions', () => {
  test('shows session row with course title, enrollment count, and roster link', async ({
    page,
    browser,
  }) => {
    test.skip(test.info().project.name !== 'desktop');
    test.setTimeout(90000);

    const title = `PW Instructor Course ${runId()}`;
    await createInstructorCourse(browser, { title });

    await loginAs(page, 'pw_instructor@ltsc.test', '/instructor/dashboard');

    // Stat cards should show at least 1 course + 1 session
    // (count values aren't checked exactly — they depend on clean-DB state)
    await expect(page.getByText('Active Courses', { exact: true })).toBeVisible();
    // Use the section heading (h2) to avoid strict-mode collision with the stat card div
    await expect(page.getByRole('heading', { name: 'Upcoming Sessions' })).toBeVisible();

    // Session row shows the course title
    await expect(page.getByText(title)).toBeVisible();

    // Session row shows an enrollment badge (e.g. "1 / 4") — .first() because
    // dirty DBs may have multiple rows from prior test runs
    await expect(page.getByText(/\d+ \/ \d+/).first()).toBeVisible();

    // "Roster →" link is present — .first() because dirty DBs accumulate rows
    await expect(page.getByRole('link', { name: 'Roster →' }).first()).toBeVisible();
  });
});

// ─── Instructor Session Roster ────────────────────────────────────────────────

test.describe('Instructor session roster', () => {
  test('roster page shows course title, session metadata, and enrolled student', async ({
    page,
    browser,
  }) => {
    test.skip(test.info().project.name !== 'desktop');
    test.setTimeout(120000);

    const title = `PW Roster Course ${runId()}`;
    const { sessionId } = await createInstructorCourse(browser, { title });

    await loginAs(page, 'pw_instructor@ltsc.test', '/instructor/dashboard');
    await page.goto(`/instructor/sessions/${sessionId}`);

    // Heading is the course title
    await expect(page.getByRole('heading', { name: title })).toBeVisible();

    // Session metadata line: date + time + location
    // fmtDateLong uses weekday:'short', month:'short' → "Wed, Sep 15"
    await expect(page.getByText(/Wed, Sep 15/)).toBeVisible();
    await expect(page.getByText(/Edgewater Park/)).toBeVisible();

    // Enrollment count and "Roster" card heading
    await expect(page.getByText(/1 \/ 4/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Roster' })).toBeVisible();

    // pw_student appears as "Student, PW" in the table
    await expect(page.getByRole('cell', { name: /Student, PW/ })).toBeVisible();

    // Attendance column shows "—" (not yet marked)
    const studentRow = page.getByRole('row', { name: /Student, PW/ });
    await expect(studentRow.getByText('—')).toBeVisible();
  });

  test('back link returns to instructor dashboard', async ({ page, browser }) => {
    test.skip(test.info().project.name !== 'desktop');
    test.setTimeout(90000);

    const title = `PW Back ${runId()}`;
    const { sessionId } = await createInstructorCourse(browser, { title });

    await loginAs(page, 'pw_instructor@ltsc.test', '/instructor/dashboard');
    await page.goto(`/instructor/sessions/${sessionId}`);

    await page.getByRole('link', { name: '← Back to dashboard' }).click();
    await page.waitForURL('/instructor/dashboard');
    await expect(page.getByRole('heading', { name: /Welcome back, PW/ })).toBeVisible();
  });

  test('instructor cannot view a session they do not own', async ({ page }) => {
    // pw_instructor does not own seed sessions (Mike's course). RLS blocks the
    // session read → notFound() → 404 within the instructor layout. Either way,
    // no roster content is rendered.
    await loginAs(page, 'pw_instructor@ltsc.test', '/instructor/dashboard');
    await page.goto('/instructor/sessions/d1000000-0000-0000-0000-000000000001');
    await expect(page.getByRole('heading', { name: 'Roster' })).not.toBeVisible({ timeout: 5000 });
  });
});
