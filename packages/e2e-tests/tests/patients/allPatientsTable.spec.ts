import { test, expect } from '../../fixtures/test';
import { getUser, recordPatientDeath } from '../../fixtures/api';
import { seeds } from '@data/seeds';
import { toIsoDate, toTableDate } from '@helpers/dates';
import { ids } from '@ids';
import { ERROR_RED_RGB } from '../../utils/testColors';

test.describe('All patient table tests', () => {
  test.beforeEach(async ({ allPatientsPage }) => {
    await allPatientsPage.goto();
  });

  test.describe('search', () => {
    test('[T-0027][AT-0001]Search by NHN', async ({ newPatient, allPatientsPage }) => {
      await allPatientsPage.search({ NHN: newPatient.displayId });
      await allPatientsPage.table.waitForData();
      await allPatientsPage.table.expectOneResult();
      await allPatientsPage.table.expectFirstRowNHN(newPatient.displayId);
    });

    test('[T-0027][AT-0002]Search by first name', async ({ newPatient, allPatientsPage }) => {
      await allPatientsPage.search({ firstName: newPatient.firstName! });
      await allPatientsPage.table.waitForData();
      await allPatientsPage.table.expectAllRowsContain('firstName', newPatient.firstName!);
    });

    test('[T-0027][AT-0003]Search by last name', async ({ newPatient, allPatientsPage }) => {
      await allPatientsPage.search({ lastName: newPatient.lastName! });
      await allPatientsPage.table.waitForData();
      await allPatientsPage.table.expectAllRowsContain('lastName', newPatient.lastName!);
    });

    test('[T-0027][AT-0004]Search by DOB', async ({ newPatient, allPatientsPage }) => {
      const dob = toIsoDate(String(newPatient.dateOfBirth!));
      await allPatientsPage.search({ DOB: dob });
      await allPatientsPage.table.waitForData();
      const expectedDob = toTableDate(dob);
      await allPatientsPage.table.expectAllRowsContain('dateOfBirth', expectedDob);
    });

    test('[T-0027][AT-0005]Search by cultural name', async ({ newPatient, allPatientsPage }) => {
      await allPatientsPage.advancedSearchToggle.click();
      await allPatientsPage.search({ culturalName: newPatient.culturalName! });
      await allPatientsPage.table.waitForData();
      await allPatientsPage.table.expectAllRowsContain('culturalName', newPatient.culturalName!);
    });

    test('[T-0027][AT-0006]Search by village', async ({ allPatientsPage }) => {
      await allPatientsPage.advancedSearchToggle.click();
      await allPatientsPage.search({ village: seeds.village });
      await allPatientsPage.table.waitForData();
      await allPatientsPage.table.expectAllRowsContain('villageName', seeds.village);
    });

    test('[T-0027][AT-0007]Search by sex', async ({ newPatient, allPatientsPage }) => {
      await allPatientsPage.advancedSearchToggle.click();
      await allPatientsPage.search({ sex: newPatient.sex! });
      await allPatientsPage.table.waitForData();
      await allPatientsPage.table.expectAllRowsContain('sex', newPatient.sex!);
    });

    test('[T-0027][AT-0008]Search by DOB from including NHN', async ({ newPatient, allPatientsPage }) => {
      const dob = toIsoDate(String(newPatient.dateOfBirth!));
      await allPatientsPage.advancedSearchToggle.click();
      await allPatientsPage.search({
        DOBFrom: dob,
        NHN: newPatient.displayId,
      });
      await allPatientsPage.table.waitForData();
      await allPatientsPage.table.expectOneResult();
      await allPatientsPage.table.expectFirstRowNHN(newPatient.displayId);
      const expectedDob = toTableDate(dob);
      await expect(allPatientsPage.table.cell(0, 'dateOfBirth')).toHaveText(expectedDob);
    });

    test('[T-0027][AT-0009]Search by DOB to including NHN', async ({ newPatient, allPatientsPage }) => {
      const dob = toIsoDate(String(newPatient.dateOfBirth!));
      await allPatientsPage.advancedSearchToggle.click();
      await allPatientsPage.search({
        DOBTo: dob,
        NHN: newPatient.displayId,
      });
      await allPatientsPage.table.waitForData();
      await allPatientsPage.table.expectOneResult();
      await allPatientsPage.table.expectFirstRowNHN(newPatient.displayId);
      const expectedDob = toTableDate(dob);
      await expect(allPatientsPage.table.cell(0, 'dateOfBirth')).toHaveText(expectedDob);
    });

    test('[T-0027][AT-0010]Search by filling all the fields', async ({ newPatient, allPatientsPage }) => {
      const dob = toIsoDate(String(newPatient.dateOfBirth!));
      await allPatientsPage.advancedSearchToggle.click();
      await allPatientsPage.search({
        NHN: newPatient.displayId,
        firstName: newPatient.firstName!,
        lastName: newPatient.lastName!,
        DOB: dob,
        culturalName: newPatient.culturalName!,
        village: seeds.village,
        sex: newPatient.sex!,
        DOBFrom: dob,
        DOBTo: dob,
      });
      await allPatientsPage.table.waitForData();
      await allPatientsPage.table.expectOneResult();
      await allPatientsPage.table.expectFirstRowNHN(newPatient.displayId);
    });

    test('[T-0027][AT-0011]Search for deceased patient including NHN', async ({
      newPatient,
      allPatientsPage,
      api,
    }) => {
      await getUser(api);
      await recordPatientDeath(api, allPatientsPage.page, newPatient.id);
      await allPatientsPage.advancedSearchToggle.click();
      await allPatientsPage.search({
        NHN: newPatient.displayId,
        deceased: true,
      });
      await allPatientsPage.table.waitForData();
      await allPatientsPage.table.expectOneResult();
      await allPatientsPage.table.expectFirstRowNHN(newPatient.displayId);
      await allPatientsPage.table.expectAllRowsContain('patientStatus', 'Deceased');

      const row = allPatientsPage.table.rows.first();
      const cells = row.locator('td');
      const cellCount = await cells.count();
      for (let i = 1; i < cellCount; i++) {
        await expect(cells.nth(i)).toHaveCSS('color', ERROR_RED_RGB);
      }
    });

    test('[T-0027][AT-0012]Clear search', async ({ newPatient, allPatientsPage }) => {
      const dob = toIsoDate(String(newPatient.dateOfBirth!));
      await allPatientsPage.advancedSearchToggle.click();
      await allPatientsPage.search({
        NHN: newPatient.displayId,
        firstName: newPatient.firstName!,
        lastName: newPatient.lastName!,
        DOB: dob,
        culturalName: newPatient.culturalName!,
        village: seeds.village,
        sex: newPatient.sex!,
        DOBFrom: dob,
        DOBTo: dob,
      });
      await allPatientsPage.clearSearch();
      await allPatientsPage.validateAllFieldsAreEmpty();
    });
  });

  test.describe('pagination', () => {
    test('[AT-0013]number of patient in patient list defaulted to 10', async ({ allPatientsPage }) => {
      const dropdown = allPatientsPage.page.getByTestId(ids.table.recordCountDropdown).locator('div');
      await expect(dropdown).toHaveText('10');
      await allPatientsPage.table.expectRowCount(10);
    });

    test('[AT-0014]change number of patient per list to 25 and going to next page', async ({
      allPatientsPage,
    }) => {
      const dropdown = allPatientsPage.page.getByTestId(ids.table.recordCountDropdown).locator('div');
      await expect(dropdown).toHaveText('10');
      await allPatientsPage.table.setPageSize(25);
      await allPatientsPage.table.waitForTable();
      await expect(async () => {
        await allPatientsPage.table.expectRowCount(25);
      }).toPass({ timeout: 30000 });
      await allPatientsPage.table.goToPage(2);
      await allPatientsPage.table.waitForTable();
      await expect(async () => {
        await allPatientsPage.table.expectRowCount(25);
      }).toPass({ timeout: 30000 });
      await expect(allPatientsPage.table.pageRecordCount).toContainText('26–50 of');
    });

    //skipping this test for now as it is failing in ci because of less than 100 patient in the database.
    test.skip('[AT-0015]change number of patient per list to 50 and going to next page', async ({
      allPatientsPage,
    }) => {
      const dropdown = allPatientsPage.page.getByTestId(ids.table.recordCountDropdown).locator('div');
      await expect(dropdown).toHaveText('10');
      await allPatientsPage.table.setPageSize(50);
      await allPatientsPage.table.waitForTable();
      //await allPatientsPage.table.expectRowCount(50);
      await allPatientsPage.table.expectRowCount(50);
      await allPatientsPage.table.goToPage(2);
      await allPatientsPage.table.waitForTable();
      //await allPatientsPage.table.expectRowCount(50);
      await allPatientsPage.table.expectRowCount(50);
    });
  });

  test.describe('sorting', () => {
    test('[AT-0016]Sort table by Firstname in descending order', async ({ allPatientsPage }) => {
      await allPatientsPage.firstNameSortButton.click();
      await allPatientsPage.table.waitForTable();
      await allPatientsPage.table.expectSorted('firstName', 'desc');
    });

    test('[AT-0017]Sort table by Firstname in ascending order', async ({ allPatientsPage }) => {
      await allPatientsPage.firstNameSortButton.click();
      await allPatientsPage.firstNameSortButton.click();
      await allPatientsPage.table.waitForTable();
      await allPatientsPage.table.expectSorted('firstName', 'asc');
    });

    test('[AT-0018]Sort table by Lastname in descending order', async ({ allPatientsPage }) => {
      await allPatientsPage.lastNameSortButton.click();
      await allPatientsPage.table.waitForTable();
      await allPatientsPage.table.expectSorted('lastName', 'desc');
    });

    test('[AT-0019]Sort table by Lastname in ascending order', async ({ allPatientsPage }) => {
      await allPatientsPage.lastNameSortButton.click();
      await allPatientsPage.lastNameSortButton.click();
      await allPatientsPage.table.waitForTable();
      await allPatientsPage.table.expectSorted('lastName', 'asc');
    });

    test('[AT-0020]Sort table by cultural name in descending order', async ({ allPatientsPage }) => {
      await allPatientsPage.culturalNameSortButton.click();
      await allPatientsPage.table.waitForTable();
      await allPatientsPage.table.expectSorted('culturalName', 'desc');
    });

    test('[AT-0021]Sort table by cultural name in ascending order', async ({ allPatientsPage }) => {
      await allPatientsPage.culturalNameSortButton.click();
      await allPatientsPage.culturalNameSortButton.click();
      await allPatientsPage.table.waitForTable();
      await allPatientsPage.table.expectSorted('culturalName', 'asc');
    });

    test('[AT-0022]Sort table by village in descending order', async ({ allPatientsPage }) => {
      await allPatientsPage.villageSortButton.click();
      await allPatientsPage.table.waitForTable();
      await allPatientsPage.table.expectSorted('villageName', 'desc');
    });

    test('[AT-0023]Sort table by village in ascending order', async ({ allPatientsPage }) => {
      await allPatientsPage.villageSortButton.click();
      await allPatientsPage.villageSortButton.click();
      await allPatientsPage.table.waitForTable();
      await allPatientsPage.table.expectSorted('villageName', 'asc');
    });

    test('[AT-0024]Sort table by DOB in descending order', async ({ allPatientsPage }) => {
      await allPatientsPage.dobSortButton.click();
      await allPatientsPage.table.waitForTable();
      await allPatientsPage.table.expectDateSorted('dateOfBirth', 'desc');
    });

    test('[AT-0025]Sort table by DOB in ascending order', async ({ allPatientsPage }) => {
      await allPatientsPage.dobSortButton.click();
      await allPatientsPage.dobSortButton.click();
      await allPatientsPage.table.waitForTable();
      await allPatientsPage.table.expectDateSorted('dateOfBirth', 'asc');
    });
  });
});
