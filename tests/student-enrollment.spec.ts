import { test, expect, type Page } from '@playwright/test';
import { loginAs, runId } from './helpers';

/**
 * Creates a test course via admin UI. Returns the course UUID.
 * Requires a fresh browser context — must not already be authenticated.
 *
 * Always uses `{ force: true }` on Create Course — this helper is only called
 * from desktop-only test blocks, so the mobile sidebar overlap that motivated
 * the conditional force in admin-course-crud.spec.ts is not a concern here.
 */
async function createTestCourse(
  page: Page,
  { capacity, title }: { capacity: number; title: string }
): Promise<string> {
  await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
  await page.goto('/admin/courses/new');
  await expect(page.getByRole('heading', { name: 'New Course' })).toBeVisible();

  await page.getByLabel('Course Type').click();
  await page.getByRole('option', { name: /ASA 101.*Basic Keelboat/ }).click();

  // Unique title so we can find the card on the student browse page
  await page.getByLabel('Title Override').fill(title);
  await page.getByLabel('Capacity').fill(String(capacity));

  // Far-future date so the session never counts as past
  await page.locator('input[type="date"]').fill('2027-09-15');
  await page.locator('input[type="time"]').first().fill('09:00');
  await page.locator('input[type="time"]').nth(1).fill('17:00');
  await page.locator('section').filter({ hasText: 'Sessions' }).getByPlaceholder(/Dock A/).fill('Edgewater Park');

  await page.getByRole('button', { name: 'Create Course' }).click({ force: true });
  await page.waitForURL(/\/admin\/courses\/[0-9a-f-]+$/, { timeout: 10000 });

  const match = page.url().match(/\/admin\/courses\/([0-9a-f-]+)$/);
  if (!match) throw new Error('Could not extract course ID from URL');
  const courseId = match[1];

  // Courses start as draft — publish to make visible to students.
  // After the server action completes, the page re-renders: Publish disappears,
  // Mark Completed appears.
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByRole('button', { name: 'Mark Completed' })).toBeVisible({ timeout: 10000 });

  return courseId;
}

// ─── Browse Courses ──────────────────────────────────────────────────────────

test.describe('Student — browse courses', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard');
  });

  test('shows active seed courses on browse page', async ({ page }) => {
    await page.goto('/student/courses');
    await expect(page.getByText('ASA 101 — Weekend Intensive (May)')).toBeVisible();
    await expect(page.getByText('ASA 101 — Evening Series (May)')).toBeVisible();
    await expect(page.getByText('Open Sailing — July Wednesdays')).toBeVisible();
  });

  test('draft and completed courses are not shown', async ({ page }) => {
    await page.goto('/student/courses');
    // c005 is draft status — must not appear
    await expect(page.getByText('Dinghy Sailing for Adults')).not.toBeVisible();
    // c004 is completed status — must not appear
    await expect(page.getByText('ASA 101 — Weekend (April)')).not.toBeVisible();
  });

  test('course cards display spots remaining badges', async ({ page }) => {
    await page.goto('/student/courses');
    // c001 (ASA 101 Weekend May): capacity 4, Sam (confirmed) + Alex (registered) = 2 active
    // → 4 - 2 = 2 spots left. pw_student has no seed enrollment on c001.
    await expect(page.getByText('2 spots left')).toBeVisible();
  });
});

// ─── Enroll in a Course ──────────────────────────────────────────────────────
// Desktop only — these tests write enrollment records; running them on all
// viewports simultaneously would race on the same pw_student row.

