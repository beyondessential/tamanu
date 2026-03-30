import { test, expect } from '../../fixtures/test';
import { getUser } from '../../fixtures/api';
import { seeds } from '@data/seeds';
import { toIsoDate, toTableDate } from '@helpers/dates';
import { ids } from '@ids';

test.describe('outpatient table tests', () => {
  test.beforeEach(async ({ outpatientsPage }) => {
    await outpatientsPage.goto();
  });

  test.describe('search', () => {
    test('[T-0513][AT-0116]Search by NHN', async ({ newPatientWithClinicAdmission, outpatientsPage }) => {
      const patientDisplayId = newPatientWithClinicAdmission.displayId;
      await outpatientsPage.search({ NHN: patientDisplayId, advancedSearch: false });
      await outpatientsPage.table.expectOneResult();
      await outpatientsPage.table.expectFirstRowNHN(patientDisplayId);
      await expect(outpatientsPage.table.cell(0, 'dateOfBirth')).toContainText(
        toTableDate(toIsoDate(String(newPatientWithClinicAdmission.dateOfBirth!))),
      );
    });

    test('[T-0513][AT-0117]Search by first name', async ({ newPatientWithClinicAdmission, outpatientsPage }) => {
      const patientFirstName = newPatientWithClinicAdmission.firstName;
      await outpatientsPage.search({ firstName: patientFirstName, advancedSearch: false });
      await outpatientsPage.table.waitForData('firstName');
      await outpatientsPage.table.expectAllRowsContain('firstName', patientFirstName!);
    });

    test('[T-0513][AT-0118]Search by last name', async ({ newPatientWithClinicAdmission, outpatientsPage }) => {
      const patientLastName = newPatientWithClinicAdmission.lastName;
      await outpatientsPage.search({ lastName: patientLastName, advancedSearch: false });
      await outpatientsPage.table.waitForData('lastName');
      await outpatientsPage.table.expectAllRowsContain('lastName', patientLastName!);
    });

    test('[T-0513][AT-0119]Search by area', async ({
      newPatientWithClinicAdmission: _newPatientWithClinicAdmission,
      outpatientsPage,
    }) => {
      const patientArea = seeds.areaName;
      await outpatientsPage.search({ area: patientArea, advancedSearch: false });
      await outpatientsPage.table.waitForData('locationGroupName');
      await outpatientsPage.table.expectAllRowsContain('locationGroupName', patientArea);
    });

    test('[T-0513][AT-0120]Search by department', async ({
      newPatientWithClinicAdmission: _newPatientWithClinicAdmission,
      outpatientsPage,
    }) => {
      const patientDepartment = seeds.department;
      await outpatientsPage.search({ department: patientDepartment, advancedSearch: true });
      await outpatientsPage.table.waitForData('departmentName');
      await outpatientsPage.table.expectAllRowsContain('departmentName', patientDepartment);
    });

    test('[T-0513][AT-0121]Search by clinician', async ({
      newPatientWithClinicAdmission: _newPatientWithClinicAdmission,
      outpatientsPage,
      api,
    }) => {
      const currentUser = await getUser(api);
      const patientClinician = currentUser.displayName;
      await outpatientsPage.search({ clinician: patientClinician, advancedSearch: true });
      await outpatientsPage.table.waitForData('clinician');
      await outpatientsPage.table.expectAllRowsContain('clinician', patientClinician);
    });

    test('[T-0513][AT-0122]Search by filling all the fields', async ({
      newPatientWithClinicAdmission,
      outpatientsPage,
      api,
    }) => {
      const currentUser = await getUser(api);
      await outpatientsPage.search({
        NHN: newPatientWithClinicAdmission.displayId,
        firstName: newPatientWithClinicAdmission.firstName,
        lastName: newPatientWithClinicAdmission.lastName,
        area: seeds.areaName,
        department: seeds.department,
        clinician: currentUser.displayName,
        advancedSearch: true,
      });
      await outpatientsPage.table.expectOneResult();
      await outpatientsPage.table.expectFirstRowNHN(newPatientWithClinicAdmission.displayId);
      await outpatientsPage.table.expectAllRowsContain('locationGroupName', seeds.areaName);
      await outpatientsPage.table.expectAllRowsContain('departmentName', seeds.department);
      await outpatientsPage.table.expectAllRowsContain('clinician', currentUser.displayName);
    });

    test('[T-0513][AT-0123]Clear search', async ({ newPatientWithClinicAdmission, outpatientsPage, api }) => {
      const currentUser = await getUser(api);
      await outpatientsPage.search({
        NHN: newPatientWithClinicAdmission.displayId,
        firstName: newPatientWithClinicAdmission.firstName,
        lastName: newPatientWithClinicAdmission.lastName,
        area: seeds.areaName,
        department: seeds.department,
        clinician: currentUser.displayName,
        advancedSearch: true,
      });
      await outpatientsPage.clearSearch();
      await outpatientsPage.validateAllFieldsAreEmpty();
    });
  });

  test.describe('pagination', () => {
    //skipping this test for now as it is failing in ci because of less than 10 outpatients
    test.skip('[AT-0124]number of patients in patient list defaulted to 10', async ({ outpatientsPage }) => {
      await expect(outpatientsPage.page.getByTestId(ids.table.recordCountDropdown)).toHaveText('10');
      await outpatientsPage.table.expectRowCount(10);
    });

    //skipping this test for now as it is failing in ci because of less than 10 outpatients
    test.skip('[AT-0125]change number of patients per list to 25 and going to next page', async ({
      outpatientsPage,
    }) => {
      await expect(outpatientsPage.page.getByTestId(ids.table.recordCountDropdown)).toHaveText('10');
      await outpatientsPage.table.setPageSize(25);
      await outpatientsPage.table.waitForTable();
      await outpatientsPage.table.expectRowCount(25);
      await outpatientsPage.table.goToPage(2);
      await outpatientsPage.table.waitForTable();
      await expect(outpatientsPage.table.pageRecordCount).toContainText('26');
    });

    //skipping this test for now as it is failing in ci because of less than 100 patients in the database.
    test.skip('[AT-0126]change number of patients per list to 50 and going to next page', async ({
      outpatientsPage,
    }) => {
      await expect(outpatientsPage.page.getByTestId(ids.table.recordCountDropdown)).toHaveText('10');
      await outpatientsPage.table.setPageSize(50);
      await outpatientsPage.table.waitForTable();
      //await outpatientsPage.table.expectRowCount(50);
      await outpatientsPage.table.expectRowCount(50);
      await outpatientsPage.table.goToPage(2);
      await outpatientsPage.table.waitForTable();
      //await outpatientsPage.table.expectRowCount(50);
      await outpatientsPage.table.expectRowCount(50);
    });
  });

  test.describe('sorting', () => {
    test('[AT-0127]Sort table by NHN in descending order', async ({
      outpatientsPage,
      newPatientWithClinicAdmission: _newPatientWithClinicAdmission,
    }) => {
      await outpatientsPage.table.sortBy('displayId');
      await outpatientsPage.table.waitForTable();
      await outpatientsPage.table.expectSorted('displayId', 'desc');
    });

    test('[AT-0128]Sort table by NHN in ascending order', async ({
      outpatientsPage,
      newPatientWithClinicAdmission: _newPatientWithClinicAdmission,
    }) => {
      await outpatientsPage.table.sortBy('displayId');
      await outpatientsPage.table.sortBy('displayId');
      await outpatientsPage.table.waitForTable();
      await outpatientsPage.table.expectSorted('displayId', 'asc');
    });

    test('[AT-0129]Sort table by First name in descending order', async ({
      outpatientsPage,
      newPatientWithClinicAdmission: _newPatientWithClinicAdmission,
    }) => {
      await outpatientsPage.table.sortBy('firstName');
      await outpatientsPage.table.waitForTable();
      await outpatientsPage.table.expectSorted('firstName', 'desc');
    });

    test('[AT-0130]Sort table by First name in ascending order', async ({
      outpatientsPage,
      newPatientWithClinicAdmission: _newPatientWithClinicAdmission,
    }) => {
      await outpatientsPage.table.sortBy('firstName');
      await outpatientsPage.table.sortBy('firstName');
      await outpatientsPage.table.waitForTable();
      await outpatientsPage.table.expectSorted('firstName', 'asc');
    });

    test('[AT-0131]Sort table by Last name in descending order', async ({
      outpatientsPage,
      newPatientWithClinicAdmission: _newPatientWithClinicAdmission,
    }) => {
      await outpatientsPage.table.sortBy('lastName');
      await outpatientsPage.table.waitForTable();
      await outpatientsPage.table.expectSorted('lastName', 'desc');
    });

    test('[AT-0132]Sort table by Last name in ascending order', async ({
      outpatientsPage,
      newPatientWithClinicAdmission: _newPatientWithClinicAdmission,
    }) => {
      await outpatientsPage.table.sortBy('lastName');
      await outpatientsPage.table.sortBy('lastName');
      await outpatientsPage.table.waitForTable();
      await outpatientsPage.table.expectSorted('lastName', 'asc');
    });
  });
});
