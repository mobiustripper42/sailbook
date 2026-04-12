import type { Page, Browser } from '@playwright/test';
import { expect } from '@playwright/test';

/** Shared password for all test users (admin, instructor, student, demo users). */
export const PASSWORD = 'qwert12345';

/**
 * Log in as any test user and wait for the post-login redirect.
 *
 * Requires a fresh browser context — if the page is already authenticated,
 * navigating to /login will redirect to the existing session's dashboard.
 * Create a new context (`browser.newContext()`) before calling this when
 * switching users mid-test.
 */
export async function loginAs(
  page: Page,
  email: string,
  dashboardUrl: string | RegExp
): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(dashboardUrl, { timeout: 10000 });
}

/**
 * Returns a random 6-char alphanumeric suffix.
 * Use in test data names to avoid unique-constraint failures on re-runs
 * without a `supabase db reset`.
 */
export function runId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

/**
 * Creates a test course via admin UI and publishes it. Returns the course UUID.
 * Requires `page` to be authenticated as an admin, or will log in as pw_admin.
 *
 * Always uses `{ force: true }` on Create Course — this helper is only called
 * from desktop-only test blocks, so the mobile sidebar overlap that motivated
 * the conditional force in admin-course-crud.spec.ts is not a concern here.
 *
 * After returning, `page` is on the admin course detail page.
 */
export async function createTestCourse(
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

/**
 * Creates a test course (via `createTestCourse`) then enrolls pw_student.
 * Manages its own admin + student browser contexts — pass the `browser` fixture.
 * Desktop-only tests only.
 *
 * Session date: 2027-09-15 · Location: "Edgewater Park"
 * These values are stable selectors in the attendance/cancellation tests.
 *
 * Returns courseId and the first sessionId (extracted from the Attendance link).
 */
export async function createEnrolledCourse(
  browser: Browser,
  { title }: { title: string }
): Promise<{ courseId: string; sessionId: string }> {
  let courseId!: string;
  let sessionId!: string;

  // Step 1: admin creates + publishes course
  const adminCtx = await browser.newContext();
  const adminPage = await adminCtx.newPage();
  try {
    courseId = await createTestCourse(adminPage, { capacity: 4, title });

    // page is now on /admin/courses/[courseId] — extract sessionId from Attendance link
    const href = await adminPage
      .getByRole('link', { name: 'Attendance' })
      .first()
      .getAttribute('href');
    const sessionMatch = href?.match(/\/sessions\/([0-9a-f-]+)\/attendance/);
    if (!sessionMatch) throw new Error('Could not extract session ID from attendance link href');
    sessionId = sessionMatch[1];
  } finally {
    await adminCtx.close();
  }

  // Step 2: pw_student enrolls (auto-creates session_attendance records)
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
