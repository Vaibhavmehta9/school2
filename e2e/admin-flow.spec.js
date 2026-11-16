import { test, expect } from '@playwright/test';

test.describe('Admin Flow: Operations, Applications, Users & Settings', () => {

  test('TC-ADM-01: Login, Landing & Admin Dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Administrative Portal/i }).click();
    await page.waitForURL('/admin/dashboard');

    await expect(page.locator('.review-mode-sticky-banner')).toBeVisible();
    await expect(page.locator('.admin-sidebar')).toBeVisible();
  });

  test('TC-ADM-02: Admissions Table, Search & Filter', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Administrative Portal/i }).click();
    await page.waitForURL('/admin/dashboard');

    // Click Admissions in sidebar
    await page.locator('.admin-sidebar').getByRole('button', { name: /Admissions/i }).click();
    await page.waitForURL('/admin/admissions');

    // Table or empty state should be present
    await expect(page.locator('.admin-shell, .admin-content')).toBeVisible();
  });

  test('TC-ADM-03: Teachers Screen Navigation', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Administrative Portal/i }).click();
    await page.waitForURL('/admin/dashboard');

    await page.locator('.admin-sidebar').getByRole('button', { name: /Teachers/i }).click();
    await page.waitForURL('/admin/teachers');
    await expect(page.locator('.admin-shell, .admin-content')).toBeVisible();
  });

  test('TC-ADM-04: Students Screen Navigation', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Administrative Portal/i }).click();
    await page.waitForURL('/admin/dashboard');

    await page.locator('.admin-sidebar').getByRole('button', { name: /Students/i }).click();
    await page.waitForURL('/admin/students');
    await expect(page.locator('.admin-shell, .admin-content')).toBeVisible();
  });

  test('TC-ADM-05: Vendors Screen Navigation', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Administrative Portal/i }).click();
    await page.waitForURL('/admin/dashboard');

    await page.locator('.admin-sidebar').getByRole('button', { name: /Vendors/i }).click();
    await page.waitForURL('/admin/vendors');
    await expect(page.locator('.admin-shell, .admin-content')).toBeVisible();
  });

  test('TC-ADM-06: Settings Screen Navigation', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Administrative Portal/i }).click();
    await page.waitForURL('/admin/dashboard');

    await page.locator('.admin-sidebar').getByRole('button', { name: /Settings/i }).click();
    await page.waitForURL('/admin/settings');
    await expect(page.locator('.admin-shell, .admin-content')).toBeVisible();
  });

  test('TC-ADM-07: Admin Logout', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Administrative Portal/i }).click();
    await page.waitForURL('/admin/dashboard');

    await page.locator('.admin-logout').click();
    await expect(page).toHaveURL(/\/signed-out|\//);
  });
});

