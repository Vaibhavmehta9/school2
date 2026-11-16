import { test, expect } from '@playwright/test';

test.describe('Frontend Security & Sanitization', () => {

  test('TC-XSS-01: No alert or script execution on injection in student search', async ({ page }) => {
    let alertTriggered = false;
    page.on('dialog', async (dialog) => {
      alertTriggered = true;
      await dialog.dismiss();
    });

    await page.goto('/login');
    await page.getByRole('button', { name: /Student Portal/i }).click();
    await page.waitForURL('/student/dashboard');

    const searchInput = page.locator('input[placeholder*="Search subjects"]');
    await searchInput.fill('<script>alert("XSS")</script><img src=x onerror=alert(1)>');
    await page.waitForTimeout(1000);

    expect(alertTriggered).toBe(false);
  });

  test('TC-XSS-02: No script execution in Chat Panel input', async ({ page }) => {
    let alertTriggered = false;
    page.on('dialog', async (dialog) => {
      alertTriggered = true;
      await dialog.dismiss();
    });

    await page.goto('/login');
    await page.getByRole('button', { name: /Parent \/ Admission Applicant/i }).click();
    await page.waitForURL('/new-user-dashboard');

    const chatTrigger = page.locator('.chat-floating-trigger');
    if (await chatTrigger.isVisible()) {
      await chatTrigger.click();
      const input = page.locator('.chat-input-textarea');
      await input.fill('<script>alert("CHAT-XSS")</script>');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1500);

      expect(alertTriggered).toBe(false);
    }
  });
});

