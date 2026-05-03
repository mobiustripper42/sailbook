import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';
import { runAxe, criticalOrSerious, formatViolations } from './a11y-helpers';

// Audits run on the desktop project only — viewport-specific issues are caught
// by the existing 375px responsive tests, and running axe across 3 projects
// would 3x the test runtime without finding distinct WCAG violations.
test.describe('Accessibility — public pages', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'desktop-only audit');
  });

  test('login page', async ({ page }) => {
    await page.goto('/login');
    const results = await runAxe(page);
    const issues = criticalOrSerious(results.violations);
    expect(issues, formatViolations(issues)).toEqual([]);
  });

  test('register page', async ({ page }) => {
    await page.goto('/register');
    const results = await runAxe(page);
    const issues = criticalOrSerious(results.violations);
    expect(issues, formatViolations(issues)).toEqual([]);
  });

  test('forgot-password page', async ({ page }) => {
    await page.goto('/forgot-password');
    const results = await runAxe(page);
    const issues = criticalOrSerious(results.violations);
    expect(issues, formatViolations(issues)).toEqual([]);
  });

  test('public course catalog', async ({ page }) => {
    await page.goto('/courses');
    const results = await runAxe(page);
    const issues = criticalOrSerious(results.violations);
    expect(issues, formatViolations(issues)).toEqual([]);
  });

  test('public course page', async ({ page }) => {
    // Use ASA 101 — known seed slug
    await page.goto('/courses/asa101');
    const results = await runAxe(page);
    const issues = criticalOrSerious(results.violations);
    expect(issues, formatViolations(issues)).toEqual([]);
  });
});

test.describe('Accessibility — admin pages', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'desktop-only audit');
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
  });

  test('admin dashboard', async ({ page }) => {
    const results = await runAxe(page);
    const issues = criticalOrSerious(results.violations);
    expect(issues, formatViolations(issues)).toEqual([]);
  });

  test('admin courses list', async ({ page }) => {
    await page.goto('/admin/courses');
    const results = await runAxe(page);
    const issues = criticalOrSerious(results.violations);
    expect(issues, formatViolations(issues)).toEqual([]);
  });

  test('admin course detail', async ({ page }) => {
    await page.goto('/admin/courses/c1000000-0000-0000-0000-000000000001');
    const results = await runAxe(page);
    const issues = criticalOrSerious(results.violations);
    expect(issues, formatViolations(issues)).toEqual([]);
  });

  test('admin users list', async ({ page }) => {
    await page.goto('/admin/users');
    const results = await runAxe(page);
    const issues = criticalOrSerious(results.violations);
    expect(issues, formatViolations(issues)).toEqual([]);
  });

  test('admin user edit', async ({ page }) => {
    await page.goto('/admin/users/a1000000-0000-0000-0000-000000000005/edit');
    const results = await runAxe(page);
    const issues = criticalOrSerious(results.violations);
    expect(issues, formatViolations(issues)).toEqual([]);
  });

  test('admin calendar', async ({ page }) => {
    await page.goto('/admin/calendar');
    const results = await runAxe(page);
    const issues = criticalOrSerious(results.violations);
    expect(issues, formatViolations(issues)).toEqual([]);
  });
});

test.describe('Accessibility — student pages', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'desktop-only audit');
    await loginAs(page, 'sam@ltsc.test', '/student/dashboard');
  });

  test('student dashboard', async ({ page }) => {
    const results = await runAxe(page);
    const issues = criticalOrSerious(results.violations);
    expect(issues, formatViolations(issues)).toEqual([]);
  });

  test('student courses', async ({ page }) => {
    await page.goto('/student/courses');
    const results = await runAxe(page);
    const issues = criticalOrSerious(results.violations);
    expect(issues, formatViolations(issues)).toEqual([]);
  });

  test('student account', async ({ page }) => {
    await page.goto('/student/account');
    const results = await runAxe(page);
    const issues = criticalOrSerious(results.violations);
    expect(issues, formatViolations(issues)).toEqual([]);
  });
});
