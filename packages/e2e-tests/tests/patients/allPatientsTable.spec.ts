import { test } from '../../fixtures/baseFixture';
import { createPatientViaApi } from '../../utils/generateNewPatient';
import * as testHelper from '../../utils/testHelper';
import { expect } from '@playwright/test';

test.describe('All patient table search', () => {
  let patientData: any;

  test.beforeEach(async ({ allPatientsPage }) => {
    await allPatientsPage.goto();
    await createPatientViaApi(allPatientsPage);
    patientData =await allPatientsPage.getPatientData();
  });

  test("Search by NHN", async ({ allPatientsPage }) => {
    await allPatientsPage.searchTable({ NHN: patientData.nhn, advancedSearch: false });
    await allPatientsPage.validateOneSearchResult();
    await allPatientsPage.validateFirstRowContainsNHN(patientData.nhn);
  });

  test("Search by first name", async ({ allPatientsPage }) => {
    await allPatientsPage.searchTable({ firstName: patientData.firstName, advancedSearch: false });
    await allPatientsPage.validateAtLeastOneSearchResult();
    await allPatientsPage.validateAllRowsContain(patientData.firstName, "firstName");
  });

  test("Search by last name", async ({ allPatientsPage }) => {
    await allPatientsPage.searchTable({ lastName: patientData.lastName, advancedSearch: false });
    await allPatientsPage.validateAtLeastOneSearchResult();
    await allPatientsPage.validateAllRowsContain(patientData.lastName, "lastName");
  });   

  test("Search by DOB", async ({ allPatientsPage }) => {
    await allPatientsPage.searchTable({ DOB: patientData.formattedDOB, advancedSearch: false });
    await allPatientsPage.validateAtLeastOneSearchResult();
    await allPatientsPage.validateAllRowsDateMatches(patientData.formattedDOB, "dateOfBirth");
  });

  test("Search by cultural name", async ({ allPatientsPage }) => {
    await allPatientsPage.searchTable({ culturalName: patientData.culturalName, advancedSearch: true });
    await allPatientsPage.validateAtLeastOneSearchResult();
    await allPatientsPage.validateAllRowsContain(patientData.culturalName, "culturalName");
  });

  test("Search by village", async ({ allPatientsPage }) => {
    await allPatientsPage.searchTable({ village: patientData.village, advancedSearch: true });
    await allPatientsPage.validateAtLeastOneSearchResult();
    await allPatientsPage.validateAllRowsContain(patientData.village, "villageName");
  });

  test("Search by sex", async ({ allPatientsPage }) => {
    await allPatientsPage.searchTable({ sex: patientData.gender, advancedSearch: true });
    await allPatientsPage.validateAtLeastOneSearchResult();
    await allPatientsPage.validateAllRowsContain(patientData.gender, "sex");
  });
  test("Search by DOB from including NHN", async ({ allPatientsPage }) => {
    await allPatientsPage.searchTable({ DOBFrom: patientData.formattedDOB , NHN: patientData.nhn, advancedSearch: true });
    await allPatientsPage.validateOneSearchResult();
    await allPatientsPage.validateFirstRowContainsNHN(patientData.nhn);
    await allPatientsPage.validateAllRowsDateMatches(patientData.formattedDOB, "dateOfBirth");
  });

  test("Search by DOB to including NHN", async ({ allPatientsPage }) => {
    await allPatientsPage.searchTable({ DOBTo: patientData.formattedDOB , NHN: patientData.nhn, advancedSearch: true });
    await allPatientsPage.validateOneSearchResult();
    await allPatientsPage.validateFirstRowContainsNHN(patientData.nhn);
    await allPatientsPage.validateAllRowsDateMatches(patientData.formattedDOB, "dateOfBirth");
  });

  test("Search by filling all the fields", async ({ allPatientsPage }) => {
    await allPatientsPage.searchTable({NHN:patientData.nhn,firstName:patientData.firstName,
      lastName:patientData.lastName,DOB:patientData.formattedDOB,culturalName:patientData.culturalName,village:patientData.village,sex:patientData.gender, DOBFrom: patientData.formattedDOB,
      DOBTo: patientData.formattedDOB, advancedSearch: true });
      await allPatientsPage.validateOneSearchResult();
      await allPatientsPage.validateFirstRowContainsNHN(patientData.nhn);
  });

  test("Search for deceased patient including NHN", async ({ allPatientsPage }) => {
    await testHelper.recordPatientDeathViaApi(allPatientsPage);
    await allPatientsPage.searchTable({ NHN:patientData.nhn,deceased: true, advancedSearch: true });
    await allPatientsPage.validateOneSearchResult();
    await allPatientsPage.validateFirstRowContainsNHN(patientData.nhn);
    await allPatientsPage.validateAllRowsContain("Deceased", "patientStatus");
    await allPatientsPage.validateRowColorIsRed();
  });

  test("Clear search", async ({ allPatientsPage }) => {
    await allPatientsPage.searchTable({NHN:patientData.nhn,firstName:patientData.firstName,
      lastName:patientData.lastName,DOB:patientData.formattedDOB,culturalName:patientData.culturalName,village:patientData.village,sex:patientData.gender, DOBFrom: patientData.formattedDOB,
      DOBTo: patientData.formattedDOB, advancedSearch: true });
    await allPatientsPage.clearSearch();
    await allPatientsPage.validateAllFieldsAreEmpty();
  });
});

