import { test, expect } from '../../../../fixtures/baseFixture';
import { getUser } from '@utils/apiHelpers';

test.describe('Encounter Medication Tests', () => {
  let user: { displayName: string; [key: string]: any };

  test.beforeEach(async ({ newPatientWithHospitalAdmission, patientDetailsPage, api }) => {
    user = await getUser(api);
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.navigateToMedicationTab();
  });

  test.describe('Create Prescription', () => {
    test('should display empty medication table for new encounter', async ({
      patientDetailsPage,
    }) => {
      const medicationPane = patientDetailsPage.encounterMedicationPane!;
      await expect(medicationPane.medicationTable).toBeVisible();
      await expect(medicationPane.newPrescriptionButton).toBeVisible();
    });

    test('should prescribe a medication with required fields', async ({
      patientDetailsPage,
    }) => {
      test.setTimeout(60000);
      const medicationPane = patientDetailsPage.encounterMedicationPane!;

      // Open the new prescription modal (handles PrescriptionTypeModal if it appears)
      const modal = await medicationPane.openNewPrescriptionModal();

      // Fill required fields and finalise
      const values = await modal.fillRequiredFields();
      await modal.finaliseButton.click();
      await modal.waitForModalToClose();

      // Verify medication appears in the table
      await medicationPane.waitForPaneToLoad();
      await medicationPane.waitForMedicationRowsToEqual(1);
      const firstRow = medicationPane.medicationRows.first();
      await expect(firstRow).toBeVisible();

      // Verify the medication name appears in the row
      if (values.medication) {
        await expect(firstRow).toContainText(values.medication);
      }
    });

    test('should prescribe a medication with all fields', async ({
      patientDetailsPage,
    }) => {
      test.setTimeout(60000);
      const medicationPane = patientDetailsPage.encounterMedicationPane!;

      const modal = await medicationPane.openNewPrescriptionModal();

      // Fill required fields
      const values = await modal.fillRequiredFields();

      // Fill optional fields
      await modal.fillIndication('Test indication');
      await modal.fillNotes('Test prescription notes');

      await modal.finaliseButton.click();
      await modal.waitForModalToClose();

      // Verify medication appears in the table
      await medicationPane.waitForPaneToLoad();
      await medicationPane.waitForMedicationRowsToEqual(1);

      if (values.medication) {
        await expect(medicationPane.medicationRows.first()).toContainText(values.medication);
      }
    });

    test('should not allow creating a prescription without required fields', async ({
      patientDetailsPage,
    }) => {
      test.setTimeout(60000);
      const medicationPane = patientDetailsPage.encounterMedicationPane!;

      const modal = await medicationPane.openNewPrescriptionModal();

      // Try to submit without filling required fields
      await modal.finaliseButton.click();

      // Modal should remain open (validation prevents submission)
      await expect(modal.finaliseButton).toBeVisible();
    });

    test('should allow cancelling prescription creation', async ({
      patientDetailsPage,
    }) => {
      test.setTimeout(60000);
      const medicationPane = patientDetailsPage.encounterMedicationPane!;

      const modal = await medicationPane.openNewPrescriptionModal();

      // Fill some fields
      await modal.selectMedication({ selectFirst: true });

      // Cancel
      await modal.cancelButton.click();

      // Modal should close and no medication should appear
      await medicationPane.waitForPaneToLoad();
      // The table body always renders an empty-state status row, so expect exactly 1 row
      await expect(medicationPane.medicationRows).toHaveCount(1);
      await expect(medicationPane.medicationRows.first()).toContainText('No medications');
    });

    test('should prescribe multiple medications', async ({
      patientDetailsPage,
    }) => {
      test.setTimeout(120000);
      const medicationPane = patientDetailsPage.encounterMedicationPane!;

      // Create first medication
      const modal1 = await medicationPane.openNewPrescriptionModal();
      await modal1.fillAndFinalise();
      await medicationPane.waitForPaneToLoad();
      await medicationPane.waitForMedicationRowsToEqual(1);

      // Create second medication
      const modal2 = await medicationPane.openNewPrescriptionModal();
      await modal2.fillAndFinalise();
      await medicationPane.waitForPaneToLoad();
      await medicationPane.waitForMedicationRowsToEqual(2);

      // Verify both medications appear
      const rowCount = await medicationPane.medicationRows.count();
      expect(rowCount).toBe(2);
    });
  });

  test.describe('Medication Table', () => {
    test('should display correct table headers', async ({
      patientDetailsPage,
    }) => {
      const medicationPane = patientDetailsPage.encounterMedicationPane!;
      // Use toBeAttached instead of toBeVisible since headers may be hidden when table is empty
      await expect(medicationPane.medicationSortHeader).toBeAttached();
      await expect(medicationPane.doseHeader).toBeAttached();
      await expect(medicationPane.frequencyHeader).toBeAttached();
      await expect(medicationPane.routeSortHeader).toBeAttached();
      await expect(medicationPane.dateSortHeader).toBeAttached();
      await expect(medicationPane.prescriberSortHeader).toBeAttached();
    });

    test('should display prescriber name after prescribing', async ({
      patientDetailsPage,
    }) => {
      test.setTimeout(60000);
      const medicationPane = patientDetailsPage.encounterMedicationPane!;

      const modal = await medicationPane.openNewPrescriptionModal();
      await modal.fillAndFinalise();
      await medicationPane.waitForPaneToLoad();
      await medicationPane.waitForMedicationRowsToEqual(1);

      // Verify the prescriber name is shown
      await expect(medicationPane.medicationRows.first()).toContainText(user.displayName);
    });
  });
});
