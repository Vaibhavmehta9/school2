import { test, expect } from '@playwright/test';

test('Reproduce Hang: Browser shows 3-dot typing indicator and Stop button during 12s stall', async ({ page }) => {
  // Clear any existing session chat
  await page.goto('/');
  await page.evaluate(() => sessionStorage.clear());

  // Intercept the stream endpoint and inject a 12-second delay before responding
  await page.route('**/api/ai/chat/stream', async (route) => {
    console.log('[Mock Delay] Injected 12s delay on /api/ai/chat/stream...');
    await new Promise((resolve) => setTimeout(resolve, 12000));
    await route.continue();
  });

  // Open the Sherwood AI Assistant
  const launcher = page.getByRole('button', { name: /Ask Sherwood AI/i });
  await expect(launcher).toBeVisible();
  await launcher.click();

  const chatPanel = page.locator('.chat-panel');
  await expect(chatPanel).toBeVisible();

  // Click the "Weather at campus" quick suggestion chip
  const weatherChip = page.getByRole('button', { name: /Weather at campus/i });
  await weatherChip.click();

  // Verify the user message appeared
  const userMessage = page.locator('.chat-message-user');
  await expect(userMessage).toContainText('Weather at campus');

  // Verify the 3-dot typing indicator is displayed
  const typingDots = page.locator('.chat-typing-dots');
  await expect(typingDots).toBeVisible();

  // Verify the Stop button is displayed
  const stopButton = page.locator('.chat-stop-btn');
  await expect(stopButton).toBeVisible();

  // Verify the textarea input is disabled
  const chatInput = page.locator('.chat-input');
  await expect(chatInput).toBeDisabled();

  // At second 5, verify that it is STILL stuck on typing indicator and Stop button
  await page.waitForTimeout(5000);
  await expect(typingDots).toBeVisible();
  await expect(stopButton).toBeVisible();
  await expect(chatInput).toBeDisabled();

  // Take screenshot as visual evidence of the stall
  await page.screenshot({ path: 'screenshots/qa_hang/reproduce_hang_browser_stall.png' });
  console.log('[Reproduction Verified] Browser stalled with 3-dot typing indicator and Stop button.');
});

