import { test } from '../../fixtures/baseFixture';
import { expect } from '@playwright/test';
import { PatientDetailsPage } from '../../pages/patients/PatientDetailsPage/PatientDetailsPage';
import {
  createPatient,
  createHospitalAdmissionEncounterViaAPI,
  createClinicEncounterViaApi,
  createTriageEncounterViaApi,
} from '../../utils/apiHelpers';
import { Patient } from '../../types/Patient';
import { routes, wildcardToRegex } from '../../config/routes';

// Color constants for recently viewed patients
const PATIENT_COLORS = {
  CLINIC_ADMISSION: 'rgb(233, 172, 80)', // Yellow
  HOSPITAL_ADMISSION: 'rgb(25, 147, 78)', // Green
  TRIAGE_ADMISSION: 'rgb(241, 127, 22)', // Red
  NO_ADMISSION: 'rgb(17, 114, 209)', // Blue
} as const;

async function createAndNavigateToPatient(allPatientsPage: any, api: any) {
  const newPatient = await createPatient(api, allPatientsPage.page);
  await allPatientsPage.patientTable.searchTable({
    NHN: newPatient.displayId,
    advancedSearch: false,
  });
  await allPatientsPage.patientTable.clickOnFirstRow();
  await allPatientsPage.page.waitForTimeout(1000);
  await allPatientsPage.goto();
  await allPatientsPage.recentlyViewedPatientsList.waitForFirstRecentlyViewedPatientToHaveNHN(
    newPatient.displayId,
  );
  return newPatient;
}

async function verifyRecentlyViewedPatients(
  allPatientsPage: any,
  patientStack: Array<Patient>,
  count: number = 6,
) {
  for (let i = 0; i < count; i++) {
    const expectedPatient = patientStack.pop();

    //wait for the first patient to be loaded in recently patient list
    if (i == 0 && expectedPatient) {
      await allPatientsPage.recentlyViewedPatientsList.waitForFirstRecentlyViewedPatientToHaveNHN(
        expectedPatient.nhn,
      );
    }

    const recentlyViewedPatient =
      await allPatientsPage.recentlyViewedPatientsList.getRecentlyViewedPatientByIndex(i);

    if (expectedPatient) {
      const fullName = `${expectedPatient.firstName} ${expectedPatient.lastName}`.trim();

      expect(recentlyViewedPatient.name).toBe(fullName);
      expect(recentlyViewedPatient.nhn).toBe(expectedPatient.nhn);
      expect(recentlyViewedPatient.gender).toBe(expectedPatient.sex || expectedPatient.gender);

      // Format date to match the MM/DD/YY format shown in recently viewed
      const expectedFormattedDate =
        allPatientsPage.recentlyViewedPatientsList.formatDateForRecentlyViewed(
          expectedPatient.dateOfBirth || expectedPatient.formattedDOB || '',
        );
      expect(recentlyViewedPatient.birthDate).toBe(expectedFormattedDate);
    }
  }
}

test.describe('Recently viewed patients details', () => {
  test.beforeEach(async ({ allPatientsPage }) => {
    await allPatientsPage.goto();
  });

  test('[AT-0133]Most recently viewed patient appears at the top of the list and confirms the correct patient data in the list', async ({
    allPatientsPage,
    api,
  }) => {
    const newPatient = await createAndNavigateToPatient(allPatientsPage, api);
    await expect(allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedName).toHaveText(
      newPatient.firstName + ' ' + newPatient.lastName,
    );
    await expect(allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedNHN).toHaveText(
      newPatient.displayId,
    );
    await expect(allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedGender).toHaveText(
      new RegExp(`^${newPatient.sex}$`, 'i'),
    );
    const expectedFormattedDate =
      allPatientsPage.recentlyViewedPatientsList.formatDateForRecentlyViewed(
        newPatient.dateOfBirth || '',
      );
    await expect(
      allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedBirthDate,
    ).toHaveText(expectedFormattedDate);
  });

  test('[AT-0134]Most recently viewed patient appears at the top of the list', async ({
    allPatientsPage,
    api,
  }) => {
    // Create and view first patient
    const _firstPatient = await createAndNavigateToPatient(allPatientsPage, api);

    // Create and view second patient
    const secondPatient = await createAndNavigateToPatient(allPatientsPage, api);

    // Verify second patient is at the top
    await expect(allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedName).toHaveText(
      secondPatient.firstName + ' ' + secondPatient.lastName,
    );
    await expect(allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedNHN).toHaveText(
      secondPatient.displayId,
    );
  });

  test('[AT-0135]Clicking on a recently viewed patient navigates to their details', async ({
    allPatientsPage,
    page,
    api,
  }) => {
    const newPatient = await createAndNavigateToPatient(allPatientsPage, api);

    await expect(allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedNHN).toHaveText(
      newPatient.displayId,
    );
    await allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedName.click();

    // Verify navigation to patient details
    await expect(page).toHaveURL(wildcardToRegex(routes.patients.patientDetails));
    const patientDetailsPage = new PatientDetailsPage(page);
    await expect(patientDetailsPage.healthIdText).toHaveText(newPatient.displayId);
  });

  test('[AT-0136]Recently viewed list updates when viewing same patient multiple times', async ({
    allPatientsPage,
    api,
  }) => {
    const newPatient = await createAndNavigateToPatient(allPatientsPage, api);

    // View patient second time
    await allPatientsPage.patientTable.searchTable({
      NHN: newPatient.displayId,
      advancedSearch: false,
    });
    await allPatientsPage.patientTable.clickOnFirstRow();
    await allPatientsPage.goto();
    await allPatientsPage.recentlyViewedPatientsList.waitForFirstRecentlyViewedPatientToHaveNHN(
      newPatient.displayId,
    );

    // Verify patient is still at the top
    await expect(allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedName).toHaveText(
      newPatient.firstName + ' ' + newPatient.lastName,
    );
    await expect(allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedNHN).toHaveText(
      newPatient.displayId,
    );
  });

  test('[AT-0137]Navigating to 12 patients in the patient table and then verifying the last 6 recently viewed patient list', async ({
    allPatientsPage,
  }) => {
    test.setTimeout(120000); // Set timeout to 2 minutes for this specific test

    // Stack to store patient details (LIFO - Last In, First Out)
    const patientStack: Array<Patient> = [];

    for (let i = 0; i < 12; i++) {
      if (i >= 10) {
        await allPatientsPage.page.waitForTimeout(1000); // Add wait before changing page size
        await allPatientsPage.patientTable.changePageSize(25);
      }
      // Get patient details from the table before clicking
      const row = allPatientsPage.patientTable.getRow(i);
      const patientInfo = await row.getPatientInfo();

      // Push patient details to stack
      patientStack.push(patientInfo);

      // Click on the row
      await allPatientsPage.patientTable.clickOnRow(i);
      await allPatientsPage.goto();
    }

    // Now pop the stack and verify against recently viewed patients
    // The stack is LIFO, so the last patient clicked will be at the top of recently viewed

    await verifyRecentlyViewedPatients(allPatientsPage, patientStack);

    // The recently viewed patient list is 6 patients so need to navigate to the next page
    await allPatientsPage.recentlyViewedPatientsList.navigateNext.click();

    await verifyRecentlyViewedPatients(allPatientsPage, patientStack);
  });
});

