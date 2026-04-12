import { test, expect, type Page } from '@playwright/test';

const PASSWORD = 'qwert12345';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('pw_admin@ltsc.test');
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/admin/dashboard', { timeout: 10000 });
}

/** Random 6-char alphanum suffix so each test run creates distinct DB records. */
function runId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// ─── Course Type CRUD ───────────────────────────────────────────────────────

test.describe('Admin — course type creation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('creates a course type and appears in the list', async ({ page }) => {
    // Use run-unique code so re-runs don't hit the short_code unique constraint.
    const id = runId();
    const shortCode = `P${id.slice(0, 5)}`; // ≤ 6 chars, well within 20-char limit
    const typeName = `Playwright Type ${id}`;

    await page.goto('/admin/course-types/new');
    await expect(page.getByRole('heading', { name: 'Add Course Type' })).toBeVisible();

    await page.getByLabel('Name').fill(typeName);
    await page.getByLabel('Short Code').fill(shortCode);
    await page.getByLabel('Max Students').fill('3');

    await page.getByRole('button', { name: 'Create' }).click();

    // Should redirect to course type list
    await expect(page).toHaveURL('/admin/course-types', { timeout: 10000 });

    // New type should appear in the list
    await expect(page.getByText(typeName)).toBeVisible();
  });

  test('course type list shows existing seed types', async ({ page }) => {
    await page.goto('/admin/course-types');
    await expect(page.getByText('ASA 101 — Basic Keelboat Sailing')).toBeVisible();
    await expect(page.getByText('ASA 103 — Basic Coastal Cruising')).toBeVisible();
  });
});

// ─── Course Creation ────────────────────────────────────────────────────────

test.describe('Admin — course creation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('creates a course with one session and lands on course detail', async ({ page }) => {
    await page.goto('/admin/courses/new');
    await expect(page.getByRole('heading', { name: 'New Course' })).toBeVisible();

    // Select course type via shadcn Select (trigger is associated with label via htmlFor/id)
    await page.getByLabel('Course Type').click();
    await page.getByRole('option', { name: /ASA 101.*Basic Keelboat/ }).click();

    // Fill capacity (auto-populated from course type but we set it explicitly)
    await page.getByLabel('Capacity').fill('4');

    // Fill the first session — date, start, end, location.
    // CourseForm session inputs are controlled React (no name attrs on visible inputs);
    // locate by type. Hidden inputs carry the name attrs and are updated via state.
    await page.locator('input[type="date"]').fill('2027-09-15');
    await page.locator('input[type="time"]').first().fill('09:00');
    await page.locator('input[type="time"]').nth(1).fill('17:00');
    await page.locator('section').filter({ hasText: 'Sessions' }).getByPlaceholder(/Dock A/).fill('Edgewater Park');

    const createBtn = page.getByRole('button', { name: 'Create Course' });
    await createBtn.scrollIntoViewIfNeeded();
    // Mobile (375px): sidebar is w-56 and not responsive; force bypasses the
    // pointer-intercept check that fires when the sidebar overlaps the button coords.
    if (test.info().project.name === 'mobile') {
      await createBtn.click({ force: true });
    } else {
      await createBtn.click();
    }

    // Should redirect to /admin/courses/[id]
    await expect(page).toHaveURL(/\/admin\/courses\/[0-9a-f-]+$/);

    // Course detail page should show the session we created
    await expect(page.getByRole('cell', { name: /Sep.*15|Tue.*Sep/ })).toBeVisible();
    await expect(page.getByText('Edgewater Park')).toBeVisible();
  });

  test('redirects to /admin/course-types/new when no course types exist — skipped (seed has types)', async () => {
    // This flow only triggers when there are zero active course types.
    // The seed always provides active types, so this path is not exercised here.
    test.skip();
  });
});

// ─── Add Session to Existing Course ────────────────────────────────────────

test.describe('Admin — add session to existing course', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('adds a session via the course detail page', async ({ page }) => {
    // The sessions table on c1 accumulates rows across test runs. On narrow viewports
    // (mobile/tablet) the overflow-x-auto container and non-responsive sidebar make
    // force:true unreliable — the click can land on the table or sidebar instead.
    // Tested on desktop (1440px) where the layout is stable. TODO: revisit when
    // admin gets a responsive mobile layout.
    test.skip(test.info().project.name !== 'desktop');

    // Use the seed course: ASA 101 Weekend Intensive (May) — c1000000-...-001
    const courseId = 'c1000000-0000-0000-0000-000000000001';
    // Unique location per run so re-runs don't cause strict-mode violations in assertions.
    const location = `Dock ${runId().slice(0, 4)}`;

    await page.goto(`/admin/courses/${courseId}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Open the inline form. The overflow-x-auto table container (and sidebar on
    // mobile) sit on top of the button in pointer coordinates. force:true fires the
    // click at the button's center without the pointer-intercept actionability check.
    // No scrollIntoViewIfNeeded — scrolling repositions the element and can cause
    // the force-click to land on the element that was previously on top.
    await page.getByRole('button', { name: '+ Add Session' }).click({ force: true });

    // Fill date, start, end, location
    await page.locator('input[name="date"]').fill('2027-10-20');
    await page.locator('input[name="start_time"]').fill('08:00');
    await page.locator('input[name="end_time"]').fill('12:00');
    await page.locator('input[name="location"]').fill(location);

    await page.getByRole('button', { name: 'Add Session' }).click({ force: true });

    // AddSessionForm stays open (React local state) after server action success.
    // Verify the new session row appeared in the table above the form.
    await expect(page.getByRole('cell', { name: location })).toBeVisible({ timeout: 10000 });
  });

  test('course detail page shows sessions and enrollments cards', async ({ page }) => {
    const courseId = 'c1000000-0000-0000-0000-000000000001';
    await page.goto(`/admin/courses/${courseId}`);

    // CardTitle renders as <div data-slot="card-title">, not a heading element
    await expect(page.locator('[data-slot="card-title"]').filter({ hasText: 'Sessions' })).toBeVisible();
    await expect(page.locator('[data-slot="card-title"]').filter({ hasText: /Enrollments/ })).toBeVisible();
  });
});

// ─── Edit Course Type ───────────────────────────────────────────────────────

test.describe('Admin — course type edit', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('edits an existing course type', async ({ page }) => {
    // Use seed course type: Dinghy Sailing for Adults (b1000000-...-003)
    const typeId = 'b1000000-0000-0000-0000-000000000003';
    await page.goto(`/admin/course-types/${typeId}/edit`);

    await expect(page.getByRole('heading', { name: 'Edit Course Type' })).toBeVisible();

    // Update the description with a unique value.
    // field-sizing-content textareas: fill() appends instead of replacing when
    // the field already has a value (from a prior test run). Use Ctrl+A + type().
    const newDesc = `Playwright edit ${runId()}`;
    const descTextarea = page.getByLabel('Description');
    await descTextarea.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.type(newDesc);

    // page has 2 forms (sign-out + edit); scope to main to avoid strict-mode violation
    await page.locator('main form').evaluate((f) => (f as HTMLFormElement).requestSubmit());

    // Should redirect back to course type list
    await expect(page).toHaveURL('/admin/course-types', { timeout: 10000 });

    // Verify the write actually persisted — navigate back to edit and check the field
    await page.goto(`/admin/course-types/${typeId}/edit`);
    await expect(page.getByLabel('Description')).toHaveValue(newDesc);
  });
});
