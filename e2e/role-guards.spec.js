import { test, expect } from '@playwright/test';

test.describe('Role Guards and Route Protection', () => {

  test('TC-SEC-01: Unauthenticated visitors redirected to login from protected routes', async ({ page }) => {
    const protectedRoutes = [
      '/new-user-dashboard',
      '/admin/dashboard',
      '/teacher/dashboard',
      '/student/dashboard',
      '/vendor/dashboard',
      '/admission-details',
      '/student-information',
      '/parent-guardian',
      '/application/documents',
      '/fee-payment',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      // Wait for redirect to /login or presence of login persona picker
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('TC-SEC-02: Public routes remain accessible without auth', async ({ page }) => {
    const publicRoutes = ['/', '/gallery', '/calendar', '/apply', '/track-application', '/ai-assistant'];
    for (const route of publicRoutes) {
      await page.goto(route);
      expect(page.url()).toContain(route);
    }
    // Decommissioned tour route lands gracefully on homepage
    await page.goto('/virtual-tour');
    await expect(page).toHaveURL('http://localhost:5173/');
  });

  test('TC-SEC-03: Parent persona blocked from accessing Admin and Teacher dashboards', async ({ page }) => {
    // 1. Visit /login and choose Parent
    await page.goto('/login');
    await page.getByRole('button', { name: /Parent \/ Admission Applicant/i }).click();
    await page.waitForURL('/new-user-dashboard');

    // 2. Attempt direct navigation to /admin/dashboard
    await page.goto('/admin/dashboard');
    // Guard redirects unauthorized role to default route or /login
    await page.waitForTimeout(1000);
    expect(page.url()).not.toContain('/admin/dashboard');

    // 3. Attempt direct navigation to /teacher/dashboard
    await page.goto('/teacher/dashboard');
    await page.waitForTimeout(1000);
    expect(page.url()).not.toContain('/teacher/dashboard');
  });

  test('TC-SEC-04: Student persona blocked from Admin and Teacher dashboards', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Student Portal/i }).click();
    await page.waitForURL('/student/dashboard');

    await page.goto('/admin/dashboard');
    await page.waitForTimeout(1000);
    expect(page.url()).not.toContain('/admin/dashboard');

    await page.goto('/teacher/dashboard');
    await page.waitForTimeout(1000);
    expect(page.url()).not.toContain('/teacher/dashboard');
  });

  test('TC-SEC-05: Teacher persona blocked from Admin dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Teacher Portal/i }).click();
    await page.waitForURL('/teacher/dashboard');

    await page.goto('/admin/dashboard');
    await page.waitForTimeout(1000);
    expect(page.url()).not.toContain('/admin/dashboard');
  });
});

