import { Browser } from '@playwright/test';

import { TABLE_PAGE_SIZE_PREFERENCE_KEYS } from '@tamanu/constants';
import { testData } from '@utils/testData';
import { test, expect } from '../../fixtures/baseFixture';
import { LoginPage, SidebarPage } from '../../pages';
import { InpatientsPage } from '../../pages/patients/InpatientsPage';
import { getUser, setUserPreferenceViaApi } from '../../utils/apiHelpers';

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
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  try {
    const page = await context.newPage();
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    const { email, password } = getTestUser();
    await loginPage.login(email, password);
    return { context, page, loginPage };
  } catch (error) {
    await context.close();
    throw error;
  }
};

test.describe('inpatient table tests', () => {
  test.beforeEach(async ({ inpatientsPage }) => {
    await inpatientsPage.goto();
  });

  test.describe('search', () => {
    test('[T-0502][AT-0030] Search by NHN', async ({
      newPatientWithHospitalAdmission,
      inpatientsPage,
    }) => {
      const patientDisplayId = newPatientWithHospitalAdmission.displayId;
      await inpatientsPage.searchTable({ NHN: patientDisplayId, advancedSearch: false });
      await inpatientsPage.validateOneSearchResult();
      await inpatientsPage.validateFirstRowContainsNHN(patientDisplayId);
    });
    test('[T-0502][AT-0039]Clear search', async ({
      newPatientWithHospitalAdmission,
      inpatientsPage,
      api,
    }) => {
      const currentUser = await getUser(api);
      await inpatientsPage.searchTable({
        NHN: newPatientWithHospitalAdmission.displayId,
        firstName: newPatientWithHospitalAdmission.firstName,
        lastName: newPatientWithHospitalAdmission.lastName,
        area: testData.areaName,
        department: testData.department,
        clinician: currentUser.displayName,
        diet: testData.dietName,
        advancedSearch: true,
      });
      await inpatientsPage.clearSearch();
      await inpatientsPage.validateAllFieldsAreEmpty();
    });
  });

  test.describe('pagination', () => {
    // These change the shared test user's remembered Inpatients size, so they run in order rather
    // than alongside each other, and put it back after each test, whether it passed or not
    test.describe.configure({ mode: 'default' });
    test.afterEach(async ({ api }) => {
      await setUserPreferenceViaApi(api, TABLE_PAGE_SIZE_PREFERENCE_KEYS.INPATIENTS, 50);
    });

    test('a page size picked on Inpatients is kept after logging out and back in', async ({
      browser,
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
    }) => {
      const { context, page, loginPage } = await signInInNewContext(browser);
      try {
        const inpatientsPage = new InpatientsPage(page);
        await inpatientsPage.goto();
        await inpatientsPage.patientTable.changePageSize(100);

        await new SidebarPage(page).logOutButton.click();
        const { email, password } = getTestUser();
        await loginPage.login(email, password);
        await inpatientsPage.goto();

        await expect(inpatientsPage.patientTable.pageRecordCountDropDown).toHaveText('100');
      } finally {
        await context.close();
      }
    });

    //skipping this test for now as it is failing in ci because of less than 50 inpatients
    test.skip('[AT-0040]number of patients in patient list defaulted to 50', async ({
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
      inpatientsPage,
    }) => {
      await expect(inpatientsPage.patientTable.pageRecordCountDropDown).toHaveText('50');
      await inpatientsPage.patientTable.validateNumberOfPatients(50);
    });

    //skipping this test for now as it is failing in ci because of less than 101 inpatients
    test.skip('[AT-0041]change number of patients per list to 100 and going to next page', async ({
      inpatientsPage,
    }) => {
      await expect(inpatientsPage.patientTable.pageRecordCountDropDown).toHaveText('50');
      await inpatientsPage.patientTable.pageRecordCountDropDown.click();
      await inpatientsPage.patientTable.patientPageRecordCount100.click();
      await inpatientsPage.patientTable.waitForTableToLoad();
      await inpatientsPage.patientTable.waitForTableRowCount(100);
      await inpatientsPage.patientTable.validateNumberOfPatients(100);
      await inpatientsPage.patientTable.patientPage2.click();
      await inpatientsPage.patientTable.waitForTableToLoad();
      await expect(inpatientsPage.patientTable.pageRecordCount).toContainText('Showing 101');
    });

    //skipping this test for now as it is failing in ci because of less than 51 inpatients
    test.skip('[AT-0042]change number of patients per list back to 50 and going to next page', async ({
      inpatientsPage,
    }) => {
      await inpatientsPage.patientTable.changePageSize(100);
      await inpatientsPage.patientTable.changePageSize(50);
      await inpatientsPage.patientTable.validateNumberOfPatients(50);
      await inpatientsPage.patientTable.patientPage2.click();
      await inpatientsPage.patientTable.waitForTableToLoad();
      await expect(inpatientsPage.patientTable.pageRecordCount).toContainText('Showing 51');
    });
  });

  test.describe('sorting', () => {
    test('[AT-0049]Sort table by DOB in descending order', async ({
      inpatientsPage,
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
    }) => {
      await inpatientsPage.sortByDOB();
      await inpatientsPage.patientTable.waitForTableToLoad();
      await inpatientsPage.validateDateSortOrder(false);
    });

    //sorting by sex is opposite of other sorting in the app, with one click it is sorting in ascending.
    test('[AT-0051]Sort table by Sex in ascending order', async ({
      inpatientsPage,
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
    }) => {
      await inpatientsPage.sortBySex();
      await inpatientsPage.patientTable.waitForTableToLoad();
      await inpatientsPage.validateSortOrder(true, 'sex');
    });

    test('Sort table by Area in ascending order', async ({
      inpatientsPage,
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
    }) => {
      await inpatientsPage.sortByArea();
      await inpatientsPage.patientTable.waitForTableToLoad();
      await inpatientsPage.validateSortOrder(true, 'locationGroupName');
    });

    test('Sort table by Location in ascending order', async ({
      inpatientsPage,
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
    }) => {
      await inpatientsPage.sortByLocation();
      await inpatientsPage.patientTable.waitForTableToLoad();
      await inpatientsPage.validateSortOrder(true, 'locationName');
    });

    test('Sort table by Department in ascending order', async ({
      inpatientsPage,
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
    }) => {
      await inpatientsPage.sortByDepartment();
      await inpatientsPage.patientTable.waitForTableToLoad();
      await inpatientsPage.validateSortOrder(true, 'departmentName');
    });

    test('Sort table by Clinician in ascending order', async ({
      inpatientsPage,
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
    }) => {
      await inpatientsPage.sortByClinician();
      await inpatientsPage.patientTable.waitForTableToLoad();
      await inpatientsPage.validateSortOrder(true, 'clinician');
    });
  });
});
