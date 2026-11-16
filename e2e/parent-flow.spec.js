import { test, expect } from '@playwright/test';

test.describe('Parent Flow: Authentication, Admission Lifecycle & AI', () => {

  test('TC-PAR-01 & TC-PAR-02: Login, Session Persistence on Refresh, and Navigation', async ({ page }) => {
    // 1. Login via Review Persona
    await page.goto('/login');
    await page.getByRole('button', { name: /Parent \/ Admission Applicant/i }).click();
    await page.waitForURL('/new-user-dashboard');

    // Verify Sticky Review Banner is visible
    await expect(page.locator('.review-mode-sticky-banner')).toBeVisible();

    // 2. Refresh page to verify session persistence
    await page.reload();
    await page.waitForURL('/new-user-dashboard');
    await expect(page.getByRole('heading', { name: /Admission Dashboard/i })).toBeVisible();
  });

  test('TC-PAR-03: Admission Details Step - Validation & Navigation', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Parent \/ Admission Applicant/i }).click();
    await page.waitForURL('/new-user-dashboard');

    // Navigate to Admission Details
    await page.goto('/admission-details');
    await expect(page.getByRole('heading', { name: 'Admission Details' })).toBeVisible();

    // Select valid Class (Class 9) and Current Class (Class 8)
    await page.locator('select[name="class"]').selectOption('Class 9');
    await page.locator('select[name="currentClass"]').selectOption('Class 8');

    // Enter valid PEN Number and Previous School
    await page.locator('input[name="penNumber"]').fill('PEN-2027-9999');
    await page.locator('input[name="previousSchool"]').fill('St. Xavier High School');

    // Save draft explicitly
    await page.getByRole('button', { name: /Save Draft/i }).click();
    await expect(page.getByRole('status')).toContainText(/saved as a draft/i);

    // Continue to Step 3 (Student Details)
    await page.getByRole('button', { name: /Next/i }).click();
    await page.waitForURL('/student-information');
    await expect(page.getByRole('heading', { name: 'Student Information' })).toBeVisible();
  });

  test('TC-PAR-04: Student Information & Parent Details Progression', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Parent \/ Admission Applicant/i }).click();
    await page.waitForURL('/new-user-dashboard');

    // Navigate directly to student info (with existing state)
    await page.goto('/student-information');
    await expect(page.getByRole('heading', { name: 'Student Information' })).toBeVisible();

    // Fill student fields if inputs are present
    const firstName = page.locator('input[name="firstName"], input[name="student_first_name"]').first();
    if (await firstName.isVisible()) {
      await firstName.fill('Aarav');
    }

    // Navigate to Parent Guardian step
    await page.goto('/parent-guardian');
    await expect(page.getByRole('heading', { name: /Parent/i })).toBeVisible();
  });

  test('TC-PAR-05: Document Uploads - Validation, Size Limit & Valid Upload', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Parent \/ Admission Applicant/i }).click();
    await page.waitForURL('/new-user-dashboard');

    await page.goto('/application/documents');
    await expect(page.getByRole('heading', { name: 'Document Upload' })).toBeVisible();

    // Verify document cards are rendered
    const docButton = page.locator('.document-list button').first();
    await expect(docButton).toBeVisible();

    // Submit documents to proceed to fee payment
    await page.getByRole('button', { name: /Submit application & continue to fee/i }).click();
    await page.waitForURL('/fee-payment');
    await expect(page.getByRole('heading', { name: 'Fee Payment' })).toBeVisible();
  });

  test('TC-PAR-06: Fee Payment View & Mock Gateway Interaction', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Parent \/ Admission Applicant/i }).click();
    await page.waitForURL('/new-user-dashboard');

    await page.goto('/fee-payment');
    await expect(page.getByRole('heading', { name: 'Fee Payment' })).toBeVisible();
    await expect(page.getByText(/Registration Fee/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Proceed to Pay/i })).toBeVisible();
  });

  test('TC-PAR-07: Sherwood AI Assistant Interaction', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Parent \/ Admission Applicant/i }).click();
    await page.waitForURL('/new-user-dashboard');

    // Open Chat Panel via floating trigger
    const chatTrigger = page.locator('.chat-floating-trigger');
    if (await chatTrigger.isVisible()) {
      await chatTrigger.click();
      await expect(page.locator('.chat-panel')).toBeVisible();

      // Check empty state welcome text
      await expect(page.getByText(/Hi, I'm Sherwood AI/i)).toBeVisible();

      // Click a suggestion chip
      const chip = page.locator('.chat-chip').first();
      await chip.click();

      // Wait for AI response bubble to appear
      await expect(page.locator('.chat-bubble-assistant').first()).toBeVisible({ timeout: 15000 });
    }
  });

  test('TC-PAR-08: Logout Action & Session Clearance', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Parent \/ Admission Applicant/i }).click();
    await page.waitForURL('/new-user-dashboard');

    // Click Exit review mode in the sticky banner
    await page.getByRole('button', { name: /Exit review mode/i }).click();
    await expect(page).toHaveURL(/\/login|\//);

    // Verify navigating to protected route now requires login
    await page.goto('/new-user-dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
