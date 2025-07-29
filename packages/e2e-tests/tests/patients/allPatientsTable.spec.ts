import { test } from '../../fixtures/baseFixture';
import { recordPatientDeathViaApi } from '../../utils/apiHelpers';
import { expect } from '@playwright/test';
import { testData } from '../../utils/testData';

test.describe('All patient table search', () => {

  test.beforeEach(async ({ allPatientsPage }) => {
    await allPatientsPage.goto();
  });

  test("Search by NHN", async ({ newPatient,allPatientsPage }) => {
    await allPatientsPage.searchTable({ NHN: newPatient.displayId, advancedSearch: false });
    await allPatientsPage.validateOneSearchResult();
    await allPatientsPage.validateFirstRowContainsNHN(newPatient.displayId);
  });

  test("Search by first name", async ({ newPatient,allPatientsPage }) => {
    await allPatientsPage.searchTable({ firstName: newPatient.firstName, advancedSearch: false });
    await allPatientsPage.validateAtLeastOneSearchResult();
    await allPatientsPage.validateAllRowsContain(newPatient.firstName!, "firstName");
  });

  test("Search by last name", async ({ newPatient,allPatientsPage }) => {
    await allPatientsPage.searchTable({ lastName: newPatient.lastName, advancedSearch: false });
    await allPatientsPage.validateAtLeastOneSearchResult();
    await allPatientsPage.validateAllRowsContain(newPatient.lastName!, "lastName");
  });   

  test("Search by DOB", async ({ newPatient,allPatientsPage }) => {  
    await allPatientsPage.searchTable({ DOB: newPatient.dateOfBirth, advancedSearch: false });
    await allPatientsPage.validateAtLeastOneSearchResult();
    await allPatientsPage.validateAllRowsDateMatches(newPatient.dateOfBirth!, "dateOfBirth");
  });

  test("Search by cultural name", async ({ newPatient,allPatientsPage }) => {
    await allPatientsPage.searchTable({ culturalName: newPatient.culturalName, advancedSearch: true });
    await allPatientsPage.validateAtLeastOneSearchResult();
    await allPatientsPage.validateAllRowsContain(newPatient.culturalName!, "culturalName");
  });

  test("Search by village", async ({ allPatientsPage }) => {
    await allPatientsPage.searchTable({ village: testData.village, advancedSearch: true });
    await allPatientsPage.validateAtLeastOneSearchResult();
    await allPatientsPage.validateAllRowsContain(testData.village, "villageName");
  });

  test("Search by sex", async ({ newPatient,allPatientsPage }) => {
    await allPatientsPage.searchTable({ sex: newPatient.sex, advancedSearch: true });
    await allPatientsPage.validateAtLeastOneSearchResult();
    await allPatientsPage.validateAllRowsContain(newPatient.sex, "sex");
  });
  test("Search by DOB from including NHN", async ({ newPatient,allPatientsPage }) => {
    await allPatientsPage.searchTable({ DOBFrom: newPatient.dateOfBirth , NHN: newPatient.displayId, advancedSearch: true });
    await allPatientsPage.validateOneSearchResult();
    await allPatientsPage.validateFirstRowContainsNHN(newPatient.displayId);
    await allPatientsPage.validateAllRowsDateMatches(newPatient.dateOfBirth!, "dateOfBirth");
  });

  test("Search by DOB to including NHN", async ({ newPatient,allPatientsPage }) => {
    await allPatientsPage.searchTable({ DOBTo: newPatient.dateOfBirth , NHN: newPatient.displayId, advancedSearch: true });
    await allPatientsPage.validateOneSearchResult();
    await allPatientsPage.validateFirstRowContainsNHN(newPatient.displayId);
    await allPatientsPage.validateAllRowsDateMatches(newPatient.dateOfBirth!, "dateOfBirth");
  });

  test("Search by filling all the fields", async ({ newPatient,allPatientsPage }) => {
    await allPatientsPage.searchTable({NHN:newPatient.displayId,firstName:newPatient.firstName,
      lastName:newPatient.lastName,DOB:newPatient.dateOfBirth,culturalName:newPatient.culturalName,village:testData.villageID,sex:newPatient.sex, DOBFrom: newPatient.dateOfBirth,
      DOBTo: newPatient.dateOfBirth, advancedSearch: true });
      await allPatientsPage.validateOneSearchResult();
      await allPatientsPage.validateFirstRowContainsNHN(newPatient.displayId);
  });

  test("Search for deceased patient including NHN", async ({ newPatient, allPatientsPage, api }) => {
    await recordPatientDeathViaApi(api, allPatientsPage.page, newPatient.id);
    await allPatientsPage.searchTable({ NHN:newPatient.displayId,deceased: true, advancedSearch: true });
    await allPatientsPage.validateOneSearchResult();
    await allPatientsPage.validateFirstRowContainsNHN(newPatient.displayId);
    await allPatientsPage.validateAllRowsContain("Deceased", "patientStatus");
    await allPatientsPage.validateRowColorIsRed();
  });

  test("Clear search", async ({ newPatient,allPatientsPage }) => {
    await allPatientsPage.searchTable({NHN:newPatient.displayId,firstName:newPatient.firstName,
      lastName:newPatient.lastName,DOB:newPatient.dateOfBirth,culturalName:newPatient.culturalName,village:testData.villageID,sex:newPatient.sex, DOBFrom: newPatient.dateOfBirth,
      DOBTo: newPatient.dateOfBirth, advancedSearch: true });
    await allPatientsPage.clearSearch();
    await allPatientsPage.validateAllFieldsAreEmpty();
  });
});

