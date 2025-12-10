import { test } from '../../fixtures/baseFixture';
import { recordPatientDeathViaApi } from '../../utils/apiHelpers';
import { expect } from '@playwright/test';
import { testData } from '../../utils/testData';

test.describe('All patient table tests', () => {
  test.beforeEach(async ({ allPatientsPage }) => {
    await allPatientsPage.goto();
  });

  test.describe('search', () => {
    test('[T-0027][AT-0001]Search by NHN', async ({ newPatient, allPatientsPage }) => {
      await allPatientsPage.searchTable({ NHN: newPatient.displayId, advancedSearch: false });
      await allPatientsPage.validateOneSearchResult();
      await allPatientsPage.validateFirstRowContainsNHN(newPatient.displayId);
    });

    test('[T-0027][AT-0002]Search by first name', async ({ newPatient, allPatientsPage }) => {
      await allPatientsPage.searchTable({ firstName: newPatient.firstName, advancedSearch: false });
      await allPatientsPage.validateAtLeastOneSearchResult();
      await allPatientsPage.validateAllRowsContain(newPatient.firstName!, 'firstName');
    });

    test('[T-0027][AT-0003]Search by last name', async ({ newPatient, allPatientsPage }) => {
      await allPatientsPage.searchTable({ lastName: newPatient.lastName, advancedSearch: false });
      await allPatientsPage.validateAtLeastOneSearchResult();
      await allPatientsPage.validateAllRowsContain(newPatient.lastName!, 'lastName');
    });

    test('[T-0027][AT-0004]Search by DOB', async ({ newPatient, allPatientsPage }) => {
      console.log('newPatient.dateOfBirth', newPatient.dateOfBirth);
      await allPatientsPage.searchTable({ DOB: newPatient.dateOfBirth, advancedSearch: false });
      await allPatientsPage.validateAtLeastOneSearchResult();
      await allPatientsPage.validateAllRowsDateMatches(newPatient.dateOfBirth!);
    });

    test('[T-0027][AT-0005]Search by cultural name', async ({ newPatient, allPatientsPage }) => {
      await allPatientsPage.searchTable({
        culturalName: newPatient.culturalName,
        advancedSearch: true,
      });
      await allPatientsPage.validateAtLeastOneSearchResult();
      await allPatientsPage.validateAllRowsContain(newPatient.culturalName!, 'culturalName');
    });

    test('[T-0027][AT-0006]Search by village', async ({ allPatientsPage }) => {
      await allPatientsPage.searchTable({ village: testData.village, advancedSearch: true });
      await allPatientsPage.validateAtLeastOneSearchResult();
      await allPatientsPage.validateAllRowsContain(testData.village, 'villageName');
    });

    test('[T-0027][AT-0007]Search by sex', async ({ newPatient, allPatientsPage }) => {
      await allPatientsPage.searchTable({ sex: newPatient.sex, advancedSearch: true });
      await allPatientsPage.validateAtLeastOneSearchResult();
      await allPatientsPage.validateAllRowsContain(newPatient.sex, 'sex');
    });
    test('[T-0027][AT-0008]Search by DOB from including NHN', async ({ newPatient, allPatientsPage }) => {
      await allPatientsPage.searchTable({
        DOBFrom: newPatient.dateOfBirth,
        NHN: newPatient.displayId,
        advancedSearch: true,
      });
      await allPatientsPage.validateOneSearchResult();
      await allPatientsPage.validateFirstRowContainsNHN(newPatient.displayId);
      await allPatientsPage.validateAllRowsDateMatches(newPatient.dateOfBirth!);
    });

    test('[T-0027][AT-0009]Search by DOB to including NHN', async ({ newPatient, allPatientsPage }) => {
      await allPatientsPage.searchTable({
        DOBTo: newPatient.dateOfBirth,
        NHN: newPatient.displayId,
        advancedSearch: true,
      });
      await allPatientsPage.validateOneSearchResult();
      await allPatientsPage.validateFirstRowContainsNHN(newPatient.displayId);
      await allPatientsPage.validateAllRowsDateMatches(newPatient.dateOfBirth!);
    });

    test('[T-0027][AT-0010]Search by filling all the fields', async ({ newPatient, allPatientsPage }) => {
      await allPatientsPage.searchTable({
        NHN: newPatient.displayId,
        firstName: newPatient.firstName,
        lastName: newPatient.lastName,
        DOB: newPatient.dateOfBirth,
        culturalName: newPatient.culturalName,
        village: testData.village,
        sex: newPatient.sex,
        DOBFrom: newPatient.dateOfBirth,
        DOBTo: newPatient.dateOfBirth,
        advancedSearch: true,
      });
      await allPatientsPage.validateOneSearchResult();
      await allPatientsPage.validateFirstRowContainsNHN(newPatient.displayId);
    });

    test('[T-0027][AT-0011]Search for deceased patient including NHN', async ({
      newPatient,
      allPatientsPage,
      api,
    }) => {
      await recordPatientDeathViaApi(api, allPatientsPage.page, newPatient.id);
      await allPatientsPage.searchTable({
        NHN: newPatient.displayId,
        deceased: true,
        advancedSearch: true,
      });
      await allPatientsPage.validateOneSearchResult();
      await allPatientsPage.validateFirstRowContainsNHN(newPatient.displayId);
      await allPatientsPage.validateAllRowsContain('Deceased', 'patientStatus');
      await allPatientsPage.validateRowColorIsRed();
    });

    test('[T-0027][AT-0012]Clear search', async ({ newPatient, allPatientsPage }) => {
      await allPatientsPage.searchTable({
        NHN: newPatient.displayId,
        firstName: newPatient.firstName,
        lastName: newPatient.lastName,
        DOB: newPatient.dateOfBirth,
        culturalName: newPatient.culturalName,
        village: testData.village,
        sex: newPatient.sex,
        DOBFrom: newPatient.dateOfBirth,
        DOBTo: newPatient.dateOfBirth,
        advancedSearch: true,
      });
      await allPatientsPage.clearSearch();
      await allPatientsPage.validateAllFieldsAreEmpty();
    });
  });

  test.describe('pagination', () => {
    test('[AT-0013]number of patient in patient list defaulted to 10', async ({ allPatientsPage }) => {
      await expect(allPatientsPage.patientTable.pageRecordCountDropDown).toHaveText('10');
      await allPatientsPage.patientTable.validateNumberOfPatients(10);
    });

    test('[AT-0014]change number of patient per list to 25 and going to next page', async ({
      allPatientsPage,
    }) => {
      await expect(allPatientsPage.patientTable.pageRecordCountDropDown).toHaveText('10');
      await allPatientsPage.patientTable.pageRecordCountDropDown.click();
      await allPatientsPage.patientTable.patientPageRecordCount25.click();
      await allPatientsPage.patientTable.waitForTableToLoad();
      await allPatientsPage.patientTable.waitForTableRowCount(25);
      await allPatientsPage.patientTable.validateNumberOfPatients(25);
      await allPatientsPage.patientTable.patientPage2.click();
      await allPatientsPage.patientTable.waitForTableToLoad();
      await allPatientsPage.patientTable.waitForTableRowCount(25);
      await allPatientsPage.patientTable.validateNumberOfPatients(25);
      await expect(allPatientsPage.patientTable.pageRecordCount).toContainText('26–50 of');
    });

    //skipping this test for now as it is failing in ci because of less than 100 patient in the database.
    test.skip('[AT-0015]change number of patient per list to 50 and going to next page', async ({
      allPatientsPage,
    }) => {
      await expect(allPatientsPage.patientTable.pageRecordCountDropDown).toHaveText('10');
      await allPatientsPage.patientTable.pageRecordCountDropDown.click();
      await allPatientsPage.patientTable.patientPageRecordCount50.click();
      await allPatientsPage.patientTable.waitForTableToLoad();
      //await allPatientsPage.patientTable.waitForTableRowCount(50);
      await allPatientsPage.patientTable.validateNumberOfPatients(50);
      await allPatientsPage.patientTable.patientPage2.click();
      await allPatientsPage.patientTable.waitForTableToLoad();
      //await allPatientsPage.patientTable.waitForTableRowCount(50);
      await allPatientsPage.patientTable.validateNumberOfPatients(50);
    });
  });

  test.describe('sorting', () => {
  test('[AT-0016]Sort table by Firstname in descending order', async ({ allPatientsPage }) => {
    await allPatientsPage.firstNameSortButton.click();
    await allPatientsPage.patientTable.waitForTableToLoad();
    await allPatientsPage.validateSortOrder(false, 'firstName');
  });
  test('[AT-0017]Sort table by Firstname in ascending order', async ({ allPatientsPage }) => {
    await allPatientsPage.firstNameSortButton.click();
    await allPatientsPage.firstNameSortButton.click();
    await allPatientsPage.patientTable.waitForTableToLoad();
    await allPatientsPage.validateSortOrder(true, 'firstName');
  });
  test('[AT-0018]Sort table by Lastname in descending order', async ({ allPatientsPage }) => {
    await allPatientsPage.lastNameSortButton.click();
    await allPatientsPage.patientTable.waitForTableToLoad();
    await allPatientsPage.validateSortOrder(false, 'lastName');
  });
  test('[AT-0019]Sort table by Lastname in ascending order', async ({ allPatientsPage }) => {
    await allPatientsPage.lastNameSortButton.click();
    await allPatientsPage.lastNameSortButton.click();
    await allPatientsPage.patientTable.waitForTableToLoad();
    await allPatientsPage.validateSortOrder(true, 'lastName');
  });
  test('[AT-0020]Sort table by cultural name in descending order', async ({ allPatientsPage }) => {
    await allPatientsPage.culturalNameSortButton.click();
    await allPatientsPage.patientTable.waitForTableToLoad();
    await allPatientsPage.validateSortOrder(false, 'culturalName');
  });
  test('[AT-0021]Sort table by cultural name in ascending order', async ({ allPatientsPage }) => {
    await allPatientsPage.culturalNameSortButton.click();
    await allPatientsPage.culturalNameSortButton.click();
    await allPatientsPage.patientTable.waitForTableToLoad();
    await allPatientsPage.validateSortOrder(true, 'culturalName');
  });
  test('[AT-0022]Sort table by village in descending order', async ({ allPatientsPage }) => {
    await allPatientsPage.villageSortButton.click();
    await allPatientsPage.patientTable.waitForTableToLoad();
    await allPatientsPage.validateSortOrder(false, 'villageName');
  });
  test('[AT-0023]Sort table by village in ascending order', async ({ allPatientsPage }) => {
    await allPatientsPage.villageSortButton.click();
    await allPatientsPage.villageSortButton.click();
    await allPatientsPage.patientTable.waitForTableToLoad();
    await allPatientsPage.validateSortOrder(true, 'villageName');
  });
  test('[AT-0024]Sort table by DOB in descending order', async ({ allPatientsPage }) => {
    await allPatientsPage.dobSortButton.click();
    await allPatientsPage.patientTable.waitForTableToLoad();
    await allPatientsPage.validateDateSortOrder(false);
  });
    test('[AT-0025]Sort table by DOB in ascending order', async ({ allPatientsPage }) => {
      await allPatientsPage.dobSortButton.click();
      await allPatientsPage.dobSortButton.click();
      await allPatientsPage.patientTable.waitForTableToLoad();
      await allPatientsPage.validateDateSortOrder(true);
    });
  });
});
