import { test, expect, type Page } from '@playwright/test'
import { loginAs, runId, selectTime, clickCourseAction } from './helpers'

// Reads the count off the "Courses unassigned" triage card (the big number that
// leads the card's text). Returns 0 when the card isn't present (all assigned).
async function unassignedTriageCount(page: Page): Promise<number> {
  const card = page.getByRole('link').filter({ hasText: /Courses? unassigned/ })
  if ((await card.count()) === 0) return 0
  const match = (await card.first().innerText()).match(/\d+/)
  return match ? parseInt(match[0], 10) : 0
}

test.describe('Admin — dashboard instructor count', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
  })

  // Seed has one active course with no instructor (ASA 103 Coastal June).
  // 10.5: the old "No Instructor Assigned" stat card became a "Courses
  // unassigned" triage card in the "Needs you" board.
  test('shows a "Courses unassigned" triage card when active courses lack an instructor', async ({ page }) => {
    await expect(page.getByText(/Courses? unassigned/)).toBeVisible()
    await expect(page.getByText('Assign instructor →')).toBeVisible()
  })

  test('count increments after publishing a course without an instructor', async ({ page }) => {
    // Creates a course — desktop only to avoid parallel viewport interference with the count
    test.skip(test.info().project.name !== 'desktop')

    const initialCount = await unassignedTriageCount(page)

    // Create an active course with no instructor
    const id = runId()
    await page.goto('/admin/courses/new')
    await page.getByLabel('Course Type').click()
    await page.getByRole('option', { name: /ASA 101.*Basic Keelboat/ }).click()
    await page.getByLabel('Title Override').fill(`Dashboard Count Test ${id}`)
    await page.getByLabel('Capacity').fill('4')
    await page.getByLabel('Price ($)', { exact: true }).fill('250')
    await page.locator('input[type="date"]').fill('2027-11-15')
    await selectTime(page, 'session_start_0', '09:00')
    await selectTime(page, 'session_end_0', '17:00')
    await page
      .locator('section')
      .filter({ hasText: 'Sessions' })
      .getByPlaceholder(/Dock A/)
      .fill('Test Marina')
    await page.getByRole('button', { name: 'Create Course' }).click({ force: true })
    await page.waitForURL(/\/admin\/courses\/[0-9a-f-]+$/, { timeout: 10000 })
    await clickCourseAction(page, 'Publish')
    await expect(page.getByText('active')).toBeVisible({ timeout: 10000 })

    await page.goto('/admin/dashboard')
    const newCount = await unassignedTriageCount(page)
    expect(newCount).toBeGreaterThanOrEqual(initialCount + 1)
  })

  // DEC-007: session instructor_id NULL means "use course default" — should display
  // "Course default" in the session row select, not blank or "Unassigned"
  test('session instructor select shows "Course default" for sessions with no override', async ({ page }) => {
    test.skip(test.info().project.name === 'mobile', 'Instructor column hidden on mobile — select not visible')
    // Seed sessions all omit instructor_id (NULL) — navigate to any course with sessions
    await page.goto('/admin/courses/c1000000-0000-0000-0000-000000000001')
    // The session row renders a SessionInstructorSelect — trigger should show "Course default".
    // After 6.24 the select also renders inside the mobile card (md:hidden) — scope to the
    // visible desktop table to avoid matching the hidden mobile instance.
    await expect(page.locator('table').getByText('Course default').first()).toBeVisible()
  })
})
