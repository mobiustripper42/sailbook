import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Admin dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
  });

  test('renders heading with today\'s date subtitle', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
    // Subtitle uses long weekday + month + day, e.g., "Saturday, May 2"
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    await expect(page.getByText(today)).toBeVisible();
  });

  test('quick actions row links to the four landing pages', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Quick actions' });
    await expect(nav.getByRole('link', { name: '+ New Course' })).toHaveAttribute('href', '/admin/courses/new');
    await expect(nav.getByRole('link', { name: '+ New Student' })).toHaveAttribute('href', '/admin/students/new');
    await expect(nav.getByRole('link', { name: 'Schedule' })).toHaveAttribute('href', '/admin/schedule');
    await expect(nav.getByRole('link', { name: 'Missed Sessions' })).toHaveAttribute('href', '/admin/missed-sessions');
  });

  test('header shows the active-course running count', async ({ page }) => {
    await expect(page.getByText(/\d+ courses? running/)).toBeVisible();
  });

  test('triage board and all section headers render (10.5)', async ({ page }) => {
    for (const label of ['Needs you', 'Today on the water', 'Rest of the week', 'Filling now', 'Just enrolled']) {
      await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible();
    }
  });
});
