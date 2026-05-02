import { test, expect } from '@playwright/test'
import { loginAs, runId } from './helpers'

test.describe('TimeSelect — add session form', () => {
  test('admin can set start and end time via dropdowns and save session', async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')

    await page.goto('/admin/courses')
    await page.getByRole('link', { name: /ASA 101/i }).first().click()
    await page.waitForURL(/\/admin\/courses\/[^/]+$/)

    const id = runId()
    await page.getByRole('button', { name: '+ Add Session' }).click()

    await page.locator('input[name="date"]').fill('2027-08-01')

    // Start: 8 AM, :30
    const form = page.locator('form').filter({ has: page.locator('button', { hasText: 'Add Session' }) })
    await form.locator('[role="combobox"]').nth(0).click()
    await page.getByRole('option', { name: '8 AM' }).click()
    await form.locator('[role="combobox"]').nth(1).click()
    await page.getByRole('option', { name: '30' }).first().click()

    // End: 4 PM, :00
    await form.locator('[role="combobox"]').nth(2).click()
    await page.getByRole('option', { name: '4 PM' }).click()

    await page.locator('input[name="location"]').fill(`Dock ${id}`)
    await form.getByRole('button', { name: 'Add Session' }).click()

    // fmtTime formats as "8:30am" (lowercase, no space)
    await expect(page.getByText('8:30am – 4:00pm')).toBeVisible({ timeout: 8000 })
  })

  test('admin can edit session time via inline edit row', async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')

    await page.goto('/admin/courses')
    await page.getByRole('link', { name: /ASA 101/i }).first().click()
    await page.waitForURL(/\/admin\/courses\/[^/]+$/)

    // Open first session's edit row
    await page.locator('button[aria-label="Session actions"]').first().click()
    await page.getByRole('menuitem', { name: 'Edit' }).click()

    const editRow = page.locator('tr').filter({ has: page.locator('button', { hasText: 'Save' }) })

    // Change end hour to 6 PM (seed is 5pm, so this is a clear diff)
    await editRow.locator('[role="combobox"]').nth(2).click()
    await page.getByRole('option', { name: '6 PM' }).click()

    await editRow.getByRole('button', { name: 'Save' }).click()

    await expect(editRow).not.toBeVisible({ timeout: 8000 })
    await expect(page.getByText('6:00pm', { exact: false })).toBeVisible()
  })
})
