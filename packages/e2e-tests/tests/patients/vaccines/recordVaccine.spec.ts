import { test } from '@playwright/test';

test('Record a vaccine', async ({ page }) => {
  console.log(
    (await page.context().storageState()).origins[0].localStorage.find(
      (item) => item.name === 'apiToken',
    )?.value,
  );

  console.log(
    (await page.context().storageState()).origins[0].localStorage.find(
      (item) => item.name === 'availableFacilities',
    )?.value,
  );

  console.log(
    (await page.context().storageState()).origins[0].localStorage.find(
      (item) => item.name === 'facilityId',
    )?.value,
  );

  // Navigate to the home
  await page.goto('/#/');

  // timeout for 10 seconds
  await page.waitForTimeout(10000);

  console.log(
    (await page.context().storageState()).origins[0].localStorage.find(
      (item) => item.name === 'apiToken',
    )?.value,
  );

  console.log(
    (await page.context().storageState()).origins[0].localStorage.find(
      (item) => item.name === 'availableFacilities',
    )?.value,
  );

  console.log(
    (await page.context().storageState()).origins[0].localStorage.find(
      (item) => item.name === 'facilityId',
    )?.value,
  );

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

  await page.waitForURL('**/#/patients/*');

  // Click on the vaccines tab
  await page.getByRole('button', { name: 'Vaccines' }).click();

  // Click on record vaccine button
  await page.getByRole('button', { name: 'Record vaccine' }).click();
});