test.describe('All patient table pagination', () => {
  test.beforeEach(async ({ allPatientsPage }) => {
    await allPatientsPage.goto();
  });
  test("number of patient in patient list defaulted to 10", async ({ allPatientsPage }) => {
    await expect(allPatientsPage.pageRecordCountDropDown).toHaveText('10');
    await allPatientsPage.validateNumberOfPatients(10);
  });

  test("change number of patient per list to 25 and going to next page", async ({ allPatientsPage }) => {
    await expect(allPatientsPage.pageRecordCountDropDown).toHaveText('10');
    await allPatientsPage.pageRecordCountDropDown.click();
    await allPatientsPage.patientPageRecordCount25.click();
    await allPatientsPage.waitForTableToLoad();
    await allPatientsPage.validateNumberOfPatients(25);
    await allPatientsPage.patientPage2.click();
    await allPatientsPage.waitForTableToLoad();
    await allPatientsPage.validateNumberOfPatients(25);
    await expect(allPatientsPage.pageRecordCount).toContainText('26–50 of');

  });

  test("change number of patient per list to 50 and going to next page", async ({ allPatientsPage }) => {
    await expect(allPatientsPage.pageRecordCountDropDown).toHaveText('10');
    await allPatientsPage.pageRecordCountDropDown.click();
    await allPatientsPage.patientPageRecordCount50.click();
    await allPatientsPage.waitForTableToLoad();
    await allPatientsPage.validateNumberOfPatients(50);
    await allPatientsPage.patientPage2.click();
    await allPatientsPage.waitForTableToLoad();
    await allPatientsPage.validateNumberOfPatients(50);
    await expect(allPatientsPage.pageRecordCount).toContainText('51–100 of');
  });
}); 

test.describe('All patient table sorting', () => {
  test.beforeEach(async ({ allPatientsPage }) => {
    await allPatientsPage.goto();
  });
  test("Sort table by Firstname in descending order", async ({ allPatientsPage }) => {
    await allPatientsPage.firstNameSortButton.click();
    await allPatientsPage.waitForTableToLoad();
    await allPatientsPage.validateSortOrder(false,"firstName");  
  });
  test("Sort table by Firstname in ascending order", async ({ allPatientsPage }) => {
    await allPatientsPage.firstNameSortButton.click();
    await allPatientsPage.firstNameSortButton.click();
    await allPatientsPage.waitForTableToLoad();
    await allPatientsPage.validateSortOrder(true,"firstName");  
  });
  test("Sort table by Lastname in descending order", async ({ allPatientsPage }) => {
    await allPatientsPage.lastNameSortButton.click();
    await allPatientsPage.waitForTableToLoad();
    await allPatientsPage.validateSortOrder(false,"lastName");  
  });
  test("Sort table by Lastname in ascending order", async ({ allPatientsPage }) => {
    await allPatientsPage.lastNameSortButton.click();
    await allPatientsPage.lastNameSortButton.click();
    await allPatientsPage.waitForTableToLoad();
    await allPatientsPage.validateSortOrder(true,"lastName");  
  });
  test("Sort table by cultural name in descending order", async ({ allPatientsPage }) => {
    await allPatientsPage.culturalNameSortButton.click();
    await allPatientsPage.waitForTableToLoad();
    await allPatientsPage.validateSortOrder(false,"culturalName");  
  });
  test("Sort table by cultural name in ascending order", async ({ allPatientsPage }) => {
    await allPatientsPage.culturalNameSortButton.click();
    await allPatientsPage.culturalNameSortButton.click();
    await allPatientsPage.waitForTableToLoad();
    await allPatientsPage.validateSortOrder(true,"culturalName");  
  });
  test("Sort table by village in descending order", async ({ allPatientsPage }) => {
    await allPatientsPage.villageSortButton.click();
    await allPatientsPage.waitForTableToLoad();
    await allPatientsPage.validateSortOrder(false,"villageName");  
  });
  test("Sort table by village in ascending order", async ({ allPatientsPage }) => {
    await allPatientsPage.villageSortButton.click();
    await allPatientsPage.villageSortButton.click();
    await allPatientsPage.waitForTableToLoad();
    await allPatientsPage.validateSortOrder(true,"villageName");  
  });
  test("Sort table by DOB in descending order", async ({ allPatientsPage }) => {
    await allPatientsPage.dobSortButton.click();
    await allPatientsPage.waitForTableToLoad();
    await allPatientsPage.validateDateSortOrder(false);  
  });
  test("Sort table by DOB in ascending order", async ({ allPatientsPage }) => {
    await allPatientsPage.dobSortButton.click();
    await allPatientsPage.dobSortButton.click();
    await allPatientsPage.waitForTableToLoad();
    await allPatientsPage.validateDateSortOrder(true);  
  });
});









