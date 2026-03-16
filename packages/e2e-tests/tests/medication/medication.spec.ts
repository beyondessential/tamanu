import { test, expect } from '../../fixtures/baseFixture';

test.describe('Medication Requests', () => {
  test('should navigate to active medication requests page', async ({
    medicationRequestsPage,
  }) => {
    await medicationRequestsPage.goto();
    await medicationRequestsPage.waitForPageToLoad();

    await expect(medicationRequestsPage.pageContainer).toBeVisible();
  });

  test('should display search section on medication requests page', async ({
    medicationRequestsPage,
  }) => {
    await medicationRequestsPage.goto();
    await medicationRequestsPage.waitForPageToLoad();

    await expect(medicationRequestsPage.contentPane).toBeVisible();
    await expect(medicationRequestsPage.searchTitle).toBeVisible();
  });
});
