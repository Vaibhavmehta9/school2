import { test } from '@playwright/test';

const artifactDir = 'C:/Users/yashm/.gemini/antigravity/brain/8167f3b3-38a4-4ce6-a23a-395b4eb53b43/screenshots/qa_stage3';

test('Capture Stage 3 Visual Artifacts', async ({ page }) => {
  // 1. Parent Dashboard
  await page.goto('/login');
  await page.getByRole('button', { name: /Parent \/ Admission Applicant/i }).click();
  await page.waitForURL('/new-user-dashboard');
  await page.screenshot({ path: `${artifactDir}/stage3_parent_dashboard.png`, fullPage: true });

  // 2. Admission Form Details
  await page.goto('/admission-details');
  await page.screenshot({ path: `${artifactDir}/stage3_admission_form.png`, fullPage: true });

  // 3. Student Dashboard
  await page.goto('/login');
  await page.getByRole('button', { name: /Student Portal/i }).click();
  await page.waitForURL('/student/dashboard');
  await page.screenshot({ path: `${artifactDir}/stage3_student_dashboard.png`, fullPage: true });

  // 4. Teacher Dashboard
  await page.goto('/login');
  await page.getByRole('button', { name: /Teacher Portal/i }).click();
  await page.waitForURL('/teacher/dashboard');
  await page.screenshot({ path: `${artifactDir}/stage3_teacher_dashboard.png`, fullPage: true });

  // 5. Admin Dashboard
  await page.goto('/login');
  await page.getByRole('button', { name: /Administrative Portal/i }).click();
  await page.waitForURL('/admin/dashboard');
  await page.screenshot({ path: `${artifactDir}/stage3_admin_dashboard.png`, fullPage: true });

  // 6. Vendor Dashboard
  await page.goto('/login');
  await page.getByRole('button', { name: /Vendor \/ Partner Portal/i }).click();
  await page.waitForURL('/vendor/dashboard');
  await page.screenshot({ path: `${artifactDir}/stage3_vendor_dashboard.png`, fullPage: true });
});

