import type { Page } from '@playwright/test';

/** Shared password for all test users (admin, instructor, student, demo users). */
export const PASSWORD = 'qwert12345';

/**
 * Log in as any test user and wait for the post-login redirect.
 *
 * Requires a fresh browser context — if the page is already authenticated,
 * navigating to /login will redirect to the existing session's dashboard.
 * Create a new context (`browser.newContext()`) before calling this when
 * switching users mid-test.
 */
export async function loginAs(
  page: Page,
  email: string,
  dashboardUrl: string | RegExp
): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(dashboardUrl, { timeout: 10000 });
}

/**
 * Returns a random 6-char alphanumeric suffix.
 * Use in test data names to avoid unique-constraint failures on re-runs
 * without a `supabase db reset`.
 */
export function runId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
