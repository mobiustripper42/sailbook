import { test, expect } from '@playwright/test'
import { createTestCourse, loginAs, runId } from './helpers'

test.describe('Admin courses list — search, filter, sort', () => {
  test.describe.configure({ mode: 'serial' })

  let courseId: string
  const title = `CourseList ${runId()}`

  test.beforeAll(async ({ browser }) => {
    const adminCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    try {
      courseId = await createTestCourse(adminPage, { title, capacity: 4 })
    } finally {
      await adminCtx.close()
    }
  })

  test('search filters by title', async ({ browser }) => {
    test.skip(test.info().project.name !== 'desktop')
    test.setTimeout(60000)

    const adminCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    try {
      await loginAs(adminPage, 'pw_admin@ltsc.test', '/admin/dashboard')
      await adminPage.goto('/admin/courses')

      // Search for the unique title
      await adminPage.getByPlaceholder('Search by title, type, or instructor…').fill(title)
      await expect(adminPage.getByRole('link', { name: title })).toBeVisible()

      // Search for something that won't match — table empties
      await adminPage.getByPlaceholder('Search by title, type, or instructor…').fill('zzz_no_match_xyz')
      await expect(adminPage.getByText('No courses match your filters.')).toBeVisible()
    } finally {
      await adminCtx.close()
    }
  })

  test('status filter shows only matching courses', async ({ browser }) => {
    test.skip(test.info().project.name !== 'desktop')
    test.setTimeout(60000)

    const adminCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    try {
      await loginAs(adminPage, 'pw_admin@ltsc.test', '/admin/dashboard')
      await adminPage.goto('/admin/courses')

      // The test course is published (active) by createTestCourse
      await adminPage.getByRole('button', { name: 'Active' }).click()
      await expect(adminPage.getByRole('link', { name: title })).toBeVisible()

      // Draft filter should hide the active course
      await adminPage.getByRole('button', { name: 'Draft' }).click()
      await expect(adminPage.getByRole('link', { name: title })).not.toBeVisible()

      // All restores it
      await adminPage.getByRole('button', { name: 'All' }).click()
      await expect(adminPage.getByRole('link', { name: title })).toBeVisible()
    } finally {
      await adminCtx.close()
    }
  })

  test('sort by course name toggles asc/desc', async ({ browser }) => {
    test.skip(test.info().project.name !== 'desktop')
    test.setTimeout(60000)

    const adminCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    try {
      await loginAs(adminPage, 'pw_admin@ltsc.test', '/admin/dashboard')
      await adminPage.goto('/admin/courses')

      // Click Course header once → ascending indicator
      const courseHeader = adminPage.getByRole('columnheader', { name: /Course/ })
      await courseHeader.getByRole('button').click()
      await expect(courseHeader.getByText('↑')).toBeVisible()

      // Click again → descending indicator
      await courseHeader.getByRole('button').click()
      await expect(courseHeader.getByText('↓')).toBeVisible()
    } finally {
      await adminCtx.close()
    }
  })

  test('sort by status', async ({ browser }) => {
    test.skip(test.info().project.name !== 'desktop')
    test.setTimeout(60000)

    const adminCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    try {
      await loginAs(adminPage, 'pw_admin@ltsc.test', '/admin/dashboard')
      await adminPage.goto('/admin/courses')

      const statusHeader = adminPage.getByRole('columnheader', { name: /Status/ })
      await statusHeader.getByRole('button').click()
      await expect(statusHeader.getByText('↑')).toBeVisible()
    } finally {
      await adminCtx.close()
    }
  })

  test.afterAll(async ({ browser }) => {
    // Cleanup: nothing to do — test courses are left for manual inspection
    void courseId
    void browser
  })
})
