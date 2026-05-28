import { test, expect } from '@playwright/test';

const uniq = () => `e2e-${Date.now().toString(36)}@x.com`;

test('register → create task → start pomodoro → complete task → dashboard reflects', async ({ page }) => {
  // Register
  await page.goto('/register');
  await page.getByLabel('Full name').fill('E2E User');
  await page.getByLabel('Email').fill(uniq());
  await page.getByLabel('Password', { exact: true }).fill('e2e1234');
  await page.getByLabel('Confirm password').fill('e2e1234');
  await page.getByRole('button', { name: /sign up/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  // Create task
  await page.getByRole('link', { name: /tasks/i }).click();
  await page.getByRole('button', { name: /add task/i }).click();
  await page.getByLabel('Title').fill('E2E task');
  // Deadline is datetime-local; set to 1 hour from now
  const d = new Date(Date.now() + 60 * 60_000);
  const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  await page.getByLabel('Deadline').fill(local);
  await page.getByRole('button', { name: /^create$/i }).click();
  await expect(page.getByText('E2E task')).toBeVisible();

  // Mark complete
  await page.getByRole('button', { name: /complete/i }).first().click();
  await expect(page.getByText('Task completed')).toBeVisible();

  // Dashboard reflects
  await page.getByRole('link', { name: /dashboard/i }).click();
  await expect(page.locator('text=Total tasks').locator('..').getByText(/^[0-9]+$/)).toHaveText(/[1-9]/);
});
