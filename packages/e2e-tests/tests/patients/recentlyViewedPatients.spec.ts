import { test } from '../../fixtures/baseFixture';
import { expect } from '@playwright/test';
import { RecentlyViewedPatientPage } from '../../pages/patients/recentlyViewedPatientPage';
import { PatientDetailsPage } from '../../pages/patients/PatientDetailsPage/PatientDetailsPage';
import { createPatient, createHospitalAdmissionEncounterViaAPI, createClinicEncounterViaApi, createTriageEncounterViaApi } from '../../utils/apiHelpers';

async function verifyRecentlyViewedPatients(
  recentlyViewedPatientPage: RecentlyViewedPatientPage,
  patientStack: Array<{firstName: string, lastName: string, nhn: string, sex: string, dateOfBirth: string}>,
  count: number = 6
) {
  for (let i = 0; i < count; i++) {
    const expectedPatient = patientStack.pop();

    //wait for the first patient to be loaded in recently patient list
    if (i == 0 && expectedPatient) {
      await expect.poll(
        async () => {
          const patient = await recentlyViewedPatientPage.getRecentlyViewedPatientByIndex(0);
          return patient.nhn;
        },
        { timeout: 5000 }
      ).toBe(expectedPatient.nhn);
    }

    const recentlyViewedPatient = await recentlyViewedPatientPage.getRecentlyViewedPatientByIndex(i);
    
    
    
    if (expectedPatient) {
      const fullName = `${expectedPatient.firstName} ${expectedPatient.lastName}`.trim();
      
      expect(recentlyViewedPatient.name).toBe(fullName);
      expect(recentlyViewedPatient.nhn).toBe(expectedPatient.nhn);
      expect(recentlyViewedPatient.gender).toBe(expectedPatient.sex);
      
      // Format date to match the MM/DD/YY format shown in recently viewed
      const expectedFormattedDate = recentlyViewedPatientPage.formatDateForRecentlyViewed(expectedPatient.dateOfBirth);
      expect(recentlyViewedPatient.birthDate).toBe(expectedFormattedDate);
    }
  }
}

test.describe('Recently viewed patients details', () => {
  test.beforeEach(async ({ allPatientsPage }) => {
    await allPatientsPage.goto();
  });

  test('Most recently viewed patient appears at the top of the list and confirms the correct patient data in the list', async ({ newPatient, allPatientsPage, page }) => {
    await allPatientsPage.patientTable.searchTable({ NHN: newPatient.displayId, advancedSearch: false });
    await allPatientsPage.patientTable.clickOnFirstRow();
    await allPatientsPage.goto();
    const recentlyViewed = new RecentlyViewedPatientPage(page);
    await expect(recentlyViewed.firstRecentlyViewedName).toHaveText(newPatient.firstName + ' ' + newPatient.lastName);
    await expect(recentlyViewed.firstRecentlyViewedNHN).toHaveText(newPatient.displayId);
    await expect(recentlyViewed.firstRecentlyViewedGender).toHaveText(new RegExp(`^${newPatient.sex}$`, 'i'));
    const expectedFormattedDate = recentlyViewed.formatDateForRecentlyViewed(newPatient.dateOfBirth || '');
    await expect(recentlyViewed.firstRecentlyViewedBirthDate).toHaveText(expectedFormattedDate);
  });

  test('Most recently viewed patient appears at the top of the list', async ({ newPatient, allPatientsPage, page, api }) => {
    // Create and view first patient
    await allPatientsPage.patientTable.searchTable({ NHN: newPatient.displayId, advancedSearch: false });
    await allPatientsPage.patientTable.clickOnFirstRow();
    await allPatientsPage.goto();
    
    // Create and view second patient
    const secondPatient = await createPatient(api, allPatientsPage.page);
    await allPatientsPage.patientTable.searchTable({ NHN: secondPatient.displayId, advancedSearch: false });
    await allPatientsPage.patientTable.clickOnFirstRow();
    
    // Verify second patient is at the top
    await allPatientsPage.goto();
    const recentlyViewed = new RecentlyViewedPatientPage(page);
    await expect(recentlyViewed.firstRecentlyViewedName).toHaveText(secondPatient.firstName + ' ' + secondPatient.lastName);
    await expect(recentlyViewed.firstRecentlyViewedNHN).toHaveText(secondPatient.displayId);
  });

  test('Clicking on a recently viewed patient navigates to their details', async ({ newPatient, allPatientsPage, page }) => {
    await allPatientsPage.patientTable.searchTable({ NHN: newPatient.displayId, advancedSearch: false });
    await allPatientsPage.patientTable.clickOnFirstRow();
    await allPatientsPage.goto();
    
    const recentlyViewed = new RecentlyViewedPatientPage(page);
    await expect(recentlyViewed.firstRecentlyViewedNHN).toHaveText(newPatient.displayId);
    await recentlyViewed.firstRecentlyViewedName.click();
    
    // Verify navigation to patient details
    await expect(page).toHaveURL(/.*\/patients\/all\/.*/);
    const patientDetailsPage = new PatientDetailsPage(page);
    await expect(patientDetailsPage.healthIdText).toHaveText(newPatient.displayId);
  });

  test('Recently viewed list updates when viewing same patient multiple times', async ({ newPatient, allPatientsPage, page }) => {
    // View patient first time
    await allPatientsPage.patientTable.searchTable({ NHN: newPatient.displayId, advancedSearch: false });
    await allPatientsPage.patientTable.clickOnFirstRow();
    await allPatientsPage.goto();
    
    // View patient second time
    await allPatientsPage.patientTable.searchTable({ NHN: newPatient.displayId, advancedSearch: false });
    await allPatientsPage.patientTable.clickOnFirstRow();
    await allPatientsPage.goto();
    
    // Verify patient is still at the top
    const recentlyViewed = new RecentlyViewedPatientPage(page);
    await expect(recentlyViewed.firstRecentlyViewedName).toHaveText(newPatient.firstName + ' ' + newPatient.lastName);
    await expect(recentlyViewed.firstRecentlyViewedNHN).toHaveText(newPatient.displayId);
  });

  test('Navigating to 12 patients in the patient table and then verifying the last 6 recently viewed patient list', async ({allPatientsPage, page }) => {
  
    const recentlyViewedPatientPage = new RecentlyViewedPatientPage(page);
    
    // Stack to store patient details (LIFO - Last In, First Out)
    const patientStack: Array<{firstName: string, lastName: string, nhn: string, sex: string, dateOfBirth: string}> = [];
    
    for (let i = 0; i < 12; i++) {
      if (i>=10) {
        await allPatientsPage.patientTable.changePageSize(25);
      }
      // Get patient details from the table before clicking
      const row = allPatientsPage.patientTable.rows.nth(i);
      const firstName = await row.locator('[data-testid*="-firstName"]').textContent() || '';
      const lastName = await row.locator('[data-testid*="-lastName"]').textContent() || '';
      const nhn = await row.locator('[data-testid*="-displayId"]').textContent() || '';
      const sex = await row.locator('[data-testid*="-sex"]').textContent() || '';
      const dateOfBirth = await row.locator('[data-testid*="-dateOfBirth"]').textContent() || '';
      
      // Push patient details to stack
      patientStack.push({ firstName: firstName, lastName: lastName, nhn: nhn, sex: sex, dateOfBirth: dateOfBirth });
      
      // Click on the row
      await allPatientsPage.patientTable.clickOnRow(i);
      await allPatientsPage.goto();
      
    }
    
    // Now pop the stack and verify against recently viewed patients
    // The stack is LIFO, so the last patient clicked will be at the top of recently viewed
    
    await verifyRecentlyViewedPatients(recentlyViewedPatientPage, patientStack);
    
    // The recently viewed patient list is 6 patients so need to navigate to the next page
    await recentlyViewedPatientPage.navigateNext.click();
    
    await verifyRecentlyViewedPatients(recentlyViewedPatientPage, patientStack);
  });
});

