import { test, expect } from '@fixtures/baseFixture';
import { createHospitalAdmissionEncounterViaAPI } from '@utils/apiHelpers';

test.describe('Send a new prescription to pharmacy', () => {
  test.describe.configure({ mode: 'parallel' });

  test('Prescribing with Send to pharmacy raises a request', async ({
    api,
    newPatient,
    patientDetailsPage,
    medicationRequestsPage,
  }) => {
    test.setTimeout(60000);

    await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);

    await patientDetailsPage.goToPatient(newPatient);
    const medicationPane = await patientDetailsPage.navigateToMedicationTab();
    const prescriptionModal = await medicationPane.openNewPrescription();

    const medicationName = await prescriptionModal.selectMedication();
    await prescriptionModal.fillClinicalDetails();

    // Send to pharmacy starts unticked, and prescription type only appears once it is ticked.
    await expect(prescriptionModal.sendToPharmacyCheckbox).not.toBeChecked();
    await expect(prescriptionModal.prescriptionTypeLabel).toBeHidden();

    await prescriptionModal.tickSendToPharmacy();

    // An admission encounter defaults to Inpatient under the shipped setting.
    await expect(prescriptionModal.prescriptionTypeOption('Inpatient')).toBeChecked();

    await prescriptionModal.setDispensingQuantity('12');
    await prescriptionModal.finalise();

    // The prescription lands on the encounter's medication table...
    await expect(medicationPane.tableBody).toContainText(medicationName);

    // ...with the Last sent column showing the new request is awaiting action.
    const lastSentCell = medicationPane.lastSentCellForMedication(medicationName);
    await expect(lastSentCell).toContainText('Active request');

    // ...and the pharmacy request is waiting on the worklist, as an inpatient prescription.
    await medicationRequestsPage.goto();
    const row = medicationRequestsPage.rowForPatient(newPatient.displayId);
    await expect(row).toBeVisible();
    await expect(row).toContainText(medicationName);
    await expect(row).toContainText('Inpatient');
  });

  test('Re-sending an already-requested medication keeps showing the outstanding request', async ({
    page,
    newPatient,
    patientDetailsPage,
    api,
  }) => {
    test.setTimeout(60000);

    await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);

    await patientDetailsPage.goToPatient(newPatient);
    const medicationPane = await patientDetailsPage.navigateToMedicationTab();
    const prescriptionModal = await medicationPane.openNewPrescription();

    const medicationName = await prescriptionModal.selectMedication();
    await prescriptionModal.fillClinicalDetails();
    await prescriptionModal.tickSendToPharmacy();
    await prescriptionModal.setDispensingQuantity('12');
    await prescriptionModal.finalise();

    await expect(medicationPane.tableBody).toContainText(medicationName);
    const lastSentCell = medicationPane.lastSentCellForMedication(medicationName);
    await expect(lastSentCell).toContainText('Active request');

    // The cell's tooltip carries the full sent-at date and time, precise enough to distinguish
    // this first send from the second one below (a regression that surfaced the most recent send
    // instead of the outstanding one would still show "Active request" text, just a later time).
    await lastSentCell.hover();
    const originalTooltipText = await page.getByTestId('tooltip-b4e8').innerText();

    // Re-send the same medication before the first request has been dispensed — the send-to-
    // pharmacy modal warns it was already ordered, since we haven't waited past the
    // medicationAlreadyOrderedConfirmationTimeout setting (24 hours by default).
    await medicationPane.shoppingCartButton.waitFor({ state: 'visible' });
    await medicationPane.shoppingCartButton.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Send to pharmacy');

    // Only the one prescription created above is on this encounter, so selecting everything
    // selects it — matches the pattern in medication.spec.ts's "Send prescription to pharmacy".
    const prescriptionCheckbox = page.getByTestId('select-all-checkbox-controlcheck').first();
    await prescriptionCheckbox.waitFor({ state: 'visible' });
    await prescriptionCheckbox.click();

    const quantityInput = page.getByTestId('textinput-rxbh').locator('input').first();
    await expect(quantityInput).toHaveValue('12');

    await page.getByRole('button', { name: 'Send' }).click();
    await expect(dialog).toContainText('already been sent');
    await page.getByRole('button', { name: 'Confirm' }).click();
    await expect(dialog).toContainText('Request sent');
    await page.getByTestId('confirmbutton-tok1').click();
    await expect(dialog).toBeHidden();

    // The Last sent column still surfaces the original, still-undispensed request rather than
    // jumping to the second send's date/time — that's the whole point of pharmacyRequestAt: it
    // shows the request awaiting action, not merely the most recent one.
    await expect(lastSentCell).toContainText('Active request');
    await lastSentCell.hover();
    await expect(page.getByTestId('tooltip-b4e8')).toHaveText(originalTooltipText);
  });

  test('Prescribing without Send to pharmacy raises no request', async ({
    api,
    newPatient,
    patientDetailsPage,
    medicationRequestsPage,
  }) => {
    test.setTimeout(60000);

    await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);

    await patientDetailsPage.goToPatient(newPatient);
    const medicationPane = await patientDetailsPage.navigateToMedicationTab();
    const prescriptionModal = await medicationPane.openNewPrescription();

    const medicationName = await prescriptionModal.selectMedication();
    await prescriptionModal.fillClinicalDetails();
    await prescriptionModal.finalise();

    await expect(medicationPane.tableBody).toContainText(medicationName);

    // With nothing sent to pharmacy, the Last sent column has no request to show.
    const lastSentCell = medicationPane.lastSentCellForMedication(medicationName);
    await expect(lastSentCell).toContainText('n/a');

    await medicationRequestsPage.goto();
    await expect(medicationRequestsPage.rowForPatient(newPatient.displayId)).toBeHidden();
  });
});
