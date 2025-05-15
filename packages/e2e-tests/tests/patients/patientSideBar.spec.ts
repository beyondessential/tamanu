import { test, expect } from '../../fixtures/baseFixture';

test.describe('Patient Side Bar', () => {
  test('Add ongoing condition', async ({ allPatientsPage }) => {
    const pageContext = allPatientsPage.page.context();
    const authState = (await pageContext.storageState()).origins[0].localStorage.find(
      (item) => item.name === 'apiToken',
    );
    console.log('Auth state: ', authState);
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
