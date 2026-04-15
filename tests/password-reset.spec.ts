import { test, expect } from '@playwright/test';

test.describe('Forgot password page', () => {
  test('renders form with email input', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByText('Forgot password')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send reset link' })).toBeVisible();
  });

  test('shows confirmation after submit', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByLabel('Email').fill('nobody@example.com');
    await page.getByRole('button', { name: 'Send reset link' }).click();
    await expect(page.getByText('Check your email')).toBeVisible();
    await expect(page.getByText('If an account exists')).toBeVisible();
  });

  test('has back to sign in link', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByRole('link', { name: 'Back to sign in' }).first()).toBeVisible();
  });
});

test.describe('Login page — forgot password link', () => {
  test('shows forgot password link', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: 'Forgot password?' })).toBeVisible();
  });

  test('forgot password link navigates to /forgot-password', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Forgot password?' }).click();
    await expect(page).toHaveURL('/forgot-password');
  });
});

test.describe('Reset password page', () => {
  test('shows verifying state without a token', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.getByText('Reset password')).toBeVisible();
    // Without a valid recovery token the page shows the verifying/waiting state
    await expect(page.getByText('Verifying your reset link')).toBeVisible();
  });
});