test.describe('Recently viewed patient colors', () => {
  test.beforeEach(async ({ allPatientsPage }) => {
    await allPatientsPage.goto();
  });

  test('The patient with clinic admission color is yellow in recently viewed list', async ({newPatient,allPatientsPage, page, api }) => {
    await createClinicEncounterViaApi(api, newPatient.id);
    await allPatientsPage.patientTable.searchTable({ NHN: newPatient.displayId, advancedSearch: false });
    await allPatientsPage.patientTable.clickOnFirstRow();
    await allPatientsPage.goto();
    const recentlyViewed = new RecentlyViewedPatientPage(page);
    await expect.poll(
      async () => await recentlyViewed.getRecentlyViewedPatientNameColor(),
      { timeout: 10000 }
    ).toBe('rgb(233, 172, 80)');
  });

  test('The patient with hospital admission color is green in recently viewed list', async ({newPatient,allPatientsPage, page, api }) => {
    await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    await allPatientsPage.patientTable.searchTable({ NHN: newPatient.displayId, advancedSearch: false });
    await allPatientsPage.patientTable.clickOnFirstRow();
    await allPatientsPage.goto();
    const recentlyViewed = new RecentlyViewedPatientPage(page);
    await expect.poll(
      async () => await recentlyViewed.getRecentlyViewedPatientNameColor(),
      { timeout: 10000 }
    ).toBe('rgb(25, 147, 78)');
  });

  test('The patient with triage admission color is red in recently viewed list', async ({newPatient,allPatientsPage, page, api }) => {
    await createTriageEncounterViaApi(api, page, newPatient.id);
    await allPatientsPage.patientTable.searchTable({ NHN: newPatient.displayId, advancedSearch: false });
    await allPatientsPage.patientTable.clickOnFirstRow();
    await allPatientsPage.goto();
    const recentlyViewed = new RecentlyViewedPatientPage(page);
    await expect.poll(
      async () => await recentlyViewed.getRecentlyViewedPatientNameColor(),
      { timeout: 10000 }
    ).toBe('rgb(241, 127, 22)'); 
  });

  test('The patient with no admission color is blue in recently viewed list', async ({newPatient,allPatientsPage, page }) => {
    await allPatientsPage.patientTable.searchTable({ NHN: newPatient.displayId, advancedSearch: false });
    await allPatientsPage.patientTable.clickOnFirstRow();
    await allPatientsPage.goto();
    const recentlyViewed = new RecentlyViewedPatientPage(page);
    await expect.poll(
      async () => await recentlyViewed.getRecentlyViewedPatientNameColor(),
      { timeout: 10000 }
    ).toBe('rgb(17, 114, 209)'); 
  });
});