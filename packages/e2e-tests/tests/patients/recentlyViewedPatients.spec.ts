import { test, expect } from '../../fixtures/test';
import { createPatient } from '../../fixtures/api';
import { Patient } from '@tamanu/database';
import { toIsoDate } from '@helpers/dates';
import { RecentlyViewedPatients } from '@pages/patients/RecentlyViewedPatients';
import { PatientDetailsPage } from '@pages/patients/PatientDetailsPage';

// Color constants for recently viewed patients
const PATIENT_COLORS = {
  CLINIC_ADMISSION: 'rgb(233, 172, 80)', // Yellow
  HOSPITAL_ADMISSION: 'rgb(25, 147, 78)', // Green
  TRIAGE_ADMISSION: 'rgb(241, 127, 22)', // Red
  NO_ADMISSION: 'rgb(17, 114, 209)', // Blue
} as const;

async function verifyRecentlyViewedPatients(
  recentlyViewed: RecentlyViewedPatients,
  patientStack: Patient[],
  count: number = 6,
) {
  for (let i = 0; i < count; i++) {
    const expectedPatient = patientStack.pop();
    if (!expectedPatient) continue;

    const fullName = `${expectedPatient.firstName} ${expectedPatient.lastName}`.trim();
    await expect(recentlyViewed.cardTitle(i)).toHaveText(fullName);
    await expect(recentlyViewed.cardText(i)).toHaveText(expectedPatient.displayId);
    await expect(recentlyViewed.capitalizedText(i)).toHaveText(
      new RegExp(`^${expectedPatient.sex}$`, 'i'),
    );

    const rawDob = expectedPatient.dateOfBirth;
    const expectedFormattedDate = RecentlyViewedPatients.formatDateForRecentlyViewed(
      rawDob != null ? toIsoDate(String(rawDob)) : '',
    );
    await expect(recentlyViewed.dateDisplay(i)).toHaveText(expectedFormattedDate);
  }
}

test.describe('Recently viewed patients details', () => {
  test.beforeEach(async ({ newPatient, patientDetailsPage, allPatientsPage }) => {
    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.confirmPageLoaded();
    await patientDetailsPage.navigateToAllPatients();
    await allPatientsPage.waitForPageToLoad();
  });

  test('[AT-0133]Most recently viewed patient appears at the top of the list and confirms the correct patient data in the list', async ({
    newPatient,
    page,
  }) => {
    const recentlyViewed = new RecentlyViewedPatients(page);
    await expect(recentlyViewed.cardTitle(0)).toHaveText(
      newPatient.firstName + ' ' + newPatient.lastName,
    );
    await expect(recentlyViewed.cardText(0)).toHaveText(newPatient.displayId);
    await expect(recentlyViewed.capitalizedText(0)).toHaveText(
      new RegExp(`^${newPatient.sex}$`, 'i'),
    );
    const expectedFormattedDate = RecentlyViewedPatients.formatDateForRecentlyViewed(
      toIsoDate(String(newPatient.dateOfBirth ?? '')),
    );
    await expect(recentlyViewed.dateDisplay(0)).toHaveText(expectedFormattedDate);
  });

  test('[AT-0135]Clicking on a recently viewed patient navigates to their details', async ({
    newPatient,
    page,
  }) => {
    const recentlyViewed = new RecentlyViewedPatients(page);
    await expect(recentlyViewed.cardText(0)).toHaveText(newPatient.displayId);
    await recentlyViewed.cardTitle(0).click();

    const patientDetailsPage = new PatientDetailsPage(page);
    await expect(patientDetailsPage.healthIdText).toHaveText(newPatient.displayId);
  });

  test('[AT-0136]Recently viewed list updates when viewing same patient multiple times', async ({
    newPatient,
    allPatientsPage,
    page,
  }) => {
    const recentlyViewed = new RecentlyViewedPatients(page);
    await allPatientsPage.searchAndSelectByNHN(newPatient.displayId);
    await allPatientsPage.goto();
    await expect(recentlyViewed.cardText(0)).toHaveText(newPatient.displayId);
    await expect(recentlyViewed.cardTitle(0)).toHaveText(
      `${newPatient.firstName} ${newPatient.lastName}`,
    );
    await expect(recentlyViewed.capitalizedText(0)).toHaveText(
      new RegExp(`^${newPatient.sex}$`, 'i'),
    );
    await expect(recentlyViewed.dateDisplay(0)).toHaveText(
      RecentlyViewedPatients.formatDateForRecentlyViewed(
        toIsoDate(String(newPatient.dateOfBirth ?? '')),
      ),
    );
  });
});

