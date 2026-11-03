import { Browser } from '@playwright/test';

import { TABLE_PAGE_SIZE_PREFERENCE_KEYS } from '@tamanu/constants';
import { test, expect } from '@fixtures/baseFixture';
import { LoginPage, SidebarPage } from '@pages/index';
import { InpatientsPage } from '@pages/patients/InpatientsPage';
import { setUserPreferenceViaApi } from '@utils/apiHelpers';

const getTestUser = () => {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;
  if (!email || !password) {
    throw new Error('TEST_EMAIL and TEST_PASSWORD environment variables must be set');
  }
  return { email, password };
};

// Logs in afresh in a separate browser context, so logging out there leaves the saved session the
// other specs share untouched
const signInInNewContext = async (browser: Browser) => {
  const { email, password } = getTestUser();
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(email, password);
  return { context, page, loginPage };
};

test.describe('remembered page size', () => {
  test('a page size picked on Inpatients is kept after logging out and back in', async ({
    browser,
    api,
    newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
  }) => {
    const { context, page, loginPage } = await signInInNewContext(browser);
    try {
      const inpatientsPage = new InpatientsPage(page);
      await inpatientsPage.goto();
      await inpatientsPage.patientTable.selectPageSize(100);

      await new SidebarPage(page).logOutButton.click();
      const { email, password } = getTestUser();
      await loginPage.login(email, password);
      await inpatientsPage.goto();

      await expect(inpatientsPage.patientTable.pageRecordCountDropDown).toHaveText('100');
    } finally {
      // The test user is shared with the other specs, so put their Inpatients size back
      await setUserPreferenceViaApi(api, TABLE_PAGE_SIZE_PREFERENCE_KEYS.INPATIENTS, 50);
      await context.close();
    }
  });
});
