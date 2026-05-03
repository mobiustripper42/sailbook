import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

// ─── /dev/ltsc mock page ─────────────────────────────────────────────────────

test.describe('LTSC mock page', () => {
  test('shows active course types with Select options links', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop')
    await page.goto('/dev/ltsc')
    await expect(page.getByText('ASA 101 - Basic Keelboat Sailing')).toBeVisible()
    await expect(page.getByText('ASA 103 - Basic Coastal Cruising')).toBeVisible()
    // Inactive course type must not appear
    await expect(page.getByText('Advanced Racing')).not.toBeVisible()
  })

  test('Select options links to public course page', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop')
    await page.goto('/dev/ltsc')
    const links = page.getByRole('link', { name: 'Select options' })
    const href = await links.first().getAttribute('href')
    expect(href).toMatch(/^\/courses\//)
  })
})

// ─── Public course page (unauthenticated) ────────────────────────────────────

test.describe('Public course page — unauthenticated', () => {
  test('shows ASA 101 course type info and upcoming sections', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop')
    await page.goto('/courses/asa101')
    await expect(page.getByRole('heading', { name: /ASA 101/i })).toBeVisible()
    await expect(page.getByText('ASA101')).toBeVisible()
    await expect(page.getByText('Upcoming sections')).toBeVisible()
    await expect(page.getByText('ASA 101 - Weekend Intensive (May)')).toBeVisible()
    await expect(page.getByText('ASA 101 - Evening Series (May)')).toBeVisible()
  })

  test('404 on unknown slug', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop')
    const resp = await page.goto('/courses/not-a-real-course')
    expect(resp?.status()).toBe(404)
  })

  test('Enroll button links to login with next param', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop')
    await page.goto('/courses/asa101')
    const enrollBtn = page.getByRole('link', { name: 'Enroll →' }).first()
    const href = await enrollBtn.getAttribute('href')
    expect(href).toMatch(/^\/login\?next=\/student\/courses\//)
  })

  test('inactive course type returns 404', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop')
    const resp = await page.goto('/courses/race')
    expect(resp?.status()).toBe(404)
  })

  test('breadcrumb links back to course catalog', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop')
    await page.goto('/courses/asa101')
    const breadcrumb = page.getByRole('link', { name: 'Courses' })
    await expect(breadcrumb).toBeVisible()
    const href = await breadcrumb.getAttribute('href')
    expect(href).toBe('/courses')
  })

  test('header shows Create account + Log in when unauthenticated', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop')
    await page.goto('/courses/asa101')
    const header = page.locator('header')
    await expect(header.getByRole('link', { name: 'Create account' })).toBeVisible()
    await expect(header.getByRole('link', { name: 'Log in' })).toBeVisible()
    await expect(header.getByRole('link', { name: 'Dashboard' })).toHaveCount(0)
  })
})

test.describe('Public layout — authenticated header', () => {
  test('shows Dashboard link instead of Login/Create when student is signed in', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop')
    await loginAs(page, 'pw_student@ltsc.test', '/student/dashboard')
    await page.goto('/courses/asa101')
    const header = page.locator('header')
    const dashboard = header.getByRole('link', { name: 'Dashboard' })
    await expect(dashboard).toBeVisible()
    expect(await dashboard.getAttribute('href')).toBe('/student/dashboard')
    await expect(header.getByRole('link', { name: 'Create account' })).toHaveCount(0)
    await expect(header.getByRole('link', { name: 'Log in' })).toHaveCount(0)
  })

  test('routes admin Dashboard CTA to /admin/dashboard', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop')
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard')
    await page.goto('/courses/asa101')
    const dashboard = page.locator('header').getByRole('link', { name: 'Dashboard' })
    expect(await dashboard.getAttribute('href')).toBe('/admin/dashboard')
  })
})

// ─── Full LTSC inbound flow ───────────────────────────────────────────────────

test.describe('LTSC inbound flow', () => {
  test('mock LTSC → public course page → login → student course detail', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop')

    // Start unauthenticated at mock LTSC page
    await page.goto('/dev/ltsc')
    const selectBtn = page.getByRole('link', { name: 'Select options' }).first()
    await selectBtn.click()

    // Should land on a public /courses/[slug] page
    await expect(page).toHaveURL(/\/courses\//)
    await expect(page.getByText('Upcoming sections')).toBeVisible()

    // Click Enroll → should redirect to login
    const enrollBtn = page.getByRole('link', { name: 'Enroll →' }).first()
    const href = await enrollBtn.getAttribute('href')
    expect(href).toMatch(/^\/login\?next=\/student\/courses\//)
    await enrollBtn.click()

    // Should be on login page
    await expect(page).toHaveURL(/\/login/)

    // Log in — fill from current /login?next=... page so the redirect fires
    await page.getByLabel('Email').fill('pw_student@ltsc.test')
    await page.getByLabel('Password').fill('Sailbook12345')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // After login with ?next= param, should land on the student course detail page
    await expect(page).toHaveURL(/\/student\/courses\//, { timeout: 10000 })
    await expect(page.getByRole('link', { name: '← Back to courses' })).toBeVisible()
  })
})
