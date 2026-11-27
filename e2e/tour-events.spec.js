import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Website Clean Rhythm and Latest Events Features', () => {
  test('Desktop (1440x900): Verify Tour section removed and Events interaction works', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // 1. Verify Virtual Tour section is completely removed from the page
    const tourSection = page.locator('#virtual-tour');
    await expect(tourSection).toHaveCount(0);

    // Verify navbar has NO link to #virtual-tour
    const tourNav = page.locator('.sherwood-navbar__nav a[href="#virtual-tour"]');
    await expect(tourNav).toHaveCount(0);

    // Verify old route /virtual-tour redirects gracefully to /
    await page.goto('/virtual-tour');
    await expect(page).toHaveURL('http://localhost:5173/');

    // Verify "Schedule a Campus Visit" CTA exists in the admission CTA section
    const campusVisitBtn = page.locator('.sherwood-cta__actions a[href="#contact"]');
    await expect(campusVisitBtn).toBeVisible();
    await expect(campusVisitBtn).toHaveText(/Schedule a Campus Visit/i);

    // 2. Verify Latest Events section is intact and functional
    const eventsSection = page.locator('#events');
    await expect(eventsSection).toBeVisible();
    await expect(eventsSection.locator('.latest-events-title')).toHaveText('Life at Sherwood: Recent & Upcoming');

    // Check event cards
    const eventCards = eventsSection.locator('.latest-events-card');
    await expect(eventCards).toHaveCount(4);
    await expect(eventCards.first().locator('.latest-events-card-title')).toHaveText("Founders' Day Production: 'MACBETH'");

    // Advance slider with next button
    const nextBtn = eventsSection.locator('.latest-events-nav-btn').nth(1);
    await nextBtn.click();
    await page.waitForTimeout(400);

    // Click "Watch Highlights" on first event
    const watchBtn = eventCards.first().locator('.latest-events-btn-play');
    await watchBtn.scrollIntoViewIfNeeded();
    await watchBtn.click({ force: true });

    // Verify lightbox modal opened with iframe
    const modal = page.locator('.latest-events-modal');
    await expect(modal).toBeVisible();
    const modalIframe = modal.locator('iframe');
    await expect(modalIframe).toBeVisible();
    const modalSrc = await modalIframe.getAttribute('src');
    expect(modalSrc).toContain('youtube-nocookie.com/embed/');

    // Close modal
    await page.locator('.latest-events-modal-close').click();
    await expect(modal).not.toBeVisible();

    // Take screenshot of events section
    await eventsSection.screenshot({ path: path.resolve('screenshots/events-desktop-1440.png') });
  });

  test('Tablet (768x1024): Responsiveness & Layout without Tour section', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    const tourSection = page.locator('#virtual-tour');
    await expect(tourSection).toHaveCount(0);

    const eventsSection = page.locator('#events');
    await expect(eventsSection).toBeVisible();

    await eventsSection.screenshot({ path: path.resolve('screenshots/events-tablet-768.png') });
  });

  test('Mobile (375x812): Scroll-snap, Mobile drawer, and Sticky apply bar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    // Check navbar hamburger toggle and mobile menu links
    const menuBtn = page.locator('.sherwood-navbar__toggle');
    await menuBtn.click();
    const tourNav = page.locator('.sherwood-navbar__nav a[href="#virtual-tour"]');
    const eventsNav = page.locator('.sherwood-navbar__nav a[href="#events"]');
    await expect(tourNav).toHaveCount(0);
    await expect(eventsNav).toBeVisible();
    await menuBtn.click(); // close menu

    // Scroll down past hero to reveal sticky mobile apply bar
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(300);

    // Verify single primary gold button on mobile bar
    const mobileBar = page.locator('.sherwood-mobile-apply-bar');
    await expect(mobileBar).toBeVisible();
    const goldBtn = mobileBar.locator('.sherwood-mobile-apply-bar__btn');
    await expect(goldBtn).toBeVisible();

    // Verify Virtual Tour section is NOT on mobile
    const tourSection = page.locator('#virtual-tour');
    await expect(tourSection).toHaveCount(0);

    // Verify Events section on mobile
    const eventsSection = page.locator('#events');
    await expect(eventsSection).toBeVisible();

    await page.screenshot({ path: path.resolve('screenshots/homepage-mobile-375.png') });
  });
});
