import { test, expect } from '@playwright/test';
import { loginAs, runId, createEnrolledCourse } from './helpers';

// ─── Admin — Attendance Marking ──────────────────────────────────────────────

test.describe('Admin — attendance marking', () => {
  test('marks a student as attended and saves', async ({ page, browser }) => {
    test.skip(test.info().project.name !== 'desktop');
    test.setTimeout(90000);

    const { courseId, sessionId } = await createEnrolledCourse(browser, {
      title: `PW Attend ${runId()}`,
    });

    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
    await page.goto(`/admin/courses/${courseId}/sessions/${sessionId}/attendance`);

    // pw_student (PW Student) should appear in the roster with "expected" status
    const studentRow = page.getByRole('row', { name: /PW Student/ });
    await expect(studentRow).toBeVisible();

    // Save starts disabled (no changes yet)
    await expect(page.getByRole('button', { name: 'Save Attendance' })).toBeDisabled();

    // Change status from "expected" to "attended"
    await studentRow.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Attended' }).click();

    // Save is now enabled
    await expect(page.getByRole('button', { name: 'Save Attendance' })).toBeEnabled();
    await page.getByRole('button', { name: 'Save Attendance' }).click();

    await expect(page.getByText('Attendance saved.')).toBeVisible({ timeout: 10000 });
  });

  test('"All Attended" quick action enables the Save button', async ({ page, browser }) => {
    test.skip(test.info().project.name !== 'desktop');
    test.setTimeout(90000);

    const { courseId, sessionId } = await createEnrolledCourse(browser, {
      title: `PW AllAt ${runId()}`,
    });

    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
    await page.goto(`/admin/courses/${courseId}/sessions/${sessionId}/attendance`);

    // Save starts disabled
    await expect(page.getByRole('button', { name: 'Save Attendance' })).toBeDisabled();

    // Click "All Attended" quick action
    await page.getByRole('button', { name: 'All Attended' }).click();

    // Save is now enabled — status changed from expected → attended for all students.
    // Save path (click → toast) is covered by the "marks a student as attended" test above.
    await expect(page.getByRole('button', { name: 'Save Attendance' })).toBeEnabled();
  });
});

// ─── Student — Attendance History Page ───────────────────────────────────────
//
// Uses seed data: jordan@ltsc.test attended c004 Day 1, missed Day 2 (no makeup).
// Read-only — safe to run on all viewports.

test.describe('Student — attendance history page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'jordan@ltsc.test', '/student/dashboard');
  });

  test('shows missed session alert banner', async ({ page }) => {
    await page.goto('/student/attendance');
    // Banner: "You have 1 missed session that needs a makeup."
    await expect(page.getByText(/You have 1 missed session/)).toBeVisible();
  });

  test('course card shows Missed badge, Needs makeup text, and "1 needs makeup" chip', async ({ page }) => {
    await page.goto('/student/attendance');

    // Card for the April course Jordan was enrolled in
    const card = page.locator('[data-slot="card"]').filter({ hasText: 'ASA 101 — Weekend (April)' });
    await expect(card).toBeVisible();

    // Header chip: "1 needs makeup"
    await expect(card.getByText('1 needs makeup')).toBeVisible();

    // Session row: "Missed" status badge
    await expect(card.getByText('Missed')).toBeVisible();

    // Session row: "Needs makeup" inline text (exact to avoid matching the "1 needs makeup" badge)
    await expect(card.getByText('Needs makeup', { exact: true })).toBeVisible();
  });
});

// ─── Admin + Student — Attendance Reflected on Course Detail ─────────────────

test.describe('Admin + student — attendance on course detail', () => {
  test('admin marks attended → student sees Attended badge on course detail', async ({ page, browser }) => {
    test.skip(test.info().project.name !== 'desktop');
    test.setTimeout(120000);

    const { courseId, sessionId } = await createEnrolledCourse(browser, {
      title: `PW AttDet ${runId()}`,
    });

    // Admin marks pw_student as attended
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
    await page.goto(`/admin/courses/${courseId}/sessions/${sessionId}/attendance`);
    const studentRow = page.getByRole('row', { name: /PW Student/ });
    await studentRow.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Attended' }).click();
    await page.getByRole('button', { name: 'Save Attendance' }).click();
    await expect(page.getByText('Attendance saved.')).toBeVisible({ timeout: 10000 });

    // pw_student navigates to the course detail — Attendance column should be visible
    // (only rendered when the user is enrolled in the course)
    const studentCtx = await browser.newContext();
    try {
      const studentPage = await studentCtx.newPage();
      await loginAs(studentPage, 'pw_student@ltsc.test', '/student/dashboard');
      await studentPage.goto(`/student/courses/${courseId}`);

      // Column header "Attendance" only appears when enrolled
      await expect(studentPage.getByRole('columnheader', { name: 'Attendance' })).toBeVisible();

      // "Attended" badge in the session row
      await expect(studentPage.getByText('Attended')).toBeVisible();
    } finally {
      await studentCtx.close();
    }
  });
});

