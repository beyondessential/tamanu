import { testData } from '../../utils/testData';
import { test, expect } from '../../fixtures/baseFixture';
import { getUser } from '../../utils/apiHelpers';

test.describe('outpatient table tests', () => {
  test.beforeEach(async ({ outpatientsPage }) => {
    await outpatientsPage.goto();
  });

  test.describe('search', () => {
    test('Search by NHN', async ({ newPatientWithClinicAdmission, outpatientsPage }) => {
      const patientDisplayId = newPatientWithClinicAdmission.displayId;
      await outpatientsPage.searchTable({ NHN: patientDisplayId, advancedSearch: false });
      await outpatientsPage.validateOneSearchResult();
      await outpatientsPage.validateFirstRowContainsNHN(patientDisplayId);
    });

    test('Search by first name', async ({ newPatientWithClinicAdmission, outpatientsPage }) => {
      const patientFirstName = newPatientWithClinicAdmission.firstName;
      await outpatientsPage.searchTable({ firstName: patientFirstName, advancedSearch: false });
      await outpatientsPage.validateAtLeastOneSearchResult();
      await outpatientsPage.validateAllRowsContain(patientFirstName!, 'firstName');
    });

    test('Search by last name', async ({ newPatientWithClinicAdmission, outpatientsPage }) => {
      const patientLastName = newPatientWithClinicAdmission.lastName;
      await outpatientsPage.searchTable({ lastName: patientLastName, advancedSearch: false });
      await outpatientsPage.validateAtLeastOneSearchResult();
      await outpatientsPage.validateAllRowsContain(patientLastName!, 'lastName');
    });

    test('Search by area', async ({ newPatientWithClinicAdmission: _newPatientWithClinicAdmission, outpatientsPage }) => {
      const patientArea = testData.areaName;
      await outpatientsPage.searchTable({ area: patientArea, advancedSearch: false });
      await outpatientsPage.validateAtLeastOneSearchResult();
      await outpatientsPage.validateAllRowsContain(patientArea, 'locationGroupName');
    });

    test('Search by department', async ({ newPatientWithClinicAdmission: _newPatientWithClinicAdmission, outpatientsPage }) => {
      const patientDepartment = testData.department;
      await outpatientsPage.searchTable({ department: patientDepartment, advancedSearch: true });
      await outpatientsPage.validateAtLeastOneSearchResult();
      await outpatientsPage.validateAllRowsContain(patientDepartment, 'departmentName');
    });

    test('Search by clinician', async ({ newPatientWithClinicAdmission: _newPatientWithClinicAdmission, outpatientsPage, api }) => {
      const currentUser = await getUser(api);
      const patientClinician = currentUser.displayName;
      await outpatientsPage.searchTable({ clinician: patientClinician, advancedSearch: true });
      await outpatientsPage.validateAtLeastOneSearchResult();
      await outpatientsPage.validateAllRowsContain(patientClinician, 'clinician');
    });

    test('Search by filling all the fields', async ({ newPatientWithClinicAdmission, outpatientsPage, api }) => {
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
      await outpatientsPage.validateOneSearchResult();
      await outpatientsPage.validateFirstRowContainsNHN(newPatientWithClinicAdmission.displayId);
      await outpatientsPage.validateAllRowsContain(testData.areaName, 'locationGroupName');
      await outpatientsPage.validateAllRowsContain(testData.department, 'departmentName');
      await outpatientsPage.validateAllRowsContain(currentUser.displayName, 'clinician');
    });

    test('Clear search', async ({ newPatientWithClinicAdmission, outpatientsPage, api }) => {
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
    test.skip('number of patients in patient list defaulted to 10', async ({ outpatientsPage }) => {
      await expect(outpatientsPage.patientTable.pageRecordCountDropDown).toHaveText('10');
      await outpatientsPage.patientTable.validateNumberOfPatients(10);
    });

    //skipping this test for now as it is failing in ci because of less than 10 outpatients
    test.skip('change number of patients per list to 25 and going to next page', async ({
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
    test.skip('change number of patients per list to 50 and going to next page', async ({
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

  test('Sort table by NHN in descending order', async ({ outpatientsPage, newPatientWithClinicAdmission: _newPatientWithClinicAdmission }) => {
    await outpatientsPage.sortByNHN();
    await outpatientsPage.patientTable.waitForTableToLoad();
    await outpatientsPage.validateSortOrder(false, 'displayId');
  });

  test('Sort table by NHN in ascending order', async ({ outpatientsPage, newPatientWithClinicAdmission: _newPatientWithClinicAdmission }) => {
    await outpatientsPage.sortByNHN();
    await outpatientsPage.sortByNHN();
    await outpatientsPage.patientTable.waitForTableToLoad();
    await outpatientsPage.validateSortOrder(true, 'displayId');
  });

  test('Sort table by First name in descending order', async ({ outpatientsPage, newPatientWithClinicAdmission: _newPatientWithClinicAdmission }) => {
    await outpatientsPage.sortByFirstName();
    await outpatientsPage.patientTable.waitForTableToLoad();
    await outpatientsPage.validateSortOrder(false, 'firstName');
  });

  test('Sort table by First name in ascending order', async ({ outpatientsPage, newPatientWithClinicAdmission: _newPatientWithClinicAdmission }) => {
    await outpatientsPage.sortByFirstName();
    await outpatientsPage.sortByFirstName();
    await outpatientsPage.patientTable.waitForTableToLoad();
    await outpatientsPage.validateSortOrder(true, 'firstName');
  });

  test('Sort table by Last name in descending order', async ({ outpatientsPage, newPatientWithClinicAdmission: _newPatientWithClinicAdmission }) => {
    await outpatientsPage.sortByLastName();
    await outpatientsPage.patientTable.waitForTableToLoad();
    await outpatientsPage.validateSortOrder(false, 'lastName');
  });

    test('Sort table by Last name in ascending order', async ({ outpatientsPage, newPatientWithClinicAdmission: _newPatientWithClinicAdmission }) => {
      await outpatientsPage.sortByLastName();
      await outpatientsPage.sortByLastName();
      await outpatientsPage.patientTable.waitForTableToLoad();
      await outpatientsPage.validateSortOrder(true, 'lastName');
    });
  });
});
