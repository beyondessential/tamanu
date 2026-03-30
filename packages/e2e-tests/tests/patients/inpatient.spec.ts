import { test, expect } from '../../fixtures/test';
import { getUser } from '../../fixtures/api';
import { seeds } from '@data/seeds';
import { toIsoDate, toTableDate } from '@helpers/dates';
import { ids } from '@ids';

test.describe('inpatient table tests', () => {
  test.beforeEach(async ({ inpatientsPage }) => {
    await inpatientsPage.goto();
  });

  test.describe('search', () => {
    test('[T-0502][AT-0030] Search by NHN', async ({ newPatientWithHospitalAdmission, inpatientsPage }) => {
      const patientDisplayId = newPatientWithHospitalAdmission.displayId;
      await inpatientsPage.search({ NHN: patientDisplayId, advancedSearch: false });
      await inpatientsPage.table.expectOneResult();
      await inpatientsPage.table.expectFirstRowNHN(patientDisplayId);
      await expect(inpatientsPage.table.cell(0, 'dateOfBirth')).toContainText(
        toTableDate(toIsoDate(String(newPatientWithHospitalAdmission.dateOfBirth!))),
      );
    });
    test('[T-0502][AT-0031]Search by first name', async ({ newPatientWithHospitalAdmission, inpatientsPage }) => {
      const patientFirstName = newPatientWithHospitalAdmission.firstName;
      await inpatientsPage.search({ firstName: patientFirstName, advancedSearch: false });
      await inpatientsPage.table.waitForData('firstName');
      await inpatientsPage.table.expectAllRowsContain('firstName', patientFirstName!);
    });
    test('[T-0502][AT-0032]Search by last name', async ({ newPatientWithHospitalAdmission, inpatientsPage }) => {
      const patientLastName = newPatientWithHospitalAdmission.lastName;
      await inpatientsPage.search({ lastName: patientLastName, advancedSearch: false });
      await inpatientsPage.table.waitForData('lastName');
      await inpatientsPage.table.expectAllRowsContain('lastName', patientLastName!);
    });
    test('[T-0502][AT-0033]Search by area', async ({
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
      inpatientsPage,
    }) => {
      const patientArea = seeds.areaName;
      await inpatientsPage.search({ area: patientArea, advancedSearch: false });
      await inpatientsPage.table.waitForData('locationGroupName');
      await inpatientsPage.table.expectAllRowsContain('locationGroupName', patientArea);
    });
    test('[T-0502][AT-0034]Search by department', async ({
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
      inpatientsPage,
    }) => {
      const patientDepartment = seeds.department;
      await inpatientsPage.search({ department: patientDepartment, advancedSearch: true });
      await inpatientsPage.table.waitForData('departmentName');
      await inpatientsPage.table.expectAllRowsContain('departmentName', patientDepartment);
    });
    test('[T-0502][AT-0035]Search by clinician', async ({
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
      inpatientsPage,
      api,
    }) => {
      const currentUser = await getUser(api);
      const patientClinician = currentUser.displayName;
      await inpatientsPage.search({ clinician: patientClinician, advancedSearch: true });
      await inpatientsPage.table.waitForData('clinician');
      await inpatientsPage.table.expectAllRowsContain('clinician', patientClinician);
    });
    test('[T-0502][AT-0036]Search by first selected diet', async ({
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
      inpatientsPage,
    }) => {
      const patientDiet = seeds.dietName;
      await inpatientsPage.search({ diet: patientDiet, advancedSearch: true });
      await inpatientsPage.table.waitForData('diets');
      await inpatientsPage.table.expectAllRowsContain('diets', seeds.dietSearchResult1);
    });
    test('[T-0502][AT-0037]Search by second selected diet', async ({
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
      inpatientsPage,
    }) => {
      await inpatientsPage.search({ diet: seeds.dietName2, advancedSearch: true });
      await inpatientsPage.table.waitForData('diets');
      await inpatientsPage.table.expectAllRowsContain('diets', seeds.dietSearchResult2);
    });
    test('[T-0502][AT-0038]Search by filling all the fields', async ({
      newPatientWithHospitalAdmission,
      inpatientsPage,
      api,
    }) => {
      const currentUser = await getUser(api);
      await inpatientsPage.search({
        NHN: newPatientWithHospitalAdmission.displayId,
        firstName: newPatientWithHospitalAdmission.firstName,
        lastName: newPatientWithHospitalAdmission.lastName,
        area: seeds.areaName,
        department: seeds.department,
        clinician: currentUser.displayName,
        diet: seeds.dietName,
        advancedSearch: true,
      });
      await inpatientsPage.table.expectOneResult();
      await inpatientsPage.table.expectFirstRowNHN(newPatientWithHospitalAdmission.displayId);
      await inpatientsPage.table.expectAllRowsContain('locationGroupName', seeds.areaName);
      await inpatientsPage.table.expectAllRowsContain('departmentName', seeds.department);
      await inpatientsPage.table.expectAllRowsContain('clinician', currentUser.displayName);
      await inpatientsPage.table.expectAllRowsContain('diets', seeds.dietSearchResult1);
    });
    test('[T-0502][AT-0039]Clear search', async ({ newPatientWithHospitalAdmission, inpatientsPage, api }) => {
      const currentUser = await getUser(api);
      await inpatientsPage.search({
        NHN: newPatientWithHospitalAdmission.displayId,
        firstName: newPatientWithHospitalAdmission.firstName,
        lastName: newPatientWithHospitalAdmission.lastName,
        area: seeds.areaName,
        department: seeds.department,
        clinician: currentUser.displayName,
        diet: seeds.dietName,
        advancedSearch: true,
      });
      await inpatientsPage.clearSearch();
      await inpatientsPage.validateAllFieldsAreEmpty();
    });
  });

  test.describe('pagination', () => {
    //skipping this test for now as it is failing in ci because of less than 10 inpatients
    test.skip('[AT-0040]number of patients in patient list defaulted to 10', async ({
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
      inpatientsPage,
    }) => {
      await expect(inpatientsPage.page.getByTestId(ids.table.recordCountDropdown)).toHaveText('10');
      await inpatientsPage.table.expectRowCount(10);
    });
    //skipping this test for now as it is failing in ci because of less than 10 inpatients
    test.skip('[AT-0041]change number of patients per list to 25 and going to next page', async ({
      inpatientsPage,
    }) => {
      await expect(inpatientsPage.page.getByTestId(ids.table.recordCountDropdown)).toHaveText('10');
      await inpatientsPage.table.setPageSize(25);
      await inpatientsPage.table.waitForTable();
      await inpatientsPage.table.expectRowCount(25);
      await inpatientsPage.table.goToPage(2);
      await inpatientsPage.table.waitForTable();
      await inpatientsPage.table.expectRowCount(25);
      await expect(inpatientsPage.table.pageRecordCount).toContainText('26–50 of');
    });

    //skipping this test for now as it is failing in ci because of less than 100 patients in the database.
    test.skip('[AT-0042]change number of patients per list to 50 and going to next page', async ({
      inpatientsPage,
    }) => {
      await expect(inpatientsPage.page.getByTestId(ids.table.recordCountDropdown)).toHaveText('10');
      await inpatientsPage.table.setPageSize(50);
      await inpatientsPage.table.waitForTable();
      //await inpatientsPage.table.expectRowCount(50);
      await inpatientsPage.table.expectRowCount(50);
      await inpatientsPage.table.goToPage(2);
      await inpatientsPage.table.waitForTable();
      //await inpatientsPage.table.expectRowCount(50);
      await inpatientsPage.table.expectRowCount(50);
    });
  });

  test.describe('sorting', () => {
    test('[AT-0043]Sort table by NHN in descending order', async ({
      inpatientsPage,
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
    }) => {
      await inpatientsPage.table.sortBy('displayId');
      await inpatientsPage.table.waitForTable();
      await inpatientsPage.table.expectSorted('displayId', 'desc');
    });

    test('[AT-0044]Sort table by NHN in ascending order', async ({
      inpatientsPage,
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
    }) => {
      await inpatientsPage.table.sortBy('displayId');
      await inpatientsPage.table.sortBy('displayId');
      await inpatientsPage.table.waitForTable();
      await inpatientsPage.table.expectSorted('displayId', 'asc');
    });

    test('[AT-0045]Sort table by First name in descending order', async ({
      inpatientsPage,
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
    }) => {
      await inpatientsPage.table.sortBy('firstName');
      await inpatientsPage.table.waitForTable();
      await inpatientsPage.table.expectSorted('firstName', 'desc');
    });

    test('[AT-0046]Sort table by First name in ascending order', async ({
      inpatientsPage,
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
    }) => {
      await inpatientsPage.table.sortBy('firstName');
      await inpatientsPage.table.sortBy('firstName');
      await inpatientsPage.table.waitForTable();
      await inpatientsPage.table.expectSorted('firstName', 'asc');
    });

    test('[AT-0047]Sort table by Last name in descending order', async ({
      inpatientsPage,
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
    }) => {
      await inpatientsPage.table.sortBy('lastName');
      await inpatientsPage.table.waitForTable();
      await inpatientsPage.table.expectSorted('lastName', 'desc');
    });

    test('[AT-0048]Sort table by Last name in ascending order', async ({
      inpatientsPage,
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
    }) => {
      await inpatientsPage.table.sortBy('lastName');
      await inpatientsPage.table.sortBy('lastName');
      await inpatientsPage.table.waitForTable();
      await inpatientsPage.table.expectSorted('lastName', 'asc');
    });

    test('[AT-0049]Sort table by DOB in descending order', async ({
      inpatientsPage,
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
    }) => {
      await inpatientsPage.table.sortBy('dateOfBirth');
      await inpatientsPage.table.waitForTable();
      await inpatientsPage.table.expectDateSorted('dateOfBirth', 'desc');
    });

    test('[AT-0050]Sort table by DOB in ascending order', async ({
      inpatientsPage,
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
    }) => {
      await inpatientsPage.table.sortBy('dateOfBirth');
      await inpatientsPage.table.sortBy('dateOfBirth');
      await inpatientsPage.table.waitForTable();
      await inpatientsPage.table.expectDateSorted('dateOfBirth', 'asc');
    });

    //sorting by sex is opposite of other sorting in the app, with one click it is sorting in ascending.
    test('[AT-0051]Sort table by Sex in ascending order', async ({
      inpatientsPage,
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
    }) => {
      await inpatientsPage.table.sortBy('sex');
      await inpatientsPage.table.waitForTable();
      await inpatientsPage.table.expectSorted('sex', 'asc');
    });

    //sorting by sex is opposite of other sorting in the app, with two clicks it is sorting in descending.
    test('[AT-0052]Sort table by Sex in descending order', async ({
      inpatientsPage,
      newPatientWithHospitalAdmission: _newPatientWithHospitalAdmission,
    }) => {
      await inpatientsPage.table.sortBy('sex');
      await inpatientsPage.table.sortBy('sex');
      await inpatientsPage.table.waitForTable();
      await inpatientsPage.table.expectSorted('sex', 'desc');
    });
  });
});
