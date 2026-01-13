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

test('snippet analysis workflow', async ({ page }) => {
  await page.goto('/');
  
  // Bypass Auth
  await page.evaluate(() => {
    localStorage.setItem('E2E_TEST_USER', 'true');
    window.location.reload();
  });

  // Wait for the tab list to be visible before interacting
  await expect(page.getByRole('tablist')).toBeVisible({ timeout: 10000 });

  // Switch to Snippet tab
  await page.getByRole('tab', { name: 'Snippet' }).click();
  
  // Find textarea by Label
  const textarea = page.getByLabel(/HTML Code Snippet/i);
  await expect(textarea).toBeVisible();

  // Enter accessibility issue
  await textarea.fill('<button style="color: #ccc; background: #ccc;">Low Contrast</button>');

  // Submit
  const analyzeBtn = page.getByRole('button', { name: /Analyze Accessibility/i });
  await expect(analyzeBtn).toBeVisible();
  
  // Setup console listener to debug if click fails
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await analyzeBtn.click();

  // Wait for results
  // The results view usually shows "A11y Findings"
  // Increasing timeout as axe-core in-browser can be slow
  await expect(page.getByText(/A11y Findings/i)).toBeVisible({ timeout: 30000 });
  await expect(page.getByText('File')).toBeVisible(); // "File" label in valid results
});
