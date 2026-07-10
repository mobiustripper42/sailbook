import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

const ADMIN_EMAIL = 'pw_admin@ltsc.test'

test.describe('Admin /users page — sorting', () => {
  test('Name column sorts ascending then descending on click', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop')

    await loginAs(page, ADMIN_EMAIL, '/admin/dashboard')
    await page.goto('/admin/users')
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()

    const nameHead = page.getByRole('columnheader', { name: /Name/ })
    const sortButton = nameHead.getByRole('button', { name: /Name/ })

    // Default state: sorted by name ascending
    await expect(nameHead).toHaveAttribute('aria-sort', 'ascending')

    // Capture row order in default (ascending) state
    const ascNames = await page.locator('tbody tr td:first-child').allTextContents()

    // Click toggles to descending
    await sortButton.click()
    await expect(nameHead).toHaveAttribute('aria-sort', 'descending')
    const descNames = await page.locator('tbody tr td:first-child').allTextContents()

    // Same set of names, reversed order
    expect(descNames).toEqual([...ascNames].reverse())
  })

  test('clicking Email header sets aria-sort on Email and clears Name', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop')

    await loginAs(page, ADMIN_EMAIL, '/admin/dashboard')
    await page.goto('/admin/users')

    const nameHead = page.getByRole('columnheader', { name: /Name/ })
    const emailHead = page.getByRole('columnheader', { name: /Email/ })

    await emailHead.getByRole('button', { name: /Email/ }).click()

    await expect(emailHead).toHaveAttribute('aria-sort', 'ascending')
    await expect(nameHead).toHaveAttribute('aria-sort', 'none')
  })
})

test.describe('Admin /users page — student name links to profile', () => {
  test('clicking a student name opens their profile with course history, not the edit form', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop')

    await loginAs(page, ADMIN_EMAIL, '/admin/dashboard')
    await page.goto('/admin/users')

    // Narrow to students so the first name link is guaranteed to be one
    await page.getByRole('button', { name: 'Student', exact: true }).click()

    const firstStudentName = page.locator('tbody tr td:first-child a').first()
    await expect(firstStudentName).toBeVisible()
    await firstStudentName.click()

    // Lands on the profile page (/admin/students/<uuid>), NOT the edit form
    await page.waitForURL(/\/admin\/students\/[0-9a-f-]+$/)
    await expect(page).not.toHaveURL(/\/edit$/)
    await expect(page.getByRole('heading', { name: 'Course History' })).toBeVisible()

    // Edit is still one tap away from the profile
    await expect(page.getByRole('link', { name: 'Edit' })).toBeVisible()
  })
})

test.describe('Admin /users page — invite panels', () => {
  test('admin and instructor invite panels are collapsed by default', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop')

    await loginAs(page, ADMIN_EMAIL, '/admin/dashboard')
    await page.goto('/admin/users')

    await expect(page.getByText('Admin invites', { exact: true })).toBeVisible()
    await expect(page.getByText('Instructor invites', { exact: true })).toBeVisible()

    // Inner panel CardTitle is hidden until <details> is expanded
    await expect(page.getByText('Admin invite link', { exact: true })).not.toBeVisible()
    await expect(page.getByText('Instructor invite link', { exact: true })).not.toBeVisible()
  })

  test('expanding the admin panel reveals the generate/regenerate button', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop')

    await loginAs(page, ADMIN_EMAIL, '/admin/dashboard')
    await page.goto('/admin/users')

    await page.getByText('Admin invites', { exact: true }).click()

    await expect(page.getByText('Admin invite link', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: /Generate link|Regenerate link/ })).toBeVisible()
  })
})