test.describe('All patient table pagination', () => {
  test.beforeEach(async ({ allPatientsPage }) => {
    await allPatientsPage.goto();
  });
  test("number of patient in patient list defaulted to 10", async ({ allPatientsPage }) => {
    await expect(allPatientsPage.patientTable.pageRecordCountDropDown).toHaveText('10');
    await allPatientsPage.patientTable.validateNumberOfPatients(10);
  });

  test("change number of patient per list to 25 and going to next page", async ({ allPatientsPage }) => {
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
  test.skip("change number of patient per list to 50 and going to next page", async ({ allPatientsPage }) => {
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

test.describe('All patient table sorting', () => {
  test.beforeEach(async ({ allPatientsPage }) => {
    await allPatientsPage.goto();
  });
  test("Sort table by Firstname in descending order", async ({ allPatientsPage }) => {
    await allPatientsPage.firstNameSortButton.click();
    await allPatientsPage.patientTable.waitForTableToLoad();
    await allPatientsPage.validateSortOrder(false,"firstName");  
  });
  test("Sort table by Firstname in ascending order", async ({ allPatientsPage }) => {
    await allPatientsPage.firstNameSortButton.click();
    await allPatientsPage.firstNameSortButton.click();
    await allPatientsPage.patientTable.waitForTableToLoad();
    await allPatientsPage.validateSortOrder(true,"firstName");  
  });
  test("Sort table by Lastname in descending order", async ({ allPatientsPage }) => {
    await allPatientsPage.lastNameSortButton.click();
    await allPatientsPage.patientTable.waitForTableToLoad();
    await allPatientsPage.validateSortOrder(false,"lastName");  
  });
  test("Sort table by Lastname in ascending order", async ({ allPatientsPage }) => {
    await allPatientsPage.lastNameSortButton.click();
    await allPatientsPage.lastNameSortButton.click();
    await allPatientsPage.patientTable.waitForTableToLoad();
    await allPatientsPage.validateSortOrder(true,"lastName");  
  });
  test("Sort table by cultural name in descending order", async ({ allPatientsPage }) => {
    await allPatientsPage.culturalNameSortButton.click();
    await allPatientsPage.patientTable.waitForTableToLoad();
    await allPatientsPage.validateSortOrder(false,"culturalName");  
  });
  test("Sort table by cultural name in ascending order", async ({ allPatientsPage }) => {
    await allPatientsPage.culturalNameSortButton.click();
    await allPatientsPage.culturalNameSortButton.click();
    await allPatientsPage.patientTable.waitForTableToLoad();
    await allPatientsPage.validateSortOrder(true,"culturalName");  
  });
  test("Sort table by village in descending order", async ({ allPatientsPage }) => {
    await allPatientsPage.villageSortButton.click();
    await allPatientsPage.patientTable.waitForTableToLoad();
    await allPatientsPage.validateSortOrder(false,"villageName");  
  });
  test("Sort table by village in ascending order", async ({ allPatientsPage }) => {
    await allPatientsPage.villageSortButton.click();
    await allPatientsPage.villageSortButton.click();
    await allPatientsPage.patientTable.waitForTableToLoad();
    await allPatientsPage.validateSortOrder(true,"villageName");  
  });
  test("Sort table by DOB in descending order", async ({ allPatientsPage }) => {
    await allPatientsPage.dobSortButton.click();
    await allPatientsPage.patientTable.waitForTableToLoad();
    await allPatientsPage.validateDateSortOrder(false);  
  });
  test("Sort table by DOB in ascending order", async ({ allPatientsPage }) => {
    await allPatientsPage.dobSortButton.click();
    await allPatientsPage.dobSortButton.click();
    await allPatientsPage.patientTable.waitForTableToLoad();
    await allPatientsPage.validateDateSortOrder(true);  
  });
});









