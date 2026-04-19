import { test, expect } from '@playwright/test'
import { createEnrolledCourse, loginAs, runId } from './helpers'

test.describe('Student cancellation request', () => {
  test('student can request cancellation on a confirmed enrollment', async ({ browser }) => {
    test.skip(test.info().project.name !== 'desktop')
    test.setTimeout(90000)

    const { courseId } = await createEnrolledCourse(browser, {
      title: `Cancel Test ${runId()}`,
    })

    const studentCtx = await browser.newContext()
    const studentPage = await studentCtx.newPage()
    try {
      await loginAs(studentPage, 'pw_student@ltsc.test', '/student/dashboard')
      await studentPage.goto(`/student/courses/${courseId}`)

      // "Enrolled" badge and "Request Cancellation" button should be visible
      await expect(studentPage.getByText('Enrolled')).toBeVisible()
      await expect(studentPage.getByRole('button', { name: 'Request Cancellation' })).toBeVisible()

      // Click — confirmation dialog appears
      await studentPage.getByRole('button', { name: 'Request Cancellation' }).click()
      await expect(studentPage.getByRole('alertdialog')).toBeVisible()
      await expect(studentPage.getByText('Request cancellation?')).toBeVisible()

      // Confirm
      await studentPage.getByRole('button', { name: 'Yes, request cancellation' }).click()

      // Page reloads — should show "Cancellation Requested" state
      await expect(studentPage.getByText('Cancellation Requested')).toBeVisible({ timeout: 10000 })
      await expect(studentPage.getByText('Pending admin review')).toBeVisible()
      await expect(studentPage.getByRole('button', { name: 'Request Cancellation' })).not.toBeVisible()
    } finally {
      await studentCtx.close()
    }
  })

  test('cancellation requested enrollment shows badge in course list', async ({ browser }) => {
    test.skip(test.info().project.name !== 'desktop')
    test.setTimeout(90000)

    const { courseId } = await createEnrolledCourse(browser, {
      title: `Cancel List ${runId()}`,
    })

    const studentCtx = await browser.newContext()
    const studentPage = await studentCtx.newPage()
    try {
      await loginAs(studentPage, 'pw_student@ltsc.test', '/student/dashboard')

      // Request cancellation via the detail page
      await studentPage.goto(`/student/courses/${courseId}`)
      await studentPage.getByRole('button', { name: 'Request Cancellation' }).click()
      await studentPage.getByRole('button', { name: 'Yes, request cancellation' }).click()
      await expect(studentPage.getByText('Cancellation Requested')).toBeVisible({ timeout: 10000 })

      // Check the courses list badge
      await studentPage.goto('/student/courses')
      const courseCard = studentPage.locator('[data-testid="course-card"]').filter({ hasText: 'Cancel List' })
      await expect(courseCard.getByText('Cancellation Requested')).toBeVisible()
    } finally {
      await studentCtx.close()
    }
  })
})
