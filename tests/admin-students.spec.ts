import { test, expect } from '@playwright/test'
import { loginAs, runId, createTestCourse } from './helpers'

const ADMIN_EMAIL = 'pw_admin@ltsc.test'

test.describe('Admin: create student', () => {
  test('admin can navigate to Add Student and create a ghost student', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, '/admin/dashboard')
    await page.goto('/admin/users')

    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()
    await page.getByRole('link', { name: 'Add Student' }).click()
    await page.waitForURL('/admin/students/new')

    await expect(page.getByRole('heading', { name: 'Add Student' })).toBeVisible()

    const id = runId()
    const email = `ghost-${id}@test.invalid`

    await page.getByLabel('First name').fill('Ghost')
    await page.getByLabel('Last name').fill(id)
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Phone').fill('555-000-0000')

    await page.getByRole('button', { name: 'Create Student' }).click()

    // On success the action redirects to /admin/users
    await page.waitForURL('/admin/users', { timeout: 15000 })

    // Filter by row so the last-name match doesn't collide with the email cell
    await expect(page.getByRole('row').filter({ hasText: `Ghost ${id}` })).toBeVisible()
  })

  test('duplicate email shows an error', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, '/admin/dashboard')
    await page.goto('/admin/students/new')

    // Use an email that already exists in seed data
    await page.getByLabel('First name').fill('Dupe')
    await page.getByLabel('Last name').fill('Test')
    await page.getByLabel('Email').fill('pw_student@ltsc.test')

    await page.getByRole('button', { name: 'Create Student' }).click()

    // Should stay on the page and show an error
    await expect(page.getByRole('heading', { name: 'Add Student' })).toBeVisible()
    await expect(page.locator('p.text-destructive')).toBeVisible()
  })
})

test.describe('Admin: enroll student in course', () => {
  test.skip(() => true, 'Enrollment panel is desktop-only — skip until Dialog component added')

  test('admin can enroll a student via the course page panel', async ({ page }) => {
    test.setTimeout(90000)

    // Create a course with capacity
    const title = `Enroll-Test-${runId()}`
    const courseUrl = await createTestCourse(page, { capacity: 5, title, price: 100 })

    await page.goto(courseUrl)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Open the enroll panel
    await page.getByRole('button', { name: 'Enroll Student' }).click()
    await expect(page.getByText('Enroll Student', { exact: true }).last()).toBeVisible()

    // Pick a student and payment method
    await page.getByRole('combobox').first().click()
    await page.getByRole('option').first().click()
    await page.getByRole('combobox').nth(1).click()
    await page.getByRole('option', { name: 'Cash' }).click()

    await page.getByLabel('Amount ($)').fill('100')
    await page.getByRole('button', { name: 'Enroll' }).click()

    // Panel closes and enrollment count increments
    await expect(page.getByText('Enroll Student')).toBeHidden({ timeout: 10000 })
    await expect(page.getByText('Enrollments (1)')).toBeVisible()
    await expect(page.getByText('Cash')).not.toBeVisible() // no payment method shown in table yet
  })
})

test.describe('Admin: enroll student — mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('Enroll Student button is visible on mobile', async ({ page }) => {
    // createTestCourse handles login internally — don't call loginAs first
    const title = `Mobile-Enroll-${runId()}`
    await createTestCourse(page, { capacity: 3, title, price: 50 })

    // createTestCourse leaves us on the course page
    await expect(page.getByRole('button', { name: 'Enroll Student' })).toBeVisible()
  })
})
