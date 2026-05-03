import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

// 6.29 — admin course-types list: sortable columns, name-as-edit-link, ••• row menu

test.describe('Admin course types list', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop');
    await loginAs(page, 'pw_admin@ltsc.test', '/admin/dashboard');
  });

  test('list renders with sortable headers and name links', async ({ page }) => {
    await page.goto('/admin/course-types');

    // At least one row from seed data
    const nameLink = page.getByTestId('course-type-name-link').first();
    await expect(nameLink).toBeVisible();

    // Name links to edit page
    const href = await nameLink.getAttribute('href');
    expect(href).toMatch(/\/admin\/course-types\/.+\/edit/);

    // Sort by Code — arrow indicator changes
    await page.getByRole('button', { name: /Code/ }).click();
    await expect(page.getByRole('columnheader', { name: /Code/ })).toHaveAttribute('aria-sort', 'ascending');

    // Toggle same column reverses direction
    await page.getByRole('button', { name: /Code/ }).click();
    await expect(page.getByRole('columnheader', { name: /Code/ })).toHaveAttribute('aria-sort', 'descending');
  });

  test('row menu opens with Edit, Manage Prerequisites, and Activate/Deactivate', async ({ page }) => {
    await page.goto('/admin/course-types');

    // Open the first row's ••• menu
    await page.getByRole('button', { name: 'Course type actions' }).first().click();

    await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Manage Prerequisites' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Activate|Deactivate/ })).toBeVisible();
  });

  test('Edit menu item navigates to edit page', async ({ page }) => {
    await page.goto('/admin/course-types');

    await page.getByRole('button', { name: 'Course type actions' }).first().click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();

    await expect(page).toHaveURL(/\/admin\/course-types\/.+\/edit/);
  });
});
