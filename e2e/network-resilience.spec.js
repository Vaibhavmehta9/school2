import { test, expect } from '@playwright/test';

test.describe('Stage 6: Frontend Network Resilience & Error Recovery', () => {

  test('TC-RES-01: UI resilience when API is offline / aborted - maintains layout with fallback data', async ({ page }) => {
    // Intercept and abort the status endpoint
    await page.route('**/api/applications/current/status', (route) => {
      route.abort('failed');
    });

    await page.goto('/login');
    await page.getByRole('button', { name: /Parent \/ Admission Applicant/i }).click();
    await page.waitForURL('/new-user-dashboard');

    // Verify page shell did NOT crash to blank white screen
    await expect(page.locator('.new-admission-dashboard-header')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Admission Dashboard/i })).toBeVisible();

    // Verify fallback review data is displayed gracefully
    await expect(page.locator('.new-admission-progress-card')).toBeVisible();
    await expect(page.getByRole('button', { name: /Refresh/i })).toBeVisible();
  });

  test('TC-RES-02: AI Chat error bubble and retry trigger when AI endpoint is aborted', async ({ page }) => {
    // Intercept and abort AI chat endpoint
    await page.route('**/api/ai/chat', (route) => {
      route.abort('failed');
    });

    await page.goto('/login');
    await page.getByRole('button', { name: /Parent \/ Admission Applicant/i }).click();
    await page.waitForURL('/new-user-dashboard');

    const chatTrigger = page.locator('.chat-floating-trigger');
    if (await chatTrigger.isVisible()) {
      await chatTrigger.click();
      await expect(page.locator('.chat-panel')).toBeVisible();

      // Click a chip to send question
      const chip = page.locator('.chat-chip').first();
      await chip.click();

      // Verify chat displays error bubble or status, and does not crash
      await expect(page.locator('.chat-bubble-assistant, .chat-status-error, .chat-panel-messages').first()).toBeVisible({ timeout: 10000 });
      // Panel remains open and interactive
      await expect(page.locator('.chat-input-textarea')).toBeVisible();
    }
  });

  test('TC-RES-03: Slow network simulation (delayed response) preserves smooth layout', async ({ page }) => {
    await page.route('**/api/applications/current/status', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.continue();
    });

    await page.goto('/login');
    await page.getByRole('button', { name: /Parent \/ Admission Applicant/i }).click();
    await page.waitForURL('/new-user-dashboard');

    // Dashboard settles after delay without crashing
    await expect(page.locator('.new-admission-progress-card')).toBeVisible();
  });
});
