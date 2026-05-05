import type { Page, Browser } from '@playwright/test';
import { expect } from '@playwright/test';

/** Shared password for all test users (admin, instructor, student, demo users). */
export const PASSWORD = 'Sailbook12345';

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
 * Drives the TimeSelect component (two shadcn Select dropdowns wrapping a
 * hidden input) by hidden-input `name`. Use this instead of `.fill()` on
 * `input[type="time"]` — those native inputs were replaced in 6.13.
 *
 * Minutes snap to 15-minute intervals (00, 15, 30, 45). Other values throw.
 */
export async function selectTime(page: Page, name: string, hhmm: string): Promise<void> {
  const [hStr, mStr] = hhmm.split(':');
  const hour = parseInt(hStr, 10);
  const minute = parseInt(mStr, 10);
  if (![0, 15, 30, 45].includes(minute)) {
    throw new Error(`selectTime: minute must be 0/15/30/45, got ${minute}`);
  }
  const hourLabel =
    hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
  const minuteLabel = String(minute).padStart(2, '0');

  const wrapper = page.locator(`input[type="hidden"][name="${name}"]`).locator('..');
  await wrapper.locator('button[role="combobox"]').first().click();
  await page.getByRole('option', { name: hourLabel, exact: true }).click();
  await wrapper.locator('button[role="combobox"]').nth(1).click();
  await page.getByRole('option', { name: minuteLabel, exact: true }).click();
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
  { capacity, title, price = 250 }: { capacity: number; title: string; price?: number }
): Promise<string> {
  await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
  await page.goto('/admin/courses/new');
  await expect(page.getByRole('heading', { name: 'New Course' })).toBeVisible();

  await page.getByLabel('Course Type').click();
  await page.getByRole('option', { name: /Dinghy/ }).click();

  // Unique title so we can find the card on the student browse page
  await page.getByLabel('Title Override').fill(title);
  await page.getByLabel('Capacity').fill(String(capacity));
  await page.getByLabel('Price ($)', { exact: true }).fill(String(price));

  // Far-future date so the session never counts as past
  await page.locator('input[type="date"]').fill('2027-09-15');
  await selectTime(page, 'session_start_0', '09:00');
  await selectTime(page, 'session_end_0', '17:00');
  await page.locator('section').filter({ hasText: 'Sessions' }).getByPlaceholder(/Dock A/).fill('Edgewater Park');

  await page.getByRole('button', { name: 'Create Course' }).click({ force: true });
  await page.waitForURL(/\/admin\/courses\/[0-9a-f-]+$/, { timeout: 10000 });

  const match = page.url().match(/\/admin\/courses\/([0-9a-f-]+)$/);
  if (!match) throw new Error('Could not extract course ID from URL');
  const courseId = match[1];

  // Courses start as draft — publish to make visible to students.
  // Status transitions live behind the course actions menu (DEC-028).
  await clickCourseAction(page, 'Publish');

  return courseId;
}

/**
 * Opens the course-detail page-header `⋯` menu and clicks the named status
 * transition (Publish / Revert to Draft / Mark Completed / Cancel Course),
 * then waits for the server action to complete by watching for the menu to
 * close and the trigger to be re-enabled.
 *
 * Per DEC-028, status transitions are no longer visible buttons — this helper
 * is the canonical way to drive them in tests. Cancel/Revert/Complete prompt a
 * `window.confirm`; tests using those should accept the dialog before calling
 * (or use `page.on('dialog', d => d.accept())`).
 */
export async function clickCourseAction(
  page: Page,
  action: 'Publish' | 'Revert to Draft' | 'Mark Completed' | 'Cancel Course',
): Promise<void> {
  const trigger = page.getByRole('button', { name: 'Course actions' });
  await trigger.click();
  await page.getByRole('menuitem', { name: action }).click();
  // Server action runs in a transition → trigger goes disabled, then re-enabled
  // when the page re-renders. Wait for the trigger to be tappable again.
  await expect(trigger).toBeEnabled({ timeout: 10000 });
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

    // page is now on /admin/courses/[courseId] — extract sessionId from row data attribute
    const sessionIdAttr = await adminPage
      .locator('[data-session-id]')
      .first()
      .getAttribute('data-session-id');
    if (!sessionIdAttr) throw new Error('Could not extract session ID from data-session-id attribute');
    sessionId = sessionIdAttr;
  } finally {
    await adminCtx.close();
  }

  // Step 2: enroll pw_student directly via dev-only API (bypasses Stripe)
  const apiCtx = await browser.newContext();
  const apiPage = await apiCtx.newPage();
  try {
    const response = await apiPage.request.post('http://localhost:3000/api/test/enroll', {
      data: { courseId, studentEmail: 'pw_student@ltsc.test' },
    });
    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Test enrollment failed: ${response.status()} ${body}`);
    }
  } finally {
    await apiCtx.close();
  }

  return { courseId, sessionId };
}

/**
 * Confirms the first pending (registered) enrollment on a course via the admin UI.
 * Requires `adminPage` to be authenticated as an admin (or will log in as pw_admin).
 * After returning, `adminPage` is on the admin course detail page.
 */
export async function confirmTestEnrollment(adminPage: Page, courseId: string): Promise<void> {
  await loginAs(adminPage, 'pw_admin@ltsc.test', '/admin/dashboard');
  await adminPage.goto(`/admin/courses/${courseId}`);
  // Wait for the Confirm button to be visible (client component hydrates after SSR)
  await adminPage.getByRole('button', { name: 'Confirm' }).first().waitFor({ state: 'visible', timeout: 10000 });
  await adminPage.getByRole('button', { name: 'Confirm' }).first().click();
  // Wait for network to settle so the server action completes before closing the context.
  // Closing the context mid-flight cancels the in-flight request and skips the DB write.
  await adminPage.waitForLoadState('networkidle', { timeout: 10000 });
}