test.describe('Recently viewed patients pagination', () => {
  test(
    '[AT-0137]Navigating to 12 patients in the patient table and then verifying the last 6 recently viewed patient list',
    async ({ allPatientsPage, api, page, patientDetailsPage }) => {
      test.setTimeout(120000); // Set timeout to 2 minutes for this specific test
      await allPatientsPage.goto();

      const patientStack: Patient[] = [];
      const recentlyViewed = new RecentlyViewedPatients(page);

      for (let i = 0; i < 12; i++) {
        const patient = await createPatient(api, page);
        patientStack.push(patient);

        await allPatientsPage.searchAndSelectByNHN(patient.displayId);
        await patientDetailsPage.confirmPageLoaded();
        await patientDetailsPage.navigateToAllPatients();
        await allPatientsPage.waitForPageToLoad();
      }

      await verifyRecentlyViewedPatients(recentlyViewed, patientStack);

      await recentlyViewed.navigateNextButton.click();

      await page.waitForLoadState('networkidle');

      await verifyRecentlyViewedPatients(recentlyViewed, patientStack);
    },
  );
});

test.describe('Recently viewed patient colors', () => {
  test.beforeEach(async ({ allPatientsPage }) => {
    await allPatientsPage.goto();
  });

  test('[AT-0138]The patient with clinic admission color is yellow in recently viewed list', async ({
    newPatientWithClinicAdmission,
    patientDetailsPage,
    page,
  }) => {
    await patientDetailsPage.goToPatient(newPatientWithClinicAdmission);
    await patientDetailsPage.confirmPageLoaded();
    await patientDetailsPage.navigateToAllPatients();
    const recentlyViewed = new RecentlyViewedPatients(page);
    const color = await recentlyViewed.cardTitle(0).evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBe(PATIENT_COLORS.CLINIC_ADMISSION);
  });

  test('[AT-0139]The patient with hospital admission color is green in recently viewed list', async ({
    newPatientWithHospitalAdmission,
    allPatientsPage,
    patientDetailsPage,
    page,
  }) => {
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.confirmPageLoaded();
    await patientDetailsPage.navigateToAllPatients();
    await allPatientsPage.goto();
    const recentlyViewed = new RecentlyViewedPatients(page);
    const color = await recentlyViewed.cardTitle(0).evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBe(PATIENT_COLORS.HOSPITAL_ADMISSION);
  });

  test('[AT-0140]The patient with triage admission color is red in recently viewed list', async ({
    newPatientWithTriageAdmission,
    patientDetailsPage,
    page,
  }) => {
    await patientDetailsPage.goToPatient(newPatientWithTriageAdmission);
    await patientDetailsPage.confirmPageLoaded();
    await patientDetailsPage.navigateToAllPatients();
    const recentlyViewed = new RecentlyViewedPatients(page);
    const color = await recentlyViewed.cardTitle(0).evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBe(PATIENT_COLORS.TRIAGE_ADMISSION);
  });

  test('[AT-0141]The patient with no admission color is blue in recently viewed list', async ({
    newPatient,
    patientDetailsPage,
    page,
  }) => {
    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.confirmPageLoaded();
    await patientDetailsPage.navigateToAllPatients();
    const recentlyViewed = new RecentlyViewedPatients(page);
    const color = await recentlyViewed.cardTitle(0).evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBe(PATIENT_COLORS.NO_ADMISSION);
  });
});
