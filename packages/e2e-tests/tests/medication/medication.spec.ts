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

  test('Modify prescription then dispense', async ({
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

    // Modify the fill's prescription details (dose, route + mandatory reason) before dispensing.
    await dispenseModal.modifyPrescription(0);

    // Dispensing then proceeds, recording the modification on the dispense record.
    await dispenseModal.dispenseWithoutLabelsButton.click();

    await expect(page.getByText('Medication successfully dispensed')).toBeVisible();
  });

  test('View modify history after dispensing with a modification', async ({
    page,
    api,
    newPatient,
    medicationRequestsPage,
    medicationDispensesPage,
  }) => {
    test.setTimeout(60000);

    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    const prescription = await createEncounterPrescriptionViaApi(api, encounter.id);
    await createPharmacyOrderViaApi(api, page, encounter.id, prescription.id);

    await medicationRequestsPage.goto();

    const dispenseModal = await medicationRequestsPage.clickRowForPatient(newPatient.displayId);
    await dispenseModal.waitForModalToLoad();
    await dispenseModal.modifyPrescription(0);
    await dispenseModal.dispenseWithoutLabelsButton.click();
    await expect(page.getByText('Medication successfully dispensed')).toBeVisible();

    // The modified fill appears in the dispensed medications listing; its row menu exposes
    // "View modify history", which opens the change history modal.
    await medicationDispensesPage.goto();
    await medicationDispensesPage.openModifyHistoryForPatient(newPatient.displayId);

    // The modal contrasts the current (pharmacy-modified) details against the original prescription.
    await expect(page.getByRole('dialog')).toContainText('Modify prescription history');
    await expect(medicationDispensesPage.historyModalCurrentCard).toBeVisible();
    await expect(medicationDispensesPage.historyModalOriginalCard).toBeVisible();
    await expect(medicationDispensesPage.historyModalCurrentCard).toContainText(
      'Reason for modification',
    );
    await expect(medicationDispensesPage.historyModalOriginalCard).toContainText(
      'Original prescriber',
    );
  });

  test('Modify prescription to a variable dose then dispense', async ({
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

    // Ticking variable dose clears + disables the dose field; dispensing still succeeds.
    await dispenseModal.modifyToVariableDose(0);
    await dispenseModal.dispenseWithoutLabelsButton.click();

    await expect(page.getByText('Medication successfully dispensed')).toBeVisible();
  });

  test('Dispensed medications table marks a modified fill with an asterisk and footnote', async ({
    page,
    api,
    newPatient,
    medicationRequestsPage,
    medicationDispensesPage,
  }) => {
    test.setTimeout(60000);

    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    const prescription = await createEncounterPrescriptionViaApi(api, encounter.id);
    await createPharmacyOrderViaApi(api, page, encounter.id, prescription.id);

    await medicationRequestsPage.goto();

    const dispenseModal = await medicationRequestsPage.clickRowForPatient(newPatient.displayId);
    await dispenseModal.waitForModalToLoad();
    await dispenseModal.modifyPrescription(0);
    await dispenseModal.dispenseWithoutLabelsButton.click();
    await expect(page.getByText('Medication successfully dispensed')).toBeVisible();

    await medicationDispensesPage.goto();

    // The modified fill's row is flagged with an asterisk, and the table shows the footnote.
    const row = medicationDispensesPage.rowForPatient(newPatient.displayId);
    await expect(row).toBeVisible();
    await expect(row).toContainText('*');
    await expect(medicationDispensesPage.modifiedFootnote).toBeVisible();
  });

  test('MAR shows a "View change" link for a modified fill that opens the change history', async ({
    page,
    api,
    newPatient,
    medicationRequestsPage,
    marPage,
  }) => {
    test.setTimeout(60000);

    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    const prescription = await createEncounterPrescriptionViaApi(api, encounter.id);
    await createPharmacyOrderViaApi(api, page, encounter.id, prescription.id);

    await medicationRequestsPage.goto();

    const dispenseModal = await medicationRequestsPage.clickRowForPatient(newPatient.displayId);
    await dispenseModal.waitForModalToLoad();
    // Modifying auto-adds a pharmacy note and flags it for MAR display, which is what surfaces the
    // "View change" link on the MAR row.
    await dispenseModal.modifyPrescription(0);
    await dispenseModal.dispenseWithoutLabelsButton.click();
    await expect(page.getByText('Medication successfully dispensed')).toBeVisible();

    // The encounter's MAR row for the modified medication exposes a "View change" link that opens
    // the same change-history modal as the dispensed medications listing.
    await marPage.goto(newPatient.id, encounter.id);
    await marPage.openViewChange();

    await expect(page.getByRole('dialog')).toContainText('Modify prescription history');
    await expect(marPage.historyModalCurrentCard).toBeVisible();
    await expect(marPage.historyModalOriginalCard).toBeVisible();
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
