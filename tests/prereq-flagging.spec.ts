import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

const ASA_103_COURSE_ID = 'c1000000-0000-0000-0000-000000000003'
const ASA_101_COURSE_ID = 'c1000000-0000-0000-0000-000000000001'
const DINGHY_TYPE_ID = 'b1000000-0000-0000-0000-000000000003'

test.describe('Prerequisite flagging — student warning banner', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'desktop-only')
  })

  test('shows warning when student has no prereq on record', async ({ page }) => {
    // pw_student has no seeded enrollments → missing ASA 101
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard')
    await page.goto(`/student/courses/${ASA_103_COURSE_ID}`)
    const banner = page.getByTestId('prereq-warning')
    await expect(banner).toBeVisible()
    await expect(banner).toContainText('Prerequisite not on record')
    await expect(banner).toContainText('ASA 101')
  })

  test('no warning on a course type with no prereqs', async ({ page }) => {
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard')
    await page.goto(`/student/courses/${ASA_101_COURSE_ID}`)
    await expect(page.getByTestId('prereq-warning')).toHaveCount(0)
  })
})

test.describe('Prerequisite flagging — admin manages prereqs', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'desktop-only')
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
  })

  test('admin can add and remove a prerequisite', async ({ page }) => {
    await page.goto(`/admin/course-types/${DINGHY_TYPE_ID}/edit`)

    await expect(page.getByRole('heading', { name: 'Prerequisites' })).toBeVisible()
    await expect(page.getByText('No prerequisites set.')).toBeVisible()

    // Add ASA 101 as a prereq
    await page.getByRole('combobox').filter({ hasText: /Add a prerequisite/i }).click()
    await page.getByRole('option', { name: /ASA101/ }).click()
    await page.getByRole('button', { name: 'Add' }).click()

    // Now visible in the list
    const prereqList = page.locator('ul li').filter({ hasText: 'ASA 101' })
    await expect(prereqList).toBeVisible()

    // Remove it
    await prereqList.getByRole('button', { name: 'Remove' }).click()
    await expect(page.getByText('No prerequisites set.')).toBeVisible()
  })
})
