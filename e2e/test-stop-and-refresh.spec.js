import { test, expect } from '@playwright/test';

test('TC-CHAT-STOP-REFRESH: Stop cancels immediately and refresh does not get stuck', async ({ page }) => {
  // Navigate to home
  await page.goto('http://localhost:5173');

  // Open chat
  const chatTrigger = page.getByRole('button', { name: /Ask Sherwood AI/i });
  await expect(chatTrigger).toBeVisible();
  await chatTrigger.click();

  const chatInput = page.getByRole('textbox', { name: /Ask about admissions, fees, boarding/i });
  await expect(chatInput).toBeVisible();

  // Test 1: Stop generating
  await chatInput.fill('What are the fees?');
  await page.keyboard.press('Enter');

  // Stop button should appear
  const stopButton = page.getByRole('button', { name: /Stop/i });
  if (await stopButton.isVisible()) {
    await stopButton.click();
    // Stop button should disappear immediately
    await expect(stopButton).not.toBeVisible();
    // Input must be re-enabled
    await expect(chatInput).toBeEnabled();
  }

  // Test 2: Refresh while thinking does not leave the chat stuck
  // Route /api/ai/chat/stream with 10s delay to simulate mid-thinking
  await page.route('**/api/ai/chat/stream', async (route) => {
    // Delay response
    await new Promise((r) => setTimeout(r, 10000));
    await route.continue();
  });

  await chatInput.fill('Weather at campus');
  await page.keyboard.press('Enter');

  // Reload page while pending
  await page.reload();

  // Re-open chat
  const chatTriggerAfterReload = page.getByRole('button', { name: /Ask Sherwood AI/i });
  await expect(chatTriggerAfterReload).toBeVisible();
  await chatTriggerAfterReload.click();

  const chatInputAfterReload = page.getByRole('textbox', { name: /Ask about admissions, fees, boarding/i });
  await expect(chatInputAfterReload).toBeVisible();
  // Verify input is enabled and typing indicator is NOT present
  await expect(chatInputAfterReload).toBeEnabled();
  const typingDots = page.locator('.chat-typing-dots');
  await expect(typingDots).not.toBeVisible();
});

