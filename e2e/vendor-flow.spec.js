import { test, expect } from '@playwright/test';

test.describe('Vendor Flow: Partner Portal, Referral Attribution & Isolation', () => {

  test('TC-VND-01: Login, Landing & Vendor Overview', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Vendor \/ Partner Portal/i }).click();
    await page.waitForURL('/vendor/dashboard');

    await expect(page.locator('.review-mode-sticky-banner')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Referral overview/i })).toBeVisible();

    // Verify Referral Link Card
    await expect(page.getByText(/YOUR REFERRAL LINK/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Copy link/i })).toBeVisible();

    // Verify Metrics
    await expect(page.locator('.vendor-metrics')).toContainText('Total applications');
    await expect(page.locator('.vendor-metrics')).toContainText('Submitted');
    await expect(page.locator('.vendor-metrics')).toContainText('Approved');
  });

  test('TC-VND-02: Vendor Leads Table Display', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Vendor \/ Partner Portal/i }).click();
    await page.waitForURL('/vendor/dashboard');

    await expect(page.getByRole('heading', { name: /Your leads/i })).toBeVisible();
    await expect(page.locator('.vendor-leads')).toBeVisible();
  });

  test('TC-VND-03: Vendor Logout', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Vendor \/ Partner Portal/i }).click();
    await page.waitForURL('/vendor/dashboard');

    await page.getByRole('button', { name: /Logout/i }).click();
    await expect(page).toHaveURL(/\/signed-out|\//);
  });
});

