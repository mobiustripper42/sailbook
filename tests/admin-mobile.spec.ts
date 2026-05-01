import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

test.describe('Admin mobile responsiveness', () => {
  test('courses list hides Instructor column at 375px, keeps Course and Status visible', async ({ page }) => {
    test.skip(test.info().project.name !== 'mobile', 'mobile-only')

    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
    await page.goto('/admin/courses')

    await expect(page.getByRole('columnheader', { name: 'Course' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Instructor' })).not.toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Price' })).not.toBeVisible()
  })

  test('users list hides Email column at 375px, keeps Name visible', async ({ page }) => {
    test.skip(test.info().project.name !== 'mobile', 'mobile-only')

    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
    await page.goto('/admin/users')

    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Email' })).not.toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Roles' })).toBeVisible()
  })
})
