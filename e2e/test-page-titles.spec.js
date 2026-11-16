import { test, expect } from '@playwright/test';

test('TC-PAGE-TITLES-ROBOTS: Dynamic route title and robots meta updates', async ({ page }) => {
  // 1. Home
  await page.goto('http://localhost:5173/');
  await expect(page).toHaveTitle('Sherwood College, Nainital | Admissions 2027-28');
  const homeRobots = await page.locator('meta[name="robots"]').getAttribute('content');
  expect(homeRobots).toBe('index, follow');

  // 2. Gallery
  await page.goto('http://localhost:5173/gallery');
  await expect(page).toHaveTitle('Campus Gallery | Sherwood College');
  const galleryRobots = await page.locator('meta[name="robots"]').getAttribute('content');
  expect(galleryRobots).toBe('index, follow');

  // 3. Apply / Register
  await page.goto('http://localhost:5173/apply');
  await expect(page).toHaveTitle('Apply for Admission | Sherwood College');
  const applyRobots = await page.locator('meta[name="robots"]').getAttribute('content');
  expect(applyRobots).toBe('index, follow');

  // 4. Login (private route - must set noindex, nofollow)
  await page.goto('http://localhost:5173/login');
  await expect(page).toHaveTitle('Portal Login | Sherwood College');
  const loginRobots = await page.locator('meta[name="robots"]').getAttribute('content');
  expect(loginRobots).toBe('noindex, nofollow');

  // 5. Back navigation restores Gallery title and indexability
  await page.goBack();
  await expect(page).toHaveTitle('Apply for Admission | Sherwood College');
  const backRobots = await page.locator('meta[name="robots"]').getAttribute('content');
  expect(backRobots).toBe('index, follow');
});

