import { test, expect } from '@playwright/test';

test('homepage has expected title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Tamanu/);
});

test('failing test', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Wrong title/);
});