test.describe('Recently viewed patient colors', () => {
  test.beforeEach(async ({ allPatientsPage }) => {
    await allPatientsPage.goto();
  });

  test('[AT-0138]The patient with clinic admission color is yellow in recently viewed list', async ({
    allPatientsPage,
    api,
  }) => {
    const newPatient = await createPatient(api, allPatientsPage.page);
    await createClinicEncounterViaApi(api, newPatient.id);
    await allPatientsPage.patientTable.searchTable({
      NHN: newPatient.displayId,
      advancedSearch: false,
    });
    await allPatientsPage.patientTable.clickOnFirstRow();
    await allPatientsPage.goto();
    await allPatientsPage.recentlyViewedPatientsList.waitForFirstRecentlyViewedPatientToHaveColor(
      PATIENT_COLORS.CLINIC_ADMISSION,
      20000,
    );
    const color =
      await allPatientsPage.recentlyViewedPatientsList.getRecentlyViewedPatientNameColor();
    expect(color).toBe(PATIENT_COLORS.CLINIC_ADMISSION);
  });

  test('[AT-0139]The patient with hospital admission color is green in recently viewed list', async ({
    allPatientsPage,
    api,
  }) => {
    const newPatient = await createPatient(api, allPatientsPage.page);
    await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    await allPatientsPage.patientTable.searchTable({
      NHN: newPatient.displayId,
      advancedSearch: false,
    });
    await allPatientsPage.patientTable.clickOnFirstRow();
    await allPatientsPage.goto();
    await allPatientsPage.recentlyViewedPatientsList.waitForFirstRecentlyViewedPatientToHaveColor(
      PATIENT_COLORS.HOSPITAL_ADMISSION,
      20000,
    );
    const color =
      await allPatientsPage.recentlyViewedPatientsList.getRecentlyViewedPatientNameColor();
    expect(color).toBe(PATIENT_COLORS.HOSPITAL_ADMISSION);
  });

  test('[AT-0140]The patient with triage admission color is red in recently viewed list', async ({
    allPatientsPage,
    api,
  }) => {
    const newPatient = await createPatient(api, allPatientsPage.page);
    await createTriageEncounterViaApi(api, allPatientsPage.page, newPatient.id);
    await allPatientsPage.patientTable.searchTable({
      NHN: newPatient.displayId,
      advancedSearch: false,
    });
    await allPatientsPage.patientTable.clickOnFirstRow();
    await allPatientsPage.goto();
    await allPatientsPage.recentlyViewedPatientsList.waitForFirstRecentlyViewedPatientToHaveColor(
      PATIENT_COLORS.TRIAGE_ADMISSION,
      20000,
    );
    const color =
      await allPatientsPage.recentlyViewedPatientsList.getRecentlyViewedPatientNameColor();
    expect(color).toBe(PATIENT_COLORS.TRIAGE_ADMISSION);
  });

  test('[AT-0141]The patient with no admission color is blue in recently viewed list', async ({
    allPatientsPage,
    api,
  }) => {
    const newPatient = await createPatient(api, allPatientsPage.page);
    await allPatientsPage.patientTable.searchTable({
      NHN: newPatient.displayId,
      advancedSearch: false,
    });
    await allPatientsPage.patientTable.clickOnFirstRow();
    await allPatientsPage.goto();
    await allPatientsPage.recentlyViewedPatientsList.waitForFirstRecentlyViewedPatientToHaveColor(
      PATIENT_COLORS.NO_ADMISSION,
      20000,
    );
    const color =
      await allPatientsPage.recentlyViewedPatientsList.getRecentlyViewedPatientNameColor();
    expect(color).toBe(PATIENT_COLORS.NO_ADMISSION);
  });
});
