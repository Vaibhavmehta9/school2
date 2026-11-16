import { test, expect } from '@playwright/test';

test.describe('Student Flow: Dashboard, Academics & Schedule', () => {

  test('TC-STU-01: Login, Landing & Dashboard KPIs', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Student Portal/i }).click();
    await page.waitForURL('/student/dashboard');

    // Verify Review mode banner
    await expect(page.locator('.review-mode-sticky-banner')).toBeVisible();

    // Verify Welcome header
    await expect(page.getByRole('heading', { name: /Good Morning, Rahul/i })).toBeVisible();

    // Verify KPI Cards
    await expect(page.locator('.student-kpis')).toContainText('Attendance');
    await expect(page.locator('.student-kpis')).toContainText('92%');
    await expect(page.locator('.student-kpis')).toContainText('My Subjects');
    await expect(page.locator('.student-kpis')).toContainText('Unit Test 1');
  });

  test('TC-STU-02: Navigation Tabs & Section Switching', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Student Portal/i }).click();
    await page.waitForURL('/student/dashboard');

    const nav = page.locator('nav[aria-label="Student dashboard navigation"]');

    // Click Timetable
    await nav.getByRole('button', { name: /Timetable/i }).click();
    await expect(page.locator('.student-notice')).toContainText(/Timetable workspace selected/i);

    // Click Homework
    await nav.getByRole('button', { name: /Homework/i }).click();
    await expect(page.locator('.student-notice')).toContainText(/Homework workspace selected/i);

    // Click Exams & Results
    await nav.getByRole('button', { name: /Exams & Results/i }).click();
    await expect(page.locator('.student-notice')).toContainText(/Exams & Results workspace selected/i);

    // Return to Dashboard
    await nav.getByRole('button', { name: /Dashboard/i }).click();
    await expect(page.locator('.student-main-grid')).toBeVisible();
  });

  test('TC-STU-03: Search Bar & Notification Bell Interaction', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Student Portal/i }).click();
    await page.waitForURL('/student/dashboard');

    // Type in search bar
    const searchInput = page.locator('input[placeholder*="Search subjects"]');
    await searchInput.fill('Mathematics');
    await expect(searchInput).toHaveValue('Mathematics');

    // Click Notifications Bell
    await page.locator('.student-bell').click();
    await expect(page.locator('.student-notice')).toContainText(/You have 3 new notifications/i);

    // Dismiss notice
    await page.getByRole('button', { name: 'Dismiss' }).click();
    await expect(page.locator('.student-notice')).not.toBeVisible();
  });

  test('TC-STU-04: Student Logout', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Student Portal/i }).click();
    await page.waitForURL('/student/dashboard');

    // Click Logout in sidebar
    await page.locator('.student-logout').click();
    await expect(page).toHaveURL(/\/signed-out/);
  });
});