// ─── Admin — Enrollment Cancellation ─────────────────────────────────────────

test.describe('Admin — enrollment cancellation', () => {
  test('admin cancels enrollment — buttons disappear, row shows cancelled on reload', async ({ page, browser }) => {
    test.skip(test.info().project.name !== 'desktop');
    test.setTimeout(90000);

    const { courseId } = await createEnrolledCourse(browser, {
      title: `PW EnrlCncl ${runId()}`,
    });

    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
    await page.goto(`/admin/courses/${courseId}`);

    // PW Student should appear in the enrollments table with a Cancel button
    const enrollmentRow = page.getByRole('row').filter({ hasText: 'pw_student@ltsc.test' });
    await expect(enrollmentRow).toBeVisible();
    await expect(enrollmentRow.getByRole('button', { name: 'Cancel' })).toBeVisible();

    // Accept the confirm() dialog that fires when Cancel is clicked
    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'confirm') await dialog.accept();
    });

    await enrollmentRow.getByRole('button', { name: 'Cancel' }).click();

    // Optimistic update: Cancel button disappears immediately
    await expect(enrollmentRow.getByRole('button', { name: 'Cancel' })).not.toBeVisible({
      timeout: 10000,
    });

    // Reload to verify server state: row now shows "cancelled" status badge
    await page.reload();
    const updatedRow = page.getByRole('row').filter({ hasText: 'pw_student@ltsc.test' });
    await expect(updatedRow.getByText('cancelled')).toBeVisible();
  });
});

// ─── Admin — Session Cancellation + Makeup ────────────────────────────────────

test.describe('Admin — session cancellation + makeup', () => {
  test('full flow: cancel session → schedule makeup → student sees Makeup scheduled', async ({ page, browser }) => {
    test.skip(test.info().project.name !== 'desktop');
    test.setTimeout(120000);

    const { courseId } = await createEnrolledCourse(browser, {
      title: `PW Makeup ${runId()}`,
    });

    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
    await page.goto(`/admin/courses/${courseId}`);

    // Handle prompt() for cancel reason (session cancel) and any other dialogs
    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'prompt') {
        await dialog.accept('weather');
      } else {
        await dialog.accept();
      }
    });

    // Cancel the session (row identified by "Edgewater Park", the location set in createEnrolledCourse)
    const sessionRow = page.getByRole('row').filter({ hasText: 'Edgewater Park' });
    await sessionRow.getByRole('button', { name: 'Cancel' }).click();

    // Session status badge flips to "cancelled"
    await expect(sessionRow.getByText('cancelled')).toBeVisible({ timeout: 10000 });

    // MakeupSessionForm row appears with "Schedule Makeup (1 student)" button
    const makeupButton = page.getByRole('button', { name: /Schedule Makeup.*1 student/ });
    await expect(makeupButton).toBeVisible({ timeout: 10000 });

    // Open the makeup form and fill in a makeup date.
    // Scoped to the form element to avoid any other date inputs on the page.
    await makeupButton.click();
    await page
      .locator('form')
      .filter({ hasText: 'Schedule Makeup' })
      .locator('input[name="date"]')
      .fill('2027-09-22');
    await page.getByRole('button', { name: 'Create Makeup' }).click();

    // After redirect: makeup row shows "Makeup scheduled (1 student)"
    await expect(page.getByText('Makeup scheduled (1 student)')).toBeVisible({ timeout: 10000 });

    // pw_student visits the course detail — should see "Missed" badge + "Makeup scheduled" text
    // on the now-cancelled original session row
    const studentCtx = await browser.newContext();
    try {
      const studentPage = await studentCtx.newPage();
      await loginAs(studentPage, 'pw_student@ltsc.test', '/student/dashboard');
      await studentPage.goto(`/student/courses/${courseId}`);

      // "Missed" badge (the original session's attendance was flipped to missed on cancellation)
      await expect(studentPage.getByText('Missed')).toBeVisible();

      // "Makeup scheduled" text (makeup_session_id is now set on the original attendance record)
      await expect(studentPage.getByText('Makeup scheduled')).toBeVisible();
    } finally {
      await studentCtx.close();
    }
  });
});
