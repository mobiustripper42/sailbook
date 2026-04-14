import { test, expect } from '@playwright/test';
import { loginAs, runId, createTestCourse, confirmTestEnrollment } from './helpers';

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
    // c001 (ASA 101 Weekend May): capacity 4, Sam (confirmed) + Alex (registered).
    // Only confirmed enrollments count → 1 confirmed → 3 spots left.
    // pw_student has no seed enrollment on c001.
    // Scope to this card — c002 also has 1 confirmed enrollment (same badge text).
    const c001Card = page.locator('[data-slot="card"]').filter({ hasText: 'ASA 101 — Weekend Intensive (May)' });
    await expect(c001Card.getByText('3 spots left')).toBeVisible();
  });

  test('active course with all sessions in the past is hidden', async ({ page, browser }) => {
    test.skip(test.info().project.name !== 'desktop');

    const title = `PW Past ${runId()}`;

    // Admin creates an active course with a past session date
    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    await loginAs(adminPage, 'pw_admin@ltsc.test', '/admin/dashboard');
    await adminPage.goto('/admin/courses/new');
    await expect(adminPage.getByRole('heading', { name: 'New Course' })).toBeVisible();
    await adminPage.getByLabel('Course Type').click();
    await adminPage.getByRole('option', { name: /ASA 101.*Basic Keelboat/ }).click();
    await adminPage.getByLabel('Title Override').fill(title);
    await adminPage.getByLabel('Capacity').fill('4');
    await adminPage.locator('input[type="date"]').fill('2020-06-01');
    await adminPage.locator('input[type="time"]').first().fill('09:00');
    await adminPage.locator('input[type="time"]').nth(1).fill('17:00');
    await adminPage.locator('section').filter({ hasText: 'Sessions' }).getByPlaceholder(/Dock A/).fill('Edgewater Park');
    await adminPage.getByRole('button', { name: 'Create Course' }).click({ force: true });
    await adminPage.waitForURL(/\/admin\/courses\/[0-9a-f-]+$/, { timeout: 10000 });
    await adminPage.getByRole('button', { name: 'Publish' }).click();
    await expect(adminPage.getByRole('button', { name: 'Mark Completed' })).toBeVisible({ timeout: 10000 });
    await adminCtx.close();

    // Student browse page must not show the past course
    await page.goto('/student/courses');
    await expect(page.getByText(title)).not.toBeVisible();
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

    // Spot count unchanged — registered enrollments don't consume spots until confirmed
    await expect(page.getByText('4 of 4 remaining')).toBeVisible();
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

// ─── Spots Remaining Fix (Task 1.11) ────────────────────────────────────────

test.describe('Student — spots remaining counts only confirmed enrollments', () => {
  test('spot count decreases on admin confirm, not on student registration', async ({ page, browser }) => {
    test.skip(test.info().project.name !== 'desktop');
    test.setTimeout(90000);

    const title = `PW Spots ${runId()}`;

    // Admin creates capacity-2 course
    const adminCtx1 = await browser.newContext();
    const adminPage1 = await adminCtx1.newPage();
    const courseId = await createTestCourse(adminPage1, { capacity: 2, title });
    await adminCtx1.close();

    // Student sees 2 of 2 remaining before enrolling
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard');
    await page.goto(`/student/courses/${courseId}`);
    await expect(page.getByText('2 of 2 remaining')).toBeVisible();

    // Enroll → status = registered
    await page.getByRole('button', { name: 'Enroll in This Course' }).click();
    await expect(page.getByText('Pending confirmation')).toBeVisible({ timeout: 10000 });

    // Spots unchanged — registered enrollment does not consume a spot
    await expect(page.getByText('2 of 2 remaining')).toBeVisible();

    // Admin confirms the enrollment
    const adminCtx2 = await browser.newContext();
    const adminPage2 = await adminCtx2.newPage();
    await confirmTestEnrollment(adminPage2, courseId);
    await adminCtx2.close();

    // Now spot count decreases (1 confirmed → 1 spot remaining)
    await page.reload();
    await expect(page.getByText('1 of 2 remaining')).toBeVisible();
  });
});

// ─── Capacity Enforcement ────────────────────────────────────────────────────

test.describe('Student — capacity enforcement', () => {
  test('full course shows disabled Course Full button on course detail', async ({ page, browser }) => {
    test.skip(test.info().project.name !== 'desktop');
    test.setTimeout(90000);

    const title = `PW Full ${runId()}`;

    // Admin creates capacity-1 course
    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    const courseId = await createTestCourse(adminPage, { capacity: 1, title });
    await adminCtx.close();

    // pw_student enrolls (status = registered — does not yet consume the spot)
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard');
    await page.goto(`/student/courses/${courseId}`);
    await page.getByRole('button', { name: 'Enroll in This Course' }).click();
    await expect(page.getByText('Pending confirmation')).toBeVisible({ timeout: 10000 });

    // Admin confirms — enrollment is now counted against capacity
    const adminCtx2 = await browser.newContext();
    const adminPage2 = await adminCtx2.newPage();
    await confirmTestEnrollment(adminPage2, courseId);
    await adminCtx2.close();

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
    test.setTimeout(90000);

    // Title contains "Full" — use exact matching below to avoid substring collisions
    const title = `PW Cap ${runId()}`;

    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    const courseId = await createTestCourse(adminPage, { capacity: 1, title });
    await adminCtx.close();

    // pw_student enrolls (status = registered — does not yet consume the spot)
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard');
    await page.goto(`/student/courses/${courseId}`);
    await page.getByRole('button', { name: 'Enroll in This Course' }).click();
    await expect(page.getByText('Pending confirmation')).toBeVisible({ timeout: 10000 });

    // Admin confirms — enrollment is now counted against capacity
    const adminCtx2 = await browser.newContext();
    const adminPage2 = await adminCtx2.newPage();
    await confirmTestEnrollment(adminPage2, courseId);
    await adminCtx2.close();

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
