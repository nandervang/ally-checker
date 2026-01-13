import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Bun/);
  await expect(page).toHaveTitle(/React/);
});

test('check auth form loads', async ({ page }) => {
  page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
  await page.goto('/');
  
  // Check if we are stuck loading
  const loader = page.locator('.animate-spin');
  if (await loader.isVisible()) {
    console.log('Loader is visible...');
  }

  // Wait for loading to finish (if any)
  // We check for email input. It might take a moment.
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
});
