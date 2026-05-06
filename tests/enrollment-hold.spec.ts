import { test, expect } from '@playwright/test'
import { createTestCourse, loginAs } from './helpers'

test.describe('enrollment hold expiry', () => {
  test('expired hold: student sees Register & Pay instead of dead-end badge', async ({ browser }) => {
    test.skip(test.info().project.name !== 'desktop')
    // Create a course, seed an expired hold for pw_student
    const adminCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    let courseId: string
    try {
      courseId = await createTestCourse(adminPage, { capacity: 4, title: `Hold Expired ${Math.random().toString(36).slice(2, 7)}` })
    } finally {
      await adminCtx.close()
    }

    // Seed an expired pending_payment hold
    const apiCtx = await browser.newContext()
    const apiPage = await apiCtx.newPage()
    try {
      const res = await apiPage.request.post('http://localhost:3000/api/test/set-pending-hold', {
        data: { courseId, studentEmail: 'pw_student@ltsc.test', expired: true },
      })
      expect(res.ok()).toBeTruthy()
    } finally {
      await apiCtx.close()
    }

    // Student visits course page — should see "Register & Pay", not a dead-end badge
    const studentCtx = await browser.newContext()
    const studentPage = await studentCtx.newPage()
    try {
      await loginAs(studentPage, 'pw_student@ltsc.test', '/student/dashboard')
      await studentPage.goto(`/student/courses/${courseId}`)
      await expect(studentPage.getByRole('button', { name: 'Register & Pay' })).toBeVisible()
      await expect(studentPage.getByText('Payment pending')).not.toBeVisible()
    } finally {
      await studentCtx.close()
    }
  })

  test('active hold: student sees Resume Payment button with hold time remaining', async ({ browser }) => {
    test.skip(test.info().project.name !== 'desktop')
    const adminCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    let courseId: string
    try {
      courseId = await createTestCourse(adminPage, { capacity: 4, title: `Hold Active ${Math.random().toString(36).slice(2, 7)}` })
    } finally {
      await adminCtx.close()
    }

    const apiCtx = await browser.newContext()
    const apiPage = await apiCtx.newPage()
    try {
      const res = await apiPage.request.post('http://localhost:3000/api/test/set-pending-hold', {
        data: { courseId, studentEmail: 'pw_student@ltsc.test', expired: false },
      })
      expect(res.ok()).toBeTruthy()
    } finally {
      await apiCtx.close()
    }

    const studentCtx = await browser.newContext()
    const studentPage = await studentCtx.newPage()
    try {
      await loginAs(studentPage, 'pw_student@ltsc.test', '/student/dashboard')
      await studentPage.goto(`/student/courses/${courseId}`)
      await expect(studentPage.getByRole('button', { name: 'Resume Payment' })).toBeVisible()
      await expect(studentPage.getByText(/Your spot is held for/)).toBeVisible()
    } finally {
      await studentCtx.close()
    }
  })

  test('active hold blocks second student on a full course', async ({ browser }) => {
    test.skip(test.info().project.name !== 'desktop')

    // Capacity-1 course so a single active hold makes it full
    const adminCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    let courseId: string
    try {
      courseId = await createTestCourse(adminPage, { capacity: 1, title: `Hold Blocks ${Math.random().toString(36).slice(2, 7)}` })
    } finally {
      await adminCtx.close()
    }

    // Seed an active hold for pw_student (occupies the only seat)
    const apiCtx = await browser.newContext()
    const apiPage = await apiCtx.newPage()
    try {
      const res = await apiPage.request.post('http://localhost:3000/api/test/set-pending-hold', {
        data: { courseId, studentEmail: 'pw_student@ltsc.test', expired: false },
      })
      expect(res.ok()).toBeTruthy()
    } finally {
      await apiCtx.close()
    }

    // pw_student2 visits the course — should see Course Full, not Register & Pay
    const student2Ctx = await browser.newContext()
    const student2Page = await student2Ctx.newPage()
    try {
      await loginAs(student2Page, 'pw_student2@ltsc.test', '/student/dashboard')
      await student2Page.goto(`/student/courses/${courseId}`)
      // Per 5.7: full course replaces "Course Full" disabled button with "Join waitlist" CTA.
      await expect(student2Page.getByRole('button', { name: 'Join waitlist' })).toBeVisible()
      await expect(student2Page.getByRole('button', { name: 'Register & Pay' })).not.toBeVisible()
    } finally {
      await student2Ctx.close()
    }
  })

  test('cron endpoint expires pending_payment holds past their expiry', async ({ browser, request }) => {
    test.skip(test.info().project.name !== 'desktop')

    // Create course and seed an expired hold
    const adminCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    let courseId: string
    try {
      courseId = await createTestCourse(adminPage, { capacity: 4, title: `Cron Expiry ${Math.random().toString(36).slice(2, 7)}` })
    } finally {
      await adminCtx.close()
    }

    const apiCtx = await browser.newContext()
    const apiPage = await apiCtx.newPage()
    try {
      const res = await apiPage.request.post('http://localhost:3000/api/test/set-pending-hold', {
        data: { courseId, studentEmail: 'pw_student@ltsc.test', expired: true },
      })
      expect(res.ok()).toBeTruthy()
    } finally {
      await apiCtx.close()
    }

    // Fire the cron endpoint — verifyCron() requires the bearer when CRON_SECRET is set (CI does)
    const cronSecret = process.env.CRON_SECRET
    const cronRes = await request.get('http://localhost:3000/api/cron/expire-holds', {
      headers: cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {},
    })
    expect(cronRes.ok()).toBeTruthy()
    const body = await cronRes.json() as { expired: number }
    expect(body.expired).toBeGreaterThanOrEqual(1)

    // Student should now see Register & Pay — hold was cleaned up
    const studentCtx = await browser.newContext()
    const studentPage = await studentCtx.newPage()
    try {
      await loginAs(studentPage, 'pw_student@ltsc.test', '/student/dashboard')
      await studentPage.goto(`/student/courses/${courseId}`)
      await expect(studentPage.getByRole('button', { name: 'Register & Pay' })).toBeVisible()
      await expect(studentPage.getByText('Payment pending')).not.toBeVisible()
    } finally {
      await studentCtx.close()
    }
  })
})
