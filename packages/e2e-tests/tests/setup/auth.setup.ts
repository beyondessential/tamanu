import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Enter your email address').fill(process.env.TEST_EMAIL!);
  await page.getByPlaceholder('Enter your password').fill(process.env.TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL('**/#/dashboard');

  await page.waitForTimeout(1000);

  await page.context().storageState({ path: '.auth/user.json' });
});
