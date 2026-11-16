import { test, expect } from '@playwright/test';

test.describe('Stage 6 QA: Browser-Level Identity, Metadata & Regression', () => {

  test('TC-BR-01: View-source of index.html and all asset 200 checks', async ({ request }) => {
    // Check favicon and metadata endpoints
    const endpoints = [
      '/favicon.svg',
      '/favicon.ico',
      '/apple-touch-icon.png',
      '/icon-192.png',
      '/icon-512.png',
      '/icon-512-maskable.png',
      '/manifest.webmanifest',
      '/robots.txt',
      '/sitemap.xml',
      '/og-image.jpg',
    ];

    for (const ep of endpoints) {
      const res = await request.get(`http://localhost:5173${ep}`);
      expect(res.status(), `Endpoint ${ep} should return 200`).toBe(200);
    }
  });

  test('TC-BR-02: Public and private route titles and robots meta progression', async ({ page }) => {
    // 1. Home
    await page.goto('http://localhost:5173/');
    await expect(page).toHaveTitle('Sherwood College, Nainital | Admissions 2027-28');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');

    // 2. Public route: Gallery
    await page.goto('http://localhost:5173/gallery');
    await expect(page).toHaveTitle('Campus Gallery | Sherwood College');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');

    // 3. Public route: Calendar
    await page.goto('http://localhost:5173/calendar');
    await expect(page).toHaveTitle('Academic Calendar | Sherwood College');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');

    // 4. Public route: Apply
    await page.goto('http://localhost:5173/apply');
    await expect(page).toHaveTitle('Apply for Admission | Sherwood College');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');

    // 5. Private route: Login
    await page.goto('http://localhost:5173/login');
    await expect(page).toHaveTitle('Portal Login | Sherwood College');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');

    // 6. Browser Back button restores Apply title and public indexability
    await page.goBack();
    await expect(page).toHaveTitle('Apply for Admission | Sherwood College');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');

    // 7. Browser Forward button restores Login title and noindex
    await page.goForward();
    await expect(page).toHaveTitle('Portal Login | Sherwood College');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  });

  test('TC-BR-03: Existing flows remain intact (AI Assistant and Login)', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    // Open AI Chat
    const chatBtn = page.getByRole('button', { name: /Ask Sherwood AI/i });
    await expect(chatBtn).toBeVisible();
    await chatBtn.click();

    const input = page.getByRole('textbox', { name: /Ask about admissions, fees, boarding/i });
    await expect(input).toBeVisible();
    await input.fill('Hi');
    await page.keyboard.press('Enter');

    // Assistant response should appear promptly
    const assistantMsg = page.locator('.chat-message-assistant').first();
    await expect(assistantMsg).toBeVisible({ timeout: 10000 });

    // Close chat
    const closeBtn = page.getByRole('button', { name: /Close chat/i });
    await closeBtn.click();

    // Navigate to Login
    await page.goto('http://localhost:5173/login');
    await expect(page.getByRole('heading', { name: /Portal/i })).toBeVisible();
  });

});
