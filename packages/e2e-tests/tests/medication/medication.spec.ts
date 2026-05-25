import { test, expect } from '@fixtures/baseFixture';
import {
  createHospitalAdmissionEncounterViaAPI,
  createEncounterPrescriptionViaApi,
  createPharmacyOrderViaApi,
} from '@utils/apiHelpers';

test.describe('Medication requests', () => {
  test.describe.configure({ mode: 'parallel' });

  test('Dispense medication without labels', async ({
    page,
    api,
    newPatient,
    medicationRequestsPage,
  }) => {
    test.setTimeout(60000);

    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    const prescription = await createEncounterPrescriptionViaApi(api, encounter.id);
    await createPharmacyOrderViaApi(api, page, encounter.id, prescription.id);

    await medicationRequestsPage.goto();

    const dispenseModal = await medicationRequestsPage.clickRowForPatient(newPatient.displayId);
    await dispenseModal.waitForModalToLoad();

    // Patient context panel should be visible
    await expect(dispenseModal.patientSummaryPanel).toBeVisible();

    // Quantity and instructions are auto-populated from the prescription
    await dispenseModal.dispenseWithoutLabelsButton.click();

    await expect(page.getByText('Medication successfully dispensed')).toBeVisible();
  });

  test('Review and print labels flow', async ({
    page,
    api,
    newPatient,
    medicationRequestsPage,
  }) => {
    test.setTimeout(60000);

    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    const prescription = await createEncounterPrescriptionViaApi(api, encounter.id);
    await createPharmacyOrderViaApi(api, page, encounter.id, prescription.id);

    await medicationRequestsPage.goto();

    const dispenseModal = await medicationRequestsPage.clickRowForPatient(newPatient.displayId);
    await dispenseModal.waitForModalToLoad();

    // Advance to review step
    await dispenseModal.reviewAndPrintButton.click();

    // Review step title
    await expect(page.getByRole('dialog')).toContainText('Dispense medication & print label');
    await expect(dispenseModal.backButton).toBeVisible();
    await expect(dispenseModal.dispenseAndPrintButton).toBeVisible();

    // Return to dispense step
    await dispenseModal.backButton.click();

    await expect(page.getByRole('dialog')).toContainText('Dispense medication');
    await expect(dispenseModal.dispenseWithoutLabelsButton).toBeVisible();
    await expect(dispenseModal.reviewAndPrintButton).toBeVisible();

    // Close the modal
    await dispenseModal.cancelButton.click();
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});
