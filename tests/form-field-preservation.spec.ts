import { test, expect, type Page } from '@playwright/test'
import { loginAs, runId } from './helpers'

async function loginAsAdmin(page: Page) {
  await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
}

test.describe('Form field preservation on server action error', () => {
  test('course type form preserves field values after duplicate short_code error', async ({ page }) => {
    await loginAsAdmin(page)

    const id = runId()
    const typeName = `Preservation Test ${id}`
    const description = 'Test description that should survive the error'

    await page.goto('/admin/course-types/new')

    // Fill in the form with recognisable values
    await page.getByLabel('Name').fill(typeName)
    // ASA101 already exists in seed — deliberate duplicate to trigger error
    await page.getByLabel('Short Code').fill('ASA101')
    await page.getByLabel('Max Students').fill('6')
    await page.getByLabel('Description').fill(description)

    // Fill slug with something unique so the slug constraint doesn't race
    const slugInput = page.locator('input[name="slug"]')
    await slugInput.fill(`test-slug-${id}`)

    await page.getByRole('button', { name: 'Create' }).click()

    // Error message should appear
    await expect(page.locator('.text-destructive').first()).toBeVisible()

    // All field values must still be present — the form did not reset
    await expect(page.getByLabel('Name')).toHaveValue(typeName)
    await expect(page.getByLabel('Short Code')).toHaveValue('ASA101')
    await expect(page.getByLabel('Max Students')).toHaveValue('6')
    await expect(page.getByLabel('Description')).toHaveValue(description)
  })

  test('student account form preserves field values after server error', async ({ page }) => {
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard')
    await page.goto('/student/account')

    // A 2001-char note exceeds the server's 2000-char cap and returns an error
    // without browser validation blocking the submission.
    await page.getByLabel('ASA number').fill('TESTASA999')
    await page.locator('textarea[name="instructor_notes"]').fill('x'.repeat(2001))
    await page.getByRole('button', { name: 'Save changes' }).click()

    // Error shown — ASA number should still be present
    await expect(page.locator('.text-destructive').first()).toBeVisible()
    await expect(page.getByLabel('ASA number')).toHaveValue('TESTASA999')
  })
})
