import { test, expect } from '../../fixtures/baseFixture';
import { recentlyViewedPatientPage } from '../../pages/patients/recentlyViewedPatientPage';
import { createPatientViaApi } from '../../utils/generateNewPatient';
import { convertDateFormat } from '../../utils/testHelper';

test.describe('Recently viewed patients top bar', () => {
  let patientData: any;
  
  test.beforeEach(async ({ allPatientsPage }) => {
    await allPatientsPage.goto();
    await createPatientViaApi(allPatientsPage);
    patientData = await allPatientsPage.getPatientData();
  });

  test('Most recently viewed patient appears at the top of the list and confirms the correct patient data in the list', async ({ allPatientsPage, page }) => {
    await allPatientsPage.searchTable({ NHN: patientData.nhn, advancedSearch: false });
    await allPatientsPage.clickOnFirstRow();
    await allPatientsPage.goto();
    const recentlyViewed = new recentlyViewedPatientPage(page);
    await expect(recentlyViewed.firstRecentlyViewedName).toHaveText(patientData.firstName + ' ' + patientData.lastName);
    await expect(recentlyViewed.firstRecentlyViewedNHN).toHaveText(patientData.nhn);
    await expect(recentlyViewed.firstRecentlyViewedGender).toHaveText(new RegExp(`^${patientData.gender}$`, 'i'));
    const expectedDate = convertDateFormat(patientData.formattedDOB);
    const [month, day, year] = expectedDate.split('/');
    const shortYear = year.slice(-2);
    await expect(recentlyViewed.firstRecentlyViewedBirthDate).toHaveText(new RegExp(`^${month}/${day}/${shortYear}$`));
  });

  test('Most recently viewed patient appears at the top of the list', async ({ allPatientsPage, page }) => {
    // Create and view first patient
    await allPatientsPage.searchTable({ NHN: patientData.nhn, advancedSearch: false });
    await allPatientsPage.clickOnFirstRow();
    
    // Create and view second patient
    await createPatientViaApi(allPatientsPage);
    const secondPatientData = await allPatientsPage.getPatientData();
    await allPatientsPage.searchTable({ NHN: secondPatientData.nhn, advancedSearch: false });
    await allPatientsPage.clickOnFirstRow();
    
    // Verify second patient is at the top
    await allPatientsPage.goto();
    const recentlyViewed = new recentlyViewedPatientPage(page);
    await expect(recentlyViewed.firstRecentlyViewedName).toHaveText(secondPatientData.firstName + ' ' + secondPatientData.lastName);
    await expect(recentlyViewed.firstRecentlyViewedNHN).toHaveText(secondPatientData.nhn);
  });

  test('Clicking on a recently viewed patient navigates to their details', async ({ allPatientsPage, page }) => {
    await allPatientsPage.searchTable({ NHN: patientData.nhn, advancedSearch: false });
    await allPatientsPage.clickOnFirstRow();
    await allPatientsPage.goto();
    
    const recentlyViewed = new recentlyViewedPatientPage(page);
    await expect(recentlyViewed.firstRecentlyViewedNHN).toHaveText(patientData.nhn);
    await recentlyViewed.firstRecentlyViewedName.click();
    
    // Verify navigation to patient details
    await expect(page).toHaveURL(/.*\/patients\/all\/.*/);
    await expect(page.getByTestId('healthidtext-fqvn')).toHaveText(patientData.nhn);
  });

  test('Recently viewed list updates when viewing same patient multiple times', async ({ allPatientsPage, page }) => {
    // View patient first time
    await allPatientsPage.searchTable({ NHN: patientData.nhn, advancedSearch: false });
    await allPatientsPage.clickOnFirstRow();
    await allPatientsPage.goto();
    
    // View patient second time
    await allPatientsPage.searchTable({ NHN: patientData.nhn, advancedSearch: false });
    await allPatientsPage.clickOnFirstRow();
    await allPatientsPage.goto();
    
    // Verify patient is still at the top
    const recentlyViewed = new recentlyViewedPatientPage(page);
    await expect(recentlyViewed.firstRecentlyViewedName).toHaveText(patientData.firstName + ' ' + patientData.lastName);
    await expect(recentlyViewed.firstRecentlyViewedNHN).toHaveText(patientData.nhn);
  });
});
