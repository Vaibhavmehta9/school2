import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Virtual Tour and Latest Events Features', () => {
  test('Desktop (1440x900): Tour and Events interaction and privacy embeds', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://127.0.0.1:5173/');

    // 1. Verify Virtual Tour section
    const tourSection = page.locator('#virtual-tour');
    await expect(tourSection).toBeVisible();
    await expect(tourSection.locator('.virtual-tour-title')).toHaveText('Walk the Historic Ayarpatta Estate');

    // Check initial active chapter is Chapter 1
    const poster = tourSection.locator('.virtual-tour-poster');
    await expect(poster).toBeVisible();
    await expect(tourSection.locator('.virtual-tour-poster-title')).toHaveText("Founders' PT Display & Campus Parade");

    // Check 4 chapters in playlist
    const chapterCards = tourSection.locator('.virtual-tour-chapter-card');
    await expect(chapterCards).toHaveCount(4);

    // Switch to Chapter 2
    await chapterCards.nth(1).click();
    await expect(tourSection.locator('.virtual-tour-poster-title')).toHaveText('Academic Excellence & ICSE Batches');

    // Click play to load privacy lite-embed iframe
    await poster.click();
    const iframe = tourSection.locator('.virtual-tour-iframe');
    await expect(iframe).toBeVisible();
    const src = await iframe.getAttribute('src');
    expect(src).toContain('youtube-nocookie.com/embed/DH4vvUDc9CY');

    // Close video
    await tourSection.locator('.virtual-tour-secondary-btn').click();
    await expect(poster).toBeVisible();

    // 2. Verify Latest Events section
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

    // Take screenshots
    await tourSection.screenshot({ path: path.resolve('screenshots/tour-desktop-1440.png') });
    await eventsSection.screenshot({ path: path.resolve('screenshots/events-desktop-1440.png') });
  });

  test('Tablet (768x1024): Responsiveness & Layout', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://127.0.0.1:5173/');

    const tourSection = page.locator('#virtual-tour');
    await expect(tourSection).toBeVisible();

    const eventsSection = page.locator('#events');
    await expect(eventsSection).toBeVisible();

    await tourSection.screenshot({ path: path.resolve('screenshots/tour-tablet-768.png') });
    await eventsSection.screenshot({ path: path.resolve('screenshots/events-tablet-768.png') });
  });

  test('Mobile (375x812): Scroll-snap, Mobile drawer, and Sticky apply bar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('http://127.0.0.1:5173/');

    // Check navbar hamburger toggle and mobile menu links
    const menuBtn = page.locator('.sherwood-navbar__toggle');
    await menuBtn.click();
    const tourNav = page.locator('.sherwood-navbar__nav a[href="#virtual-tour"]');
    const eventsNav = page.locator('.sherwood-navbar__nav a[href="#events"]');
    await expect(tourNav).toBeVisible();
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

    // Verify Virtual Tour section on mobile
    const tourSection = page.locator('#virtual-tour');
    await expect(tourSection).toBeVisible();

    // Verify Events section on mobile
    const eventsSection = page.locator('#events');
    await expect(eventsSection).toBeVisible();

    await page.screenshot({ path: path.resolve('screenshots/homepage-mobile-375.png') });
  });
});
