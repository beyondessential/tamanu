import { Browser } from '@playwright/test';

import { test, expect } from '@fixtures/baseFixture';
import { LoginPage, SidebarPage } from '@pages/index';
import { InpatientsPage } from '@pages/patients/InpatientsPage';
import { testData } from '@utils/testData';

// Runs as the practitioner in a fresh session, so the page size it picks is remembered for that
// user only and never changes what the shared test user sees in other specs.
const signInAsPractitioner = async (browser: Browser) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(testData.practitionerUser.email, testData.practitionerUser.password);
  return { context, page, loginPage };
};

test.describe('remembered page size', () => {
  test('a page size picked on Inpatients is kept after logging out and back in', async ({
    browser,
    newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
  }) => {
    const { context, page, loginPage } = await signInAsPractitioner(browser);
    const inpatientsPage = new InpatientsPage(page);

    await inpatientsPage.goto();
    await inpatientsPage.patientTable.selectPageSize(100);

    await new SidebarPage(page).logOutButton.click();
    await loginPage.login(testData.practitionerUser.email, testData.practitionerUser.password);
    await inpatientsPage.goto();
    await expect(inpatientsPage.patientTable.pageRecordCountDropDown).toHaveText('100');

    // Put the practitioner back at the default so the next run starts from it
    await inpatientsPage.patientTable.selectPageSize(50);
    await context.close();
  });
});
