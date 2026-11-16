import { test, expect } from '@playwright/test';

test.describe('Teacher Flow: Classroom, Attendance & Schedules', () => {

  test('TC-TEA-01: Login, Landing & Teacher Overview', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Teacher Portal/i }).click();
    await page.waitForURL('/teacher/dashboard');

    await expect(page.locator('.review-mode-sticky-banner')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Good morning/i })).toBeVisible();

    // Verify Stat Grid
    await expect(page.locator('.teacher-stat-grid')).toContainText('Students');
    await expect(page.locator('.teacher-stat-grid')).toContainText('128');
    await expect(page.locator('.teacher-stat-grid')).toContainText('Classes Today');
    await expect(page.locator('.teacher-stat-grid')).toContainText('Attendance');
  });

  test('TC-TEA-02: Section Navigation & Teaching Modules', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Teacher Portal/i }).click();
    await page.waitForURL('/teacher/dashboard');

    const sidebar = page.locator('.teacher-sidebar');

    // Click My Classes
    await sidebar.getByRole('button', { name: /My Classes/i }).click();
    await expect(page.getByRole('heading', { name: 'My Classes' })).toBeVisible();
    await expect(page.locator('.teacher-class-grid')).toContainText('Class 5A');

    // Click Attendance
    await sidebar.getByRole('button', { name: /Attendance/i }).click();
    await expect(page.getByRole('heading', { name: 'Mark Attendance' })).toBeVisible();

    // Click Timetable
    await sidebar.getByRole('button', { name: /Timetable/i }).click();
    await expect(page.getByRole('heading', { name: /Timetable/i })).toBeVisible();
  });

  test('TC-TEA-03: Quick Mark Attendance Action', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Teacher Portal/i }).click();
    await page.waitForURL('/teacher/dashboard');

    // Click Mark Attendance button in header action
    await page.getByRole('button', { name: /✓ Mark Attendance/i }).click();
    await expect(page.getByRole('heading', { name: 'Mark Attendance' })).toBeVisible();
  });

  test('TC-TEA-04: Teacher Logout', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Teacher Portal/i }).click();
    await page.waitForURL('/teacher/dashboard');

    // Click logout in sidebar
    await page.locator('.teacher-logout').click();
    await expect(page).toHaveURL(/\/signed-out|\//);
  });
});

