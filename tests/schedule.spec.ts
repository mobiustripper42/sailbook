import { test, expect } from '@playwright/test'
import { createTestCourse, loginAs, runId } from './helpers'

// Task 10.3 — consolidated admin Schedule: default date order (#140) + type legend.
test.describe('Admin schedule', () => {
  test.beforeEach(() => {
    test.skip(test.info().project.name !== 'desktop')
  })

  test('List view defaults to session-date order, not title/created order (#140)', async ({
    browser,
  }) => {
    test.setTimeout(120000)
    const id = runId()
    // Alphabetically "Zzz" > "Aaa": if the list were title-sorted, the late
    // course (Aaa) would come first. Date order must put the earlier session
    // (Zzz, August) above the later one (Aaa, October).
    const earlyTitle = `Order-${id}-Zzz-early`
    const lateTitle = `Order-${id}-Aaa-late`

    const ctxE = await browser.newContext()
    const pageE = await ctxE.newPage()
    await createTestCourse(pageE, { capacity: 4, title: earlyTitle, sessionDate: '2027-08-05' })
    await ctxE.close()

    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    // createTestCourse leaves `page` admin-authed; a second loginAs would just
    // redirect away (non-idempotent). Go straight to the schedule.
    await createTestCourse(page, { capacity: 4, title: lateTitle, sessionDate: '2027-10-05' })
    await page.goto('/admin/schedule')
    await page.getByTestId('view-toggle-list').click()
    await page.getByPlaceholder('Search by title, type, or instructor…').fill(`Order-${id}`)

    const earlyLink = page.getByRole('link', { name: earlyTitle })
    const lateLink = page.getByRole('link', { name: lateTitle })
    await expect(earlyLink).toBeVisible()
    await expect(lateLink).toBeVisible()

    const earlyBox = await earlyLink.boundingBox()
    const lateBox = await lateLink.boundingBox()
    expect(earlyBox!.y).toBeLessThan(lateBox!.y)

    await ctx.close()
  })

  test('Month view shows a course-type hue legend', async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
    await page.goto('/admin/schedule')
    await page.waitForLoadState('networkidle')
    // Month is the default view; the legend lists the course types present.
    await expect(page.getByTestId('calendar-legend')).toBeVisible()
  })
})
