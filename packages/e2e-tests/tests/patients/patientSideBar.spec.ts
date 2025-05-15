import { test, expect } from '../../fixtures/baseFixture';

test.describe('Patient Side Bar', () => {
  test('Add ongoing condition', async ({ allPatientsPage }) => {
    allPatientsPage.page.on('request', async (request) => {
      if (request.url().includes('/api/')) {
        console.log('API call:', request.url());
        console.log('Authorization:', request.headers()['authorization']);
      }
    });

    await allPatientsPage.goto();
    await expect(allPatientsPage.page.getByTestId('topbarheading-bgnl')).toBeVisible();
  });
});
