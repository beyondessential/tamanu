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
    const sentPrescription = await createEncounterPrescriptionViaApi(api, encounter.id, {
      medicationId: sentDrug.id,
    });
    const notSentPrescription = await createEncounterPrescriptionViaApi(api, encounter.id, {
      medicationId: notSentDrug.id,
    });

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
});
