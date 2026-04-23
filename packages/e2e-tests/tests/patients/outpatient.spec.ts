import { testData } from '../../utils/testData';
import { test, expect } from '../../fixtures/baseFixture';
import { getUser } from '../../utils/apiHelpers';

test.describe('outpatient table tests', () => {
  test.beforeEach(async ({ outpatientsPage }) => {
    await outpatientsPage.goto();
  });

  test.describe('search', () => {
    test('[T-0513][AT-0116]Search by NHN', async ({
      newPatientWithClinicAdmission,
      outpatientsPage,
    }) => {
      const patientDisplayId = newPatientWithClinicAdmission.displayId;
      await outpatientsPage.searchTable({ NHN: patientDisplayId, advancedSearch: false });
      await outpatientsPage.validateOneSearchResult();
      await outpatientsPage.validateFirstRowContainsNHN(patientDisplayId);
    });

    test('[T-0513][AT-0123]Clear search', async ({
      newPatientWithClinicAdmission,
      outpatientsPage,
      api,
    }) => {
      const currentUser = await getUser(api);
      await outpatientsPage.searchTable({
        NHN: newPatientWithClinicAdmission.displayId,
        firstName: newPatientWithClinicAdmission.firstName,
        lastName: newPatientWithClinicAdmission.lastName,
        area: testData.areaName,
        department: testData.department,
        clinician: currentUser.displayName,
        advancedSearch: true,
      });
      await outpatientsPage.clearSearch();
      await outpatientsPage.validateAllFieldsAreEmpty();
    });
  });

  test.describe('pagination', () => {
    //skipping this test for now as it is failing in ci because of less than 10 outpatients
    test.skip('[AT-0124]number of patients in patient list defaulted to 10', async ({
      outpatientsPage,
    }) => {
      await expect(outpatientsPage.patientTable.pageRecordCountDropDown).toHaveText('10');
      await outpatientsPage.patientTable.validateNumberOfPatients(10);
    });

    //skipping this test for now as it is failing in ci because of less than 10 outpatients
    test.skip('[AT-0125]change number of patients per list to 25 and going to next page', async ({
      outpatientsPage,
    }) => {
      await expect(outpatientsPage.patientTable.pageRecordCountDropDown).toHaveText('10');
      await outpatientsPage.patientTable.pageRecordCountDropDown.click();
      await outpatientsPage.patientTable.patientPageRecordCount25.click();
      await outpatientsPage.patientTable.waitForTableToLoad();
      await outpatientsPage.patientTable.waitForTableRowCount(25);
      await outpatientsPage.patientTable.validateNumberOfPatients(25);
      await outpatientsPage.patientTable.patientPage2.click();
      await outpatientsPage.patientTable.waitForTableToLoad();
      await expect(outpatientsPage.patientTable.pageRecordCount).toContainText('26');
    });

    //skipping this test for now as it is failing in ci because of less than 100 patients in the database.
    test.skip('[AT-0126]change number of patients per list to 50 and going to next page', async ({
      outpatientsPage,
    }) => {
      await expect(outpatientsPage.patientTable.pageRecordCountDropDown).toHaveText('10');
      await outpatientsPage.patientTable.pageRecordCountDropDown.click();
      await outpatientsPage.patientTable.patientPageRecordCount50.click();
      await outpatientsPage.patientTable.waitForTableToLoad();
      //await outpatientsPage.patientTable.waitForTableRowCount(50);
      await outpatientsPage.patientTable.validateNumberOfPatients(50);
      await outpatientsPage.patientTable.patientPage2.click();
      await outpatientsPage.patientTable.waitForTableToLoad();
      //await outpatientsPage.patientTable.waitForTableRowCount(50);
      await outpatientsPage.patientTable.validateNumberOfPatients(50);
    });
  });

  test.describe('sorting', () => {
    test('[AT-0127]Sort table by NHN in descending order', async ({
      outpatientsPage,
      newPatientWithClinicAdmission: _newPatientWithClinicAdmission,
    }) => {
      await outpatientsPage.sortByNHN();
      await outpatientsPage.patientTable.waitForTableToLoad();
      await outpatientsPage.validateSortOrder(false, 'displayId');
    });
  });
});
