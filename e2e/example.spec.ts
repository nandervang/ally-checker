import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Bun/);
});

test('auth form loads and has interactive elements', async ({ page }) => {
  await page.goto('/');
  
  // Wait for the form to appear (React hydration)
  const emailInput = page.getByLabel(/Email/i).first();
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  
  // Check for password field
  await expect(page.getByLabel(/Password/i).first()).toBeVisible();
  
  // Check for submit button
  const submitBtn = page.getByRole('button', { name: /Sign/i }).first();
  await expect(submitBtn).toBeVisible();
  
  // Check tab switching
  const tabs = page.getByRole('tablist');
  await expect(tabs).toBeVisible();
});
