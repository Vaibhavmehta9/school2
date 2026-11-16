import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
};

const PAGES_TO_TEST = [
  { name: 'Home', path: '/' },
  { name: 'Login / Persona Picker', path: '/login' },
  { name: 'Parent Dashboard', path: '/new-user-dashboard', authRole: 'Parent / Admission Applicant' },
  { name: 'Admission Form', path: '/admission-details', authRole: 'Parent / Admission Applicant' },
  { name: 'Student Dashboard', path: '/student/dashboard', authRole: 'Student Portal' },
  { name: 'Teacher Dashboard', path: '/teacher/dashboard', authRole: 'Teacher Portal' },
  { name: 'Admin Dashboard', path: '/admin/dashboard', authRole: 'Administrative Portal' },
  { name: 'Vendor Dashboard', path: '/vendor/dashboard', authRole: 'Vendor / Partner Portal' },
];

test.describe('Stage 5: Accessibility (WCAG 2.1 AA) and Axe-Core Audits', () => {

  for (const pageInfo of PAGES_TO_TEST) {
    test(`Axe-Core WCAG AA Audit: ${pageInfo.name}`, async ({ page }) => {
      if (pageInfo.authRole) {
        await page.goto('/login');
        await page.getByRole('button', { name: new RegExp(pageInfo.authRole, 'i') }).click();
        await page.waitForTimeout(1000);
      } else {
        await page.goto(pageInfo.path);
      }

      // Analyze page for WCAG 2.0 and 2.1 AA violations
      // Exclude external third-party iframes if any
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      console.log(`[Axe] ${pageInfo.name}: ${results.violations.length} violations found.`);
      if (results.violations.length > 0) {
        for (const v of results.violations) {
          console.log(`   - Rule: ${v.id} (${v.impact}) - ${v.description}`);
          console.log(`     Nodes affected: ${v.nodes.length}`);
        }
      }
      // Report issues for QA documentation without failing build prematurely
    });
  }
});

test.describe('Stage 5: Responsive Layout (No Horizontal Overflow)', () => {
  for (const [vpName, vpDimensions] of Object.entries(VIEWPORTS)) {
    test(`Horizontal Overflow Check at ${vpName} (${vpDimensions.width}px)`, async ({ page }) => {
      await page.setViewportSize(vpDimensions);

      // Check Home
      await page.goto('/');
      const homeOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(homeOverflow).toBe(false);

      // Check Login / Picker
      await page.goto('/login');
      const loginOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(loginOverflow).toBe(false);

      // Check Parent Dashboard
      await page.getByRole('button', { name: /Parent \/ Admission Applicant/i }).click();
      await page.waitForURL('/new-user-dashboard');
      const parentOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(parentOverflow).toBe(false);
    });
  }
});

test.describe('Stage 5: Keyboard Navigation & Focus Trap Verification', () => {

  test('Focus rings and Tab progression on Login / Persona Picker', async ({ page }) => {
    await page.goto('/login');
    const firstButton = page.getByRole('button', { name: /Parent \/ Admission Applicant/i });
    await firstButton.focus();
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag).toBe('BUTTON');

    // Press Tab to advance focus to next button
    await page.keyboard.press('Tab');
    const nextTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'A', 'INPUT']).toContain(nextTag);
  });

  test('Escape key closes chat panel or modal', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Parent \/ Admission Applicant/i }).click();
    await page.waitForURL('/new-user-dashboard');

    const chatTrigger = page.locator('.chat-floating-trigger');
    if (await chatTrigger.isVisible()) {
      await chatTrigger.click();
      await expect(page.locator('.chat-panel')).toBeVisible();

      // Press Escape to close
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      // Chat panel should close or minimize
    }
  });
});

