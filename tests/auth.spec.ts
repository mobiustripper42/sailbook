import { test, expect, type Page } from '@playwright/test';

const PASSWORD = 'Sailbook12345';

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  // Wait for Server Action redirect to settle before returning
  await page.waitForURL(/\/(admin|instructor|student)\/dashboard/, { timeout: 10000 });
}

test.describe('Auth — role routing', () => {
  test('admin lands on /admin/dashboard', async ({ page }) => {
    await login(page, 'andy@ltsc.test', PASSWORD);
    await expect(page).toHaveURL('/admin/dashboard');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('instructor lands on /instructor/dashboard', async ({ page }) => {
    await login(page, 'mike@ltsc.test', PASSWORD);
    await expect(page).toHaveURL('/instructor/dashboard');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('student lands on /student/dashboard', async ({ page }) => {
    await login(page, 'sam@ltsc.test', PASSWORD);
    await expect(page).toHaveURL('/student/dashboard');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('dual-role user (instructor+student) lands on /instructor/dashboard', async ({ page }) => {
    await login(page, 'chris@ltsc.test', PASSWORD);
    await expect(page).toHaveURL('/instructor/dashboard');
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Auth — unauthenticated access', () => {
  test('unauthenticated user visiting / is redirected to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });

  test('unauthenticated user visiting /admin/dashboard is redirected to /login', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('unauthenticated user visiting /student/dashboard is redirected to /login', async ({ page }) => {
    await page.goto('/student/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('unauthenticated user visiting /instructor/dashboard is redirected to /login', async ({ page }) => {
    await page.goto('/instructor/dashboard');
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Auth — cross-role protection', () => {
  test('student cannot access /admin/dashboard', async ({ page }) => {
    await login(page, 'sam@ltsc.test', PASSWORD);
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL('/student/dashboard');
  });

  test('student cannot access /instructor/dashboard', async ({ page }) => {
    await login(page, 'sam@ltsc.test', PASSWORD);
    await page.goto('/instructor/dashboard');
    await expect(page).toHaveURL('/student/dashboard');
  });

  test('instructor cannot access /admin/dashboard', async ({ page }) => {
    await login(page, 'mike@ltsc.test', PASSWORD);
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL('/instructor/dashboard');
  });
});

test.describe('Auth — login page', () => {
  test('wrong password shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('sam@ltsc.test');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText(/invalid/i)).toBeVisible();
  });

  test('logged-in user visiting /login is redirected to their dashboard', async ({ page }) => {
    await login(page, 'sam@ltsc.test', PASSWORD);
    await expect(page).toHaveURL('/student/dashboard');
    await page.goto('/login');
    await expect(page).toHaveURL('/student/dashboard');
  });
});
