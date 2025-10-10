import { testData } from '@utils/testData';
import { test, expect } from '../../fixtures/baseFixture';
import { getUser } from '../../utils/apiHelpers';

test.describe('inpatient table tests', () => {
  test.beforeEach(async ({ inpatientsPage }) => {
    await inpatientsPage.goto();
  });

  test.describe('search', () => {
    test('[T-0502][AT-0030] Search by NHN', async ({ newPatientWithHospitalAdmission, inpatientsPage }) => {
      const patientDisplayId = newPatientWithHospitalAdmission.displayId;
      await inpatientsPage.searchTable({ NHN: patientDisplayId, advancedSearch: false });
      await inpatientsPage.validateOneSearchResult();
      await inpatientsPage.validateFirstRowContainsNHN(patientDisplayId);
    });
    test('[T-0502][AT-0031]Search by first name', async ({ newPatientWithHospitalAdmission, inpatientsPage }) => {
      const patientFirstName = newPatientWithHospitalAdmission.firstName;
      await inpatientsPage.searchTable({ firstName: patientFirstName, advancedSearch: false });
      await inpatientsPage.validateAtLeastOneSearchResult();
      await inpatientsPage.validateAllRowsContain(patientFirstName!, 'firstName');
    });
    test('[T-0502][AT-0032]Search by last name', async ({ newPatientWithHospitalAdmission, inpatientsPage }) => {
      const patientLastName = newPatientWithHospitalAdmission.lastName;
      await inpatientsPage.searchTable({ lastName: patientLastName, advancedSearch: false });
      await inpatientsPage.validateAtLeastOneSearchResult();
      await inpatientsPage.validateAllRowsContain(patientLastName!, 'lastName');
    });
    test('[T-0502][AT-0033]Search by area', async ({
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
      inpatientsPage,
    }) => {
      const patientArea = testData.areaName;
      await inpatientsPage.searchTable({ area: patientArea, advancedSearch: false });
      await inpatientsPage.validateAtLeastOneSearchResult();
      await inpatientsPage.validateAllRowsContain(patientArea, 'locationGroupName');
    });
    test('[T-0502][AT-0034]Search by department', async ({
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
      inpatientsPage,
    }) => {
      const patientDepartment = testData.department;
      await inpatientsPage.searchTable({ department: patientDepartment, advancedSearch: true });
      await inpatientsPage.validateAtLeastOneSearchResult();
      await inpatientsPage.validateAllRowsContain(patientDepartment, 'departmentName');
    });
    test('[T-0502][AT-0035]Search by clinician', async ({
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
      inpatientsPage,
      api,
    }) => {
      const currentUser = await getUser(api);
      const patientClinician = currentUser.displayName;
      await inpatientsPage.searchTable({ clinician: patientClinician, advancedSearch: true });
      await inpatientsPage.validateAtLeastOneSearchResult();
      await inpatientsPage.validateAllRowsContain(patientClinician, 'clinician');
    });
    test('[T-0502][AT-0036]Search by first selected diet', async ({
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
      inpatientsPage,
    }) => {
      const patientDiet = testData.dietName;
      await inpatientsPage.searchTable({ diet: patientDiet, advancedSearch: true });
      await inpatientsPage.validateAtLeastOneSearchResult();
      await inpatientsPage.validateAllRowsContain(testData.dietSearchResult1, 'diets');
    });
    test('[T-0502][AT-0037]Search by second selected diet', async ({
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
      inpatientsPage,
    }) => {
      await inpatientsPage.searchTable({ diet: testData.dietName2, advancedSearch: true });
      await inpatientsPage.validateAtLeastOneSearchResult();
      await inpatientsPage.validateAllRowsContain(testData.dietSearchResult2, 'diets');
    });
    test('[T-0502][AT-0038]Search by filling all the fields', async ({
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
      await inpatientsPage.validateOneSearchResult();
      await inpatientsPage.validateFirstRowContainsNHN(newPatientWithHospitalAdmission.displayId);
      await inpatientsPage.validateAllRowsContain(testData.areaName, 'locationGroupName');
      await inpatientsPage.validateAllRowsContain(testData.department, 'departmentName');
      await inpatientsPage.validateAllRowsContain(currentUser.displayName, 'clinician');
      await inpatientsPage.validateAllRowsContain(testData.dietSearchResult1, 'diets');
    });
    test('[T-0502][AT-0039]Clear search', async ({ newPatientWithHospitalAdmission, inpatientsPage, api }) => {
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
    //skipping this test for now as it is failing in ci because of less than 10 inpatients
    test.skip('[AT-0040]number of patients in patient list defaulted to 10', async ({newPatientWithHospitalAdmission:_newPatientWithHospitalAdmission ,inpatientsPage }) => {
      await expect(inpatientsPage.patientTable.pageRecordCountDropDown).toHaveText('10');
      await inpatientsPage.patientTable.validateNumberOfPatients(10);
    });
//skipping this test for now as it is failing in ci because of less than 10 inpatients
    test.skip('[AT-0041]change number of patients per list to 25 and going to next page', async ({
      inpatientsPage,
    }) => {
      await expect(inpatientsPage.patientTable.pageRecordCountDropDown).toHaveText('10');
      await inpatientsPage.patientTable.pageRecordCountDropDown.click();
      await inpatientsPage.patientTable.patientPageRecordCount25.click();
      await inpatientsPage.patientTable.waitForTableToLoad();
      await inpatientsPage.patientTable.waitForTableRowCount(25);
      await inpatientsPage.patientTable.validateNumberOfPatients(25);
      await inpatientsPage.patientTable.patientPage2.click();
      await inpatientsPage.patientTable.waitForTableToLoad();
      await inpatientsPage.patientTable.waitForTableRowCount(25);
      await inpatientsPage.patientTable.validateNumberOfPatients(25);
      await expect(inpatientsPage.patientTable.pageRecordCount).toContainText('26–50 of');
    });

    //skipping this test for now as it is failing in ci because of less than 100 patients in the database.
    test.skip('[AT-0042]change number of patients per list to 50 and going to next page', async ({
      inpatientsPage,
    }) => {
      await expect(inpatientsPage.patientTable.pageRecordCountDropDown).toHaveText('10');
      await inpatientsPage.patientTable.pageRecordCountDropDown.click();
      await inpatientsPage.patientTable.patientPageRecordCount50.click();
      await inpatientsPage.patientTable.waitForTableToLoad();
      //await inpatientsPage.patientTable.waitForTableRowCount(50);
      await inpatientsPage.patientTable.validateNumberOfPatients(50);
      await inpatientsPage.patientTable.patientPage2.click();
      await inpatientsPage.patientTable.waitForTableToLoad();
      //await inpatientsPage.patientTable.waitForTableRowCount(50);
      await inpatientsPage.patientTable.validateNumberOfPatients(50);
    });
  });

  test.describe('sorting', () => {

  test('[AT-0043]Sort table by NHN in descending order', async ({ inpatientsPage, newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission }) => {
    await inpatientsPage.sortByNHN();
    await inpatientsPage.patientTable.waitForTableToLoad();
    await inpatientsPage.validateSortOrder(false, 'displayId');
  });

  test('[AT-0044]Sort table by NHN in ascending order', async ({ inpatientsPage, newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission }) => {
    await inpatientsPage.sortByNHN();
    await inpatientsPage.sortByNHN();
    await inpatientsPage.patientTable.waitForTableToLoad();
    await inpatientsPage.validateSortOrder(true, 'displayId');
  });

  test('[AT-0045]Sort table by First name in descending order', async ({ inpatientsPage, newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission }) => {
    await inpatientsPage.sortByFirstName();
    await inpatientsPage.patientTable.waitForTableToLoad();
    await inpatientsPage.validateSortOrder(false, 'firstName');
  });

  test('[AT-0046]Sort table by First name in ascending order', async ({ inpatientsPage, newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission }) => {
    await inpatientsPage.sortByFirstName();
    await inpatientsPage.sortByFirstName();
    await inpatientsPage.patientTable.waitForTableToLoad();
    await inpatientsPage.validateSortOrder(true, 'firstName');
  });

  test('[AT-0047]Sort table by Last name in descending order', async ({ inpatientsPage, newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission }) => {
    await inpatientsPage.sortByLastName();
    await inpatientsPage.patientTable.waitForTableToLoad();
    await inpatientsPage.validateSortOrder(false, 'lastName');
  });

  test('[AT-0048]Sort table by Last name in ascending order', async ({ inpatientsPage, newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission }) => {
    await inpatientsPage.sortByLastName();
    await inpatientsPage.sortByLastName();
    await inpatientsPage.patientTable.waitForTableToLoad();
    await inpatientsPage.validateSortOrder(true, 'lastName');
  });

  test('[AT-0049]Sort table by DOB in descending order', async ({ inpatientsPage, newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission }) => {
    await inpatientsPage.sortByDOB();
    await inpatientsPage.patientTable.waitForTableToLoad();
    await inpatientsPage.validateDateSortOrder(false);
  });

  test('[AT-0050]Sort table by DOB in ascending order', async ({ inpatientsPage, newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission }) => {
    await inpatientsPage.sortByDOB();
    await inpatientsPage.sortByDOB();
    await inpatientsPage.patientTable.waitForTableToLoad();
    await inpatientsPage.validateDateSortOrder(true);
  });
  
  //sorting by sex is opposite of other sorting in the app, with one click it is sorting in ascending.
  test('[AT-0051]Sort table by Sex in ascending order', async ({ inpatientsPage, newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission }) => {
    await inpatientsPage.sortBySex();
    await inpatientsPage.patientTable.waitForTableToLoad();
    await inpatientsPage.validateSortOrder(true, 'sex');
  });

//sorting by sex is opposite of other sorting in the app, with two clicks it is sorting in descending.
    test('[AT-0052]Sort table by Sex in descending order', async ({ inpatientsPage, newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission }) => {
      await inpatientsPage.sortBySex();
      await inpatientsPage.sortBySex();
      await inpatientsPage.patientTable.waitForTableToLoad();
      await inpatientsPage.validateSortOrder(false, 'sex');
    });
  });
});
