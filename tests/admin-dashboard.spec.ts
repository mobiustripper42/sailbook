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
    await expect(nav.getByRole('link', { name: 'Calendar' })).toHaveAttribute('href', '/admin/calendar');
    await expect(nav.getByRole('link', { name: 'Missed Sessions' })).toHaveAttribute('href', '/admin/missed-sessions');
  });

  test('shows Active Courses stat card', async ({ page }) => {
    await expect(page.getByText('Active Courses')).toBeVisible();
  });

  test('shows either warning card or clean indicator for instructor assignment', async ({ page }) => {
    // Exactly one of the two states should be present
    const warning = page.getByText('No Instructor Assigned');
    const clean = page.getByText('All instructors assigned');
    const visibleCount =
      (await warning.isVisible() ? 1 : 0) + (await clean.isVisible() ? 1 : 0);
    expect(visibleCount).toBe(1);
  });

  test('Sessions in Next 7 Days card renders', async ({ page }) => {
    await expect(page.getByText('Sessions in Next 7 Days')).toBeVisible();
  });

  test('pending and cancellation queue cards render', async ({ page }) => {
    await expect(page.getByText(/Pending Confirmation/)).toBeVisible();
    await expect(page.getByText(/Cancellation Requests/)).toBeVisible();
  });
});
