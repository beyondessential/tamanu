import { test } from '../../fixtures/baseFixture';
import { expect } from '@playwright/test';
import { PatientDetailsPage } from '../../pages/patients/PatientDetailsPage/PatientDetailsPage';
import { Patient } from '../../types/Patient';
import { RecentlyViewedPatientsList } from '../../pages/patients/RecentlyViewedPatientsList';

// Color constants for recently viewed patients
const PATIENT_COLORS = {
  CLINIC_ADMISSION: 'rgb(233, 172, 80)', // Yellow
  HOSPITAL_ADMISSION: 'rgb(25, 147, 78)', // Green
  TRIAGE_ADMISSION: 'rgb(241, 127, 22)', // Red
  NO_ADMISSION: 'rgb(17, 114, 209)', // Blue
} as const;


async function verifyRecentlyViewedPatients(
  allPatientsPage: any,
  patientStack: Array<Patient>,
  count: number = 6,
) {
  for (let i = 0; i < count; i++) {
    const expectedPatient = patientStack.pop();

    const recentlyViewedPatient =
      await allPatientsPage.recentlyViewedPatientsList.getRecentlyViewedPatientByIndex(i);

    if (expectedPatient) {
      const fullName = `${expectedPatient.firstName} ${expectedPatient.lastName}`.trim();

      expect(recentlyViewedPatient.name).toBe(fullName);
      expect(recentlyViewedPatient.nhn).toBe(expectedPatient.nhn);
      expect(recentlyViewedPatient.gender).toBe(expectedPatient.sex || expectedPatient.gender);

      // Format date to match the MM/DD/YY format shown in recently viewed
      const expectedFormattedDate =
        RecentlyViewedPatientsList.formatDateForRecentlyViewed(
          expectedPatient.dateOfBirth || expectedPatient.formattedDOB || '',
        );
      expect(recentlyViewedPatient.birthDate).toBe(expectedFormattedDate);
    }
  }
}

test.describe('Recently viewed patients details', () => {
  test.beforeEach(async ({ newPatient,patientDetailsPage}) => {
    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.confirmPatientDetailsPageHasLoaded();
    const allPatientsPage = await patientDetailsPage.navigateToAllPatientsPage();
    await allPatientsPage.waitForPageToLoad();
  });

  test('[AT-0133]Most recently viewed patient appears at the top of the list and confirms the correct patient data in the list', async ({
    newPatient,
    allPatientsPage
  }) => {
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
      RecentlyViewedPatientsList.formatDateForRecentlyViewed(
        newPatient.dateOfBirth || '',
      );
    await expect(
      allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedBirthDate,
    ).toHaveText(expectedFormattedDate);
  });

  test('[AT-0135]Clicking on a recently viewed patient navigates to their details', async ({
    newPatient,
    allPatientsPage,
    page,
  }) => {

    await expect(allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedNHN).toHaveText(
      newPatient.displayId,
    );
    await allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedName.click();

    // Verify navigation to patient details
    const patientDetailsPage = new PatientDetailsPage(page);
    await expect(patientDetailsPage.healthIdText).toHaveText(newPatient.displayId);
  });

  test('[AT-0136]Recently viewed list updates when viewing same patient multiple times', async ({newPatient,
    allPatientsPage
  }) => {
    // View patient second time
    await allPatientsPage.navigateToPatientDetailsPage(newPatient.displayId);
    await allPatientsPage.goto();
    await expect(allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedNHN).toHaveText(newPatient.displayId);
    await expect(allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedName).toHaveText(
      `${newPatient.firstName} ${newPatient.lastName}`,
    );
    await expect(allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedGender).toHaveText(
      new RegExp(`^${newPatient.sex}$`, 'i'),
    );
    await expect(allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedBirthDate).toHaveText(
      RecentlyViewedPatientsList.formatDateForRecentlyViewed(newPatient.dateOfBirth || ''),
    );

  });
});

test.describe('Recently viewed patients pagination', () => {
  test(
    '[AT-0137]Navigating to 12 patients in the patient table and then verifying the last 6 recently viewed patient list',
    async ({ allPatientsPage }) => {
      test.setTimeout(120000); // Set timeout to 2 minutes for this specific test
      await allPatientsPage.goto();

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
        const patientDetailsPage = new PatientDetailsPage(allPatientsPage.page);
        await patientDetailsPage.confirmPatientDetailsPageHasLoaded();
        await patientDetailsPage.navigateToAllPatientsPage();
      }

      // Verify the first 6 patients (most recently viewed)
      await verifyRecentlyViewedPatients(allPatientsPage, patientStack);

      // The recently viewed patient list is 6 patients so need to navigate to the next page
      await allPatientsPage.recentlyViewedPatientsList.navigateNext.click();

      // Wait for the page to load after navigation
      await allPatientsPage.page.waitForLoadState('networkidle');

      await verifyRecentlyViewedPatients(allPatientsPage, patientStack);
    },
  );
});

test.describe('Recently viewed patient colors', () => {
  test.beforeEach(async ({ allPatientsPage }) => {
    await allPatientsPage.goto();
  });

  test('[AT-0138]The patient with clinic admission color is yellow in recently viewed list', async ({newPatientWithClinicAdmission,
    allPatientsPage,patientDetailsPage
  }) => {
    await patientDetailsPage.goToPatient(newPatientWithClinicAdmission);
    await patientDetailsPage.confirmPatientDetailsPageHasLoaded();
    await patientDetailsPage.navigateToAllPatientsPage();
    const color =
      await allPatientsPage.recentlyViewedPatientsList.getRecentlyViewedPatientNameColor();
    expect(color).toBe(PATIENT_COLORS.CLINIC_ADMISSION);
  });

  test('[AT-0139]The patient with hospital admission color is green in recently viewed list', async ({
    newPatientWithHospitalAdmission,
    allPatientsPage,patientDetailsPage
  }) => {
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.confirmPatientDetailsPageHasLoaded();
    await patientDetailsPage.navigateToAllPatientsPage();
    await allPatientsPage.goto();
    const color =
      await allPatientsPage.recentlyViewedPatientsList.getRecentlyViewedPatientNameColor();
    expect(color).toBe(PATIENT_COLORS.HOSPITAL_ADMISSION);
  });

  test('[AT-0140]The patient with triage admission color is red in recently viewed list', async ({newPatientWithTriageAdmission,
    allPatientsPage,patientDetailsPage
  }) => {       
    await patientDetailsPage.goToPatient(newPatientWithTriageAdmission);
    await patientDetailsPage.confirmPatientDetailsPageHasLoaded();
    await patientDetailsPage.navigateToAllPatientsPage();
    const color =
      await allPatientsPage.recentlyViewedPatientsList.getRecentlyViewedPatientNameColor();
    expect(color).toBe(PATIENT_COLORS.TRIAGE_ADMISSION);
  });

  test('[AT-0141]The patient with no admission color is blue in recently viewed list', async ({newPatient,
    allPatientsPage,patientDetailsPage
  }) => {
    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.confirmPatientDetailsPageHasLoaded();
    await patientDetailsPage.navigateToAllPatientsPage();
    const color =
      await allPatientsPage.recentlyViewedPatientsList.getRecentlyViewedPatientNameColor();
    expect(color).toBe(PATIENT_COLORS.NO_ADMISSION);
  });
});
