import { test, expect } from '@playwright/test';

test('Frontend home page loads with Sherwood branding', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Sherwood/i);
});
