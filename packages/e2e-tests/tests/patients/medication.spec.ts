import { test, expect } from '../../fixtures/baseFixture';

test.describe('Medication Tab', () => {
  test.beforeEach(async ({ newPatientWithHospitalAdmission, patientDetailsPage }) => {
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
  });

  test('should navigate to medication tab within an encounter', async ({
    patientDetailsPage,
  }) => {
    const medicationPane = await patientDetailsPage.navigateToMedicationTab();
    await expect(medicationPane.medicationTable).toBeVisible();
    await expect(medicationPane.newPrescriptionButton).toBeVisible();
  });

  test('should display medication table headers', async ({
    patientDetailsPage,
  }) => {
    const medicationPane = await patientDetailsPage.navigateToMedicationTab();

    // Use toBeAttached since headers may be hidden when table is empty
    await expect(medicationPane.medicationSortHeader).toBeAttached();
    await expect(medicationPane.doseHeader).toBeAttached();
    await expect(medicationPane.frequencyHeader).toBeAttached();
    await expect(medicationPane.routeSortHeader).toBeAttached();
    await expect(medicationPane.dateSortHeader).toBeAttached();
    await expect(medicationPane.prescriberSortHeader).toBeAttached();
  });

  test('should display New prescription button', async ({
    patientDetailsPage,
  }) => {
    const medicationPane = await patientDetailsPage.navigateToMedicationTab();
    await expect(medicationPane.newPrescriptionButton).toBeVisible();
    await expect(medicationPane.newPrescriptionButton).toBeEnabled();
  });

  test('should open new prescription modal when clicking New prescription', async ({
    patientDetailsPage,
  }) => {
    test.setTimeout(60000);
    const medicationPane = await patientDetailsPage.navigateToMedicationTab();

    const modal = await medicationPane.openNewPrescriptionModal();

    // Verify modal is open with key fields visible
    await expect(modal.finaliseButton).toBeVisible();
    await expect(modal.cancelButton).toBeVisible();

    // Close without saving
    await modal.cancelButton.click();
  });
});
