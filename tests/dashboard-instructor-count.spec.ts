import { test, expect } from '@playwright/test'
import { loginAs, runId } from './helpers'

test.describe('Admin — dashboard instructor count', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
  })

  // Seed has one active course with no instructor (ASA 103 Coastal June)
  test('shows warning card when active courses have no instructor assigned', async ({ page }) => {
    await expect(page.getByText('No Instructor Assigned')).toBeVisible()
    await expect(page.getByText('Assign before publishing')).toBeVisible()
  })

  test('count increments after publishing a course without an instructor', async ({ page }) => {
    // Creates a course — desktop only to avoid parallel viewport interference with the count
    test.skip(test.info().project.name !== 'desktop')

    // Read initial count from warning card
    const initialCount = parseInt(
      (await page
        .getByText('Assign before publishing')
        .locator('xpath=preceding-sibling::p')
        .textContent()) ?? '0'
    )

    // Create an active course with no instructor
    const id = runId()
    await page.goto('/admin/courses/new')
    await page.getByLabel('Course Type').click()
    await page.getByRole('option', { name: /ASA 101.*Basic Keelboat/ }).click()
    await page.getByLabel('Title Override').fill(`Dashboard Count Test ${id}`)
    await page.getByLabel('Capacity').fill('4')
    await page.getByLabel('Price ($)', { exact: true }).fill('250')
    await page.locator('input[type="date"]').fill('2027-11-15')
    await page.locator('input[type="time"]').first().fill('09:00')
    await page.locator('input[type="time"]').nth(1).fill('17:00')
    await page
      .locator('section')
      .filter({ hasText: 'Sessions' })
      .getByPlaceholder(/Dock A/)
      .fill('Test Marina')
    await page.getByRole('button', { name: 'Create Course' }).click({ force: true })
    await page.waitForURL(/\/admin\/courses\/[0-9a-f-]+$/, { timeout: 10000 })
    await page.getByRole('button', { name: 'Publish' }).click()
    await expect(page.getByRole('button', { name: 'Mark Completed' })).toBeVisible({ timeout: 10000 })

    await page.goto('/admin/dashboard')
    const newCount = parseInt(
      (await page
        .getByText('Assign before publishing')
        .locator('xpath=preceding-sibling::p')
        .textContent()) ?? '0'
    )
    expect(newCount).toBeGreaterThanOrEqual(initialCount + 1)
  })

  // DEC-007: session instructor_id NULL means "use course default" — should display
  // "Course default" in the session row select, not blank or "Unassigned"
  test('session instructor select shows "Course default" for sessions with no override', async ({ page }) => {
    // Seed sessions all omit instructor_id (NULL) — navigate to any course with sessions
    await page.goto('/admin/courses/c1000000-0000-0000-0000-000000000001')
    // The session row renders a SessionInstructorSelect — trigger should show "Course default"
    await expect(page.getByText('Course default').first()).toBeVisible()
  })
})
