import { testData } from '@utils/testData';
import { test, expect } from '../../fixtures/baseFixture';
import { getUser } from '../../utils/apiHelpers';

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
      await expect(inpatientsPage.patientTable.pageRecordCount).toContainText('101');
      // The chosen size is remembered for the test user, so put it back for other tests
      await inpatientsPage.patientTable.selectPageSize(50);
    });

    //skipping this test for now as it is failing in ci because of less than 51 inpatients
    test.skip('[AT-0042]change number of patients per list back to 50 and going to next page', async ({
      inpatientsPage,
    }) => {
      await inpatientsPage.patientTable.selectPageSize(100);
      await inpatientsPage.patientTable.selectPageSize(50);
      await inpatientsPage.patientTable.validateNumberOfPatients(50);
      await inpatientsPage.patientTable.patientPage2.click();
      await inpatientsPage.patientTable.waitForTableToLoad();
      await expect(inpatientsPage.patientTable.pageRecordCount).toContainText('51');
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
