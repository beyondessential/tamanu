import { test } from '@playwright/test';

test('Record a vaccine', async ({ page }) => {
  // Navigate to the home
  await page.goto('/');

  await page.waitForURL('**/#/dashboard');

  // Navigate to the all patients page
  await page.goto('/#/patients/all');

  // Locate the patient table
  const patientTable = await page.getByRole('table');

  // Await the table to load
  await patientTable.waitFor();

  // Get the first row of the table and click
  const firstRow = await patientTable.locator('tbody tr').first();

  await firstRow.waitFor();

  await firstRow.click();

  await page.waitForURL('**/#/patients/all/*');


  const loader = await page.getByTestId('patient-view-loading');
  await loader.waitFor({ state: 'detached' });

  // Click on the vaccines tab
  await page.getByRole('button', { name: 'Vaccines' }).click();

  // Click on record vaccine button
  await page.getByRole('button', { name: 'Record vaccine' }).click();
});
