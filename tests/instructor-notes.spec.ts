import { test, expect } from '@playwright/test'
import { loginAs, createEnrolledCourse } from './helpers'

// Tests for task 1.10 (instructor notes + expanded roster) and
// task 1.23 (student account page).
// Serial: all tests write to pw_student's instructor_notes — parallel runs clobber each other.
test.describe.configure({ mode: 'serial' })

test.describe('student account page', () => {
  test('student can navigate to Account page', async ({ page }) => {
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard')
    await page.goto('/student/account')
    await expect(page.getByRole('heading', { name: 'Account' })).toBeVisible()
  })

  test('account page pre-fills current profile values', async ({ page }) => {
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard')
    await page.goto('/student/account')
    // First and last name should be pre-filled
    const firstName = page.locator('input[name="first_name"]')
    await expect(firstName).toBeVisible()
    const val = await firstName.inputValue()
    expect(val.length).toBeGreaterThan(0)
  })

  test('student can update their name', async ({ page, viewport }) => {
    // Mutation test: skip mobile/tablet to avoid cross-project parallel writes to the same row.
    if ((viewport?.width ?? 1440) < 1024) test.skip()
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard')
    await page.goto('/student/account')
    await page.locator('input[name="first_name"]').fill('PlaywrightFirst')
    await page.locator('input[name="last_name"]').fill('PlaywrightLast')
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByText('Profile updated.')).toBeVisible({ timeout: 5000 })

    // Restore original values (seed: pw_student first/last).
    // "Profile updated." is already visible from the first submit so we can't use it as a
    // completion signal. Instead wait for the button to cycle through "Saving…" → "Save changes"
    // to confirm the second action actually ran.
    await page.locator('input[name="first_name"]').fill('PW')
    await page.locator('input[name="last_name"]').fill('Student')
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByRole('button', { name: 'Saving…' })).toBeVisible({ timeout: 3000 })
    await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible({ timeout: 5000 })
  })

  test('student can set and clear instructor note', async ({ page, viewport }) => {
    // Mutation test: skip mobile/tablet to avoid cross-project parallel writes to the same row.
    // The form is viewport-independent — desktop coverage is sufficient.
    if ((viewport?.width ?? 1440) < 1024) test.skip()
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard')
    await page.goto('/student/account')

    await page.locator('textarea[name="instructor_notes"]').fill('I have a bad knee and cannot sit cross-legged.')
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByText('Profile updated.')).toBeVisible({ timeout: 5000 })

    // Clear it so we don't pollute other tests
    await page.locator('textarea[name="instructor_notes"]').fill('')
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByText('Profile updated.')).toBeVisible({ timeout: 5000 })
  })

  test('student can update ASA number and experience level', async ({ page, viewport }) => {
    // Mutation test: skip mobile/tablet to avoid cross-project parallel writes to the same row.
    if ((viewport?.width ?? 1440) < 1024) test.skip()
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard')
    await page.goto('/student/account')

    await page.locator('input[name="asa_number"]').fill('999888')
    await page.locator('select[name="experience_level"]').selectOption('intermediate')
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByText('Profile updated.')).toBeVisible({ timeout: 5000 })

    // Clear to avoid polluting other tests
    await page.locator('input[name="asa_number"]').fill('')
    await page.locator('select[name="experience_level"]').selectOption('')
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByText('Profile updated.')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('register page — instructor notes field', () => {
  test('register page shows instructor notes textarea', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('textarea[name="instructorNotes"]')).toBeVisible()
  })
})

// Desktop-only: roster and student detail page tests require course/enrollment setup
test.describe('instructor roster — notes indicator', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1440) < 1024, 'Desktop only — course setup')

  test('student note appears on instructor roster and student detail page', async ({ browser }) => {
    test.setTimeout(120000)
    const { courseId, sessionId } = await createEnrolledCourse(browser, {
      title: `Notes Indicator Test ${Math.random().toString(36).slice(2, 6)}`,
    })

    // Assign pw_instructor to the course
    const assignCtx = await browser.newContext()
    const assignPage = await assignCtx.newPage()
    try {
      const res = await assignPage.request.post('http://localhost:3000/api/test/assign-instructor', {
        data: { courseId, instructorEmail: 'pw_instructor@ltsc.test' },
      })
      if (!res.ok()) throw new Error(`assign-instructor failed: ${await res.text()}`)
    } finally {
      await assignCtx.close()
    }

    // Set instructor note as student
    const studentCtx = await browser.newContext()
    const studentPage = await studentCtx.newPage()
    try {
      await loginAs(studentPage, 'pw_student@ltsc.test', '/student/dashboard')
      await studentPage.goto('/student/account')
      await studentPage.locator('textarea[name="instructor_notes"]').fill('Afraid of large waves.')
      await studentPage.getByRole('button', { name: 'Save changes' }).click()
      await expect(studentPage.getByText('Profile updated.')).toBeVisible({ timeout: 5000 })
    } finally {
      await studentCtx.close()
    }

    // Verify dot indicator on instructor session roster
    const instructorCtx = await browser.newContext()
    const instructorPage = await instructorCtx.newPage()
    try {
      await loginAs(instructorPage, 'pw_instructor@ltsc.test', '/instructor/dashboard')
      await instructorPage.goto(`/instructor/sessions/${sessionId}`)
      // The dot is a span with title attr
      await expect(instructorPage.locator('span[title="Student left a note for their instructor"]')).toBeVisible({ timeout: 5000 })

      // Email column should be visible
      await expect(instructorPage.getByRole('columnheader', { name: 'Email' })).toBeVisible()

      // Navigate to student detail — navigate directly by known seed ID to avoid
      // depending on the student's display name (which mutation tests may have changed).
      await instructorPage.goto('/instructor/students/f1000000-0000-0000-0000-000000000003')
      await expect(instructorPage.getByText('Note from student')).toBeVisible({ timeout: 5000 })
      await expect(instructorPage.getByText('Afraid of large waves.')).toBeVisible()
    } finally {
      await instructorCtx.close()
    }

    // Clean up student note
    const cleanupCtx = await browser.newContext()
    const cleanupPage = await cleanupCtx.newPage()
    try {
      await loginAs(cleanupPage, 'pw_student@ltsc.test', '/student/dashboard')
      await cleanupPage.goto('/student/account')
      await cleanupPage.locator('textarea[name="instructor_notes"]').fill('')
      await cleanupPage.getByRole('button', { name: 'Save changes' }).click()
      await expect(cleanupPage.getByText('Profile updated.')).toBeVisible({ timeout: 5000 })
    } finally {
      await cleanupCtx.close()
    }
  })
})