test.describe('Student — enroll in a course', () => {
  test('full enroll flow: course detail → enroll → Pending confirmation', async ({ page, browser }) => {
    test.skip(test.info().project.name !== 'desktop');

    const title = `PW Enroll ${runId()}`;

    // Admin creates test course in a separate browser context
    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    const courseId = await createTestCourse(adminPage, { capacity: 4, title });
    await adminCtx.close();

    // pw_student views the course detail page
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard');
    await page.goto(`/student/courses/${courseId}`);

    // Spot count and enroll button visible before enrollment
    await expect(page.getByText('4 of 4 remaining')).toBeVisible();
    const enrollBtn = page.getByRole('button', { name: 'Enroll in This Course' });
    await expect(enrollBtn).toBeEnabled();

    // Enroll
    await enrollBtn.click();

    // After enrollment: Pending confirmation badge appears, enroll button is gone
    await expect(page.getByText('Pending confirmation')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Enroll in This Course' })).not.toBeVisible();

    // Spot count decrements (1 of 4 now taken by pw_student)
    await expect(page.getByText('3 of 4 remaining')).toBeVisible();
  });

  test('enrolled course card shows Pending confirmation badge on browse page', async ({ page, browser }) => {
    test.skip(test.info().project.name !== 'desktop');

    const title = `PW Browse ${runId()}`;

    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    const courseId = await createTestCourse(adminPage, { capacity: 4, title });
    await adminCtx.close();

    // pw_student enrolls
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard');
    await page.goto(`/student/courses/${courseId}`);
    await page.getByRole('button', { name: 'Enroll in This Course' }).click();
    await expect(page.getByText('Pending confirmation')).toBeVisible({ timeout: 10000 });

    // Browse page: the card for this course should show the enrollment badge
    await page.goto('/student/courses');
    const card = page.locator('[data-slot="card"]').filter({ hasText: title });
    await expect(card.getByText('Pending confirmation')).toBeVisible();
  });
});

// ─── Capacity Enforcement ────────────────────────────────────────────────────

test.describe('Student — capacity enforcement', () => {
  test('full course shows disabled Course Full button on course detail', async ({ page, browser }) => {
    test.skip(test.info().project.name !== 'desktop');

    const title = `PW Full ${runId()}`;

    // Admin creates capacity-1 course
    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    const courseId = await createTestCourse(adminPage, { capacity: 1, title });
    await adminCtx.close();

    // pw_student enrolls, filling the course (1 of 1)
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard');
    await page.goto(`/student/courses/${courseId}`);
    await page.getByRole('button', { name: 'Enroll in This Course' }).click();
    await expect(page.getByText('Pending confirmation')).toBeVisible({ timeout: 10000 });

    // jordan (not enrolled in this course) checks the course detail.
    // Course is now full — should see a disabled "Course Full" button.
    const jordanCtx = await browser.newContext();
    try {
      const jordanPage = await jordanCtx.newPage();
      await loginAs(jordanPage, 'jordan@ltsc.test', '/student/dashboard');
      await jordanPage.goto(`/student/courses/${courseId}`);
      const fullBtn = jordanPage.getByRole('button', { name: 'Course Full' });
      await expect(fullBtn).toBeVisible();
      await expect(fullBtn).toBeDisabled();
    } finally {
      await jordanCtx.close();
    }
  });

  test('full course card shows Full badge on browse page', async ({ page, browser }) => {
    test.skip(test.info().project.name !== 'desktop');

    // Title contains "Full" — use exact matching below to avoid substring collisions
    const title = `PW Cap ${runId()}`;

    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    const courseId = await createTestCourse(adminPage, { capacity: 1, title });
    await adminCtx.close();

    // pw_student fills the course
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard');
    await page.goto(`/student/courses/${courseId}`);
    await page.getByRole('button', { name: 'Enroll in This Course' }).click();
    await expect(page.getByText('Pending confirmation')).toBeVisible({ timeout: 10000 });

    // jordan sees the Full badge on the browse page card.
    // Exact match required: card title also contains text, avoid strict-mode violation.
    const jordanCtx = await browser.newContext();
    try {
      const jordanPage = await jordanCtx.newPage();
      await loginAs(jordanPage, 'jordan@ltsc.test', '/student/dashboard');
      await jordanPage.goto('/student/courses');
      const card = jordanPage.locator('[data-slot="card"]').filter({ hasText: title });
      await expect(card.getByText('Full', { exact: true })).toBeVisible();
    } finally {
      await jordanCtx.close();
    }
  });
});

// ─── Duplicate Enrollment Prevention ────────────────────────────────────────

test.describe('Student — duplicate enrollment prevention', () => {
  test('re-visiting an enrolled course shows status badge, not enroll button', async ({ page, browser }) => {
    test.skip(test.info().project.name !== 'desktop');

    const title = `PW Dup ${runId()}`;

    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    const courseId = await createTestCourse(adminPage, { capacity: 4, title });
    await adminCtx.close();

    // pw_student enrolls
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard');
    await page.goto(`/student/courses/${courseId}`);
    await page.getByRole('button', { name: 'Enroll in This Course' }).click();
    await expect(page.getByText('Pending confirmation')).toBeVisible({ timeout: 10000 });

    // Re-navigate to the same course — server re-fetches enrollment state.
    // The Enroll button must not appear; only the status badge should render.
    // This tests the UI half of duplicate prevention (the button disappears post-enroll).
    // The server-side guard ('You are already enrolled in this course.') is covered
    // by the enrollInCourse action logic; no UI path can trigger it once enrolled.
    await page.goto(`/student/courses/${courseId}`);
    await expect(page.getByText('Pending confirmation')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enroll in This Course' })).not.toBeVisible();
  });
});
