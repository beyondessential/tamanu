import { test } from '../../fixtures/baseFixture';

test.describe('Patient Side Bar', () => {
  test.beforeEach(async ({ allPatientsPage }) => {
    await allPatientsPage.goto();
  });
  test.describe('Death workflow', () => {
    test('Record death - Male, 3 months', async () => {});
  });
});
