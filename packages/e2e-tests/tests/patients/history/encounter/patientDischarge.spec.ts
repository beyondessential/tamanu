import { test, expect } from '@fixtures/baseFixture';
import {
  createEncounterPrescriptionViaApi,
  createHospitalAdmissionEncounterViaAPI,
  getDrugSuggestions,
} from '@utils/apiHelpers';

test.describe('Patient discharge', () => {
  test('Only the medications selected on discharge are sent to pharmacy', async ({
    api,
    newPatient,
    patientDetailsPage,
    medicationRequestsPage,
  }) => {
    test.setTimeout(60000);

    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    // Distinct drugs so the two medications can be told apart in the active medications table.
    const [sentDrug, notSentDrug] = await getDrugSuggestions(api, 2);
    const sentPrescription = await createEncounterPrescriptionViaApi(api, encounter.id, undefined, {
      medicationId: sentDrug.id,
    });
    const notSentPrescription = await createEncounterPrescriptionViaApi(
      api,
      encounter.id,
      undefined,
      { medicationId: notSentDrug.id },
    );

    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToFirstEncounter();
    await patientDetailsPage.prepareDischargeButton.click();

    const dischargeModal = patientDetailsPage.getPrepareDischargeModal();
    await dischargeModal.waitForModalToLoad();

    // Encounter medications all start selected to send.
    await expect(dischargeModal.sendToPharmacyCheckbox(sentPrescription.id)).toBeChecked();
    await expect(dischargeModal.sendToPharmacyCheckbox(notSentPrescription.id)).toBeChecked();

    // A dispensing quantity is required for every listed medication, including the one that is not
    // being sent — prescriptions are created without one.
    await dischargeModal.setDispensingQuantity(sentPrescription.id, 12);
    await dischargeModal.setDispensingQuantity(notSentPrescription.id, 8);
    await dischargeModal.sendToPharmacyCheckbox(notSentPrescription.id).uncheck();

    await dischargeModal.finaliseDischarge();

    // Only the medication left selected is waiting to be dispensed.
    await medicationRequestsPage.goto();
    const patientRows = medicationRequestsPage.rowForPatient(newPatient.displayId);
    await expect(patientRows).toHaveCount(1);
    await expect(patientRows).toContainText(sentDrug.name);
    await expect(patientRows).not.toContainText(notSentDrug.name);
  });

  // The discharge itself must still work where nothing is being ordered — the form sends the same
  // medications payload either way, and its validation gates every discharge.
  test('A discharge that sends nothing to pharmacy still finalises', async ({
    api,
    newPatient,
    patientDetailsPage,
    medicationRequestsPage,
  }) => {
    test.setTimeout(60000);

    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    const prescription = await createEncounterPrescriptionViaApi(api, encounter.id);

    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToFirstEncounter();
    await patientDetailsPage.prepareDischargeButton.click();

    const dischargeModal = patientDetailsPage.getPrepareDischargeModal();
    await dischargeModal.waitForModalToLoad();

    await dischargeModal.setDispensingQuantity(prescription.id, 5);
    await dischargeModal.sendToPharmacyCheckbox(prescription.id).uncheck();
    await dischargeModal.finaliseDischarge();

    // A discharged encounter offers its summary in place of the discharge action.
    await patientDetailsPage.navigateToFirstEncounter();
    await expect(patientDetailsPage.dischargeSummaryButton).toBeVisible();

    await expect(medicationRequestsPage.rowForPatient(newPatient.displayId)).toHaveCount(0);
  });

  test('Finalising is blocked until a medication being sent has a dispensing quantity', async ({
    api,
    newPatient,
    patientDetailsPage,
  }) => {
    test.setTimeout(60000);

    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    const prescription = await createEncounterPrescriptionViaApi(api, encounter.id);

    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToFirstEncounter();
    await patientDetailsPage.prepareDischargeButton.click();

    const dischargeModal = patientDetailsPage.getPrepareDischargeModal();
    await dischargeModal.waitForModalToLoad();

    // Prescriptions are created without a quantity, so the row starts blank and selected to send.
    await dischargeModal.attemptFinaliseDischarge();
    await expect(dischargeModal.dispensingQuantityError(prescription.id)).toHaveText('*Required');

    // Zero is no dispense at all, so it is not enough for a row going to pharmacy either.
    await dischargeModal.setDispensingQuantity(prescription.id, 0);
    await dischargeModal.attemptFinaliseDischarge();
    await expect(dischargeModal.dispensingQuantityError(prescription.id)).toHaveText('*Required');

    await dischargeModal.setDispensingQuantity(prescription.id, 3);
    await dischargeModal.finaliseDischarge();

    await patientDetailsPage.navigateToFirstEncounter();
    await expect(patientDetailsPage.dischargeSummaryButton).toBeVisible();
  });

  test('Ordering prescriber is only active while a medication is selected to send', async ({
    api,
    newPatient,
    patientDetailsPage,
  }) => {
    test.setTimeout(60000);

    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);
    const prescription = await createEncounterPrescriptionViaApi(api, encounter.id);

    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToFirstEncounter();
    await patientDetailsPage.prepareDischargeButton.click();

    const dischargeModal = patientDetailsPage.getPrepareDischargeModal();
    await dischargeModal.waitForModalToLoad();

    // Encounter medications start selected, so there is an order to attribute from the outset.
    await expect(dischargeModal.orderingPrescriberInput).toBeEnabled();

    await dischargeModal.sendToPharmacyCheckbox(prescription.id).uncheck();
    await expect(dischargeModal.orderingPrescriberInput).toBeDisabled();

    await dischargeModal.sendToPharmacyCheckbox(prescription.id).check();
    await expect(dischargeModal.orderingPrescriberInput).toBeEnabled();
  });
});
